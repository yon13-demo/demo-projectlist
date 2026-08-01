// Opt out of static generation — these routes always need live DB/KV access.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { clearUserActive } from "@/lib/kv";

const clockOutSchema = z.object({
  completedTaskIds: z.array(z.string().uuid()).optional().default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const parsed = clockOutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { completedTaskIds } = parsed.data;

  const activeSession = await prisma.workSession.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (!activeSession) {
    return NextResponse.json({ error: "No active session to clock out of." }, { status: 404 });
  }

  const clockOut = new Date();
  const durationMins = Math.max(
    0,
    Math.round((clockOut.getTime() - activeSession.clockIn.getTime()) / 60000)
  );

  const [updatedSession] = await prisma.$transaction([
    prisma.workSession.update({
      where: { id: activeSession.id },
      data: { clockOut, durationMins, status: "COMPLETED" },
    }),
    ...(completedTaskIds.length > 0
      ? [
          prisma.task.updateMany({
            where: {
              id: { in: completedTaskIds },
              projectId: activeSession.projectId,
              assignedUserId: userId,
            },
            data: { isCompleted: true },
          }),
        ]
      : []),
  ]);

  await clearUserActive(userId);

  // Recompute project progress from task completion ratio.
  const tasks = await prisma.task.findMany({
    where: { projectId: activeSession.projectId },
    select: { isCompleted: true },
  });
  if (tasks.length > 0) {
    const progressPercentage = Math.round(
      (tasks.filter((t: { isCompleted: boolean }) => t.isCompleted).length / tasks.length) * 100
    );
    await prisma.project.update({
      where: { id: activeSession.projectId },
      data: { progressPercentage },
    });
  }

  // await pusher.trigger("activity-feed", "clock-out", { userId, ... });

  return NextResponse.json({ session: updatedSession });
}
