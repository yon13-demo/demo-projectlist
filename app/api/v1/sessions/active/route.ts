// Opt out of static generation — these routes always need live DB/KV access.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/sessions/active — the caller's currently running session, if any.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const activeSession = await prisma.session.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { project: { select: { id: true, title: true, client: true } } },
  });

  return NextResponse.json({ session: activeSession });
}
