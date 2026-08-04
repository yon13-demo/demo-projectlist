// Opt out of static generation — these routes always need live DB/KV access.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyQrToken } from "@/lib/qr";

const clockInSchema = z.object({
  qrToken: z.string().min(1),
  deviceInfo: z.string().optional(),
});

// POST /api/v1/sessions/clock-in
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = clockInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { qrToken, deviceInfo } = parsed.data;
  const qrResult = await verifyQrToken(qrToken);
  if (!qrResult || !qrResult.ok) {
    return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 400 });
  }

  const userId = session.user.id;

  // Check if user already has an active session
  const activeSession = await prisma.session.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
  });

  if (activeSession) {
    return NextResponse.json(
      { error: "You already have an active work session. Clock out first." },
      { status: 409 }
    );
  }

  // Find target project using payload.projectId
  const project = await prisma.project.findUnique({
    where: { id: qrResult.payload.projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Target project does not exist" }, { status: 404 });
  }

  // Create new session
  const newSession = await prisma.session.create({
    data: {
      userId,
      projectId: project.id,
      deviceInfo: deviceInfo ?? req.headers.get("user-agent") ?? undefined,
      status: "ACTIVE",
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          client: true,
        },
      },
    },
  });

  return NextResponse.json({ session: newSession }, { status: 201 });
}
