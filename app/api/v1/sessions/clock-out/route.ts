// Opt out of static generation — these routes always need live DB/KV access.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const clockOutSchema = z.object({
  completedTaskIds: z.array(z.string()).optional().default([]),
});

// POST /api/v1/sessions/clock-out
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  const activeSession = await prisma.session.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
  });

  if (!activeSession) {
    return NextResponse.json({ error: "No active session found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = clockOutSchema.safeParse(body);
  const completedTaskIds = parsed.success ? parsed.data.completedTaskIds : [];

  const clockOut = new Date();

  // Execute database operations in a transaction
  const [updatedSession] = await prisma.$transaction([
    prisma.session.update({
      where: { id: activeSession.id },
      data: { clockOut, status: "COMPLETED" },
    }),
    ...(completedTaskIds.length > 0
      ? [
          prisma.task.updateMany({
            where: {
              id: { in: completedTaskIds },
              projectId: activeSession.projectId,
            },
            data: { isCompleted: true },
          }),
        ]
      : []),
  ]);

  // Calculate duration in minutes for response payload
  const durationMs = clockOut.getTime() - new Date(activeSession.clockIn).getTime();
  const durationMins = Math.floor(durationMs / (1000 * 60));

  return NextResponse.json({
    session: {
      ...updatedSession,
      durationMins,
    },
  });
}
