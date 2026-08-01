import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyQrToken } from "@/lib/qr";
import { claimNonce, markUserActive } from "@/lib/kv";

const clockInSchema = z.object({
  qrToken: z.string().min(1),
  deviceInfo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // ---- 0. Auth -------------------------------------------------------
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = clockInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { qrToken, deviceInfo } = parsed.data;

  // ---- 1 & 2. Decode + verify signature/age (lib/qr.ts) --------------
  const verification = verifyQrToken(qrToken);
  if (!verification.ok) {
    const statusByError = { MALFORMED: 400, EXPIRED: 401, BAD_SIGNATURE: 401 } as const;
    const messageByError = {
      MALFORMED: "QR payload could not be parsed.",
      EXPIRED: "This QR code has expired. Ask the station to refresh it and rescan.",
      BAD_SIGNATURE: "QR signature is invalid.",
    } as const;
    return NextResponse.json(
      { error: messageByError[verification.error] },
      { status: statusByError[verification.error] }
    );
  }
  const { payload } = verification;

  // ---- 3. Atomic replay check in Vercel KV ---------------------------
  const claimed = await claimNonce(payload.nonce);
  if (!claimed) {
    return NextResponse.json(
      { error: "Replay Attack Detected: this QR code has already been used." },
      { status: 409 }
    );
  }

  // ---- 4. Confirm the project referenced in the token exists ---------
  const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found for this QR code." }, { status: 404 });
  }

  // ---- 5. Prevent overlapping active sessions for this user ----------
  const existingActive = await prisma.workSession.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (existingActive) {
    return NextResponse.json(
      {
        error: "You already have an active session. Clock out before starting a new one.",
        activeSession: existingActive,
      },
      { status: 409 }
    );
  }

  // ---- 6. Create the session ------------------------------------------
  const workSession = await prisma.workSession.create({
    data: {
      userId,
      projectId: project.id,
      qrPayloadUsed: qrToken,
      deviceInfo: deviceInfo ?? req.headers.get("user-agent") ?? undefined,
      status: "ACTIVE",
    },
  });

  await markUserActive(userId, workSession.id);

  // A real-time broadcast (Pusher/Supabase Realtime) would fire here so
  // the dashboard's Live Activity Stream updates for every connected
  // client without a page refresh:
  //
  //   await pusher.trigger("activity-feed", "clock-in", {
  //     userId, userName: session.user.name, projectId: project.id,
  //     projectTitle: project.title, at: workSession.clockIn,
  //   });

  return NextResponse.json({ session: workSession }, { status: 201 });
}
