// Opt out of static generation — these routes always need live DB/KV access.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/reports/timesheet?from=2026-07-01&to=2026-07-31&format=csv
// Managers/Admins may pass ?userId= to pull another user's timesheet;
// members are always restricted to their own sessions.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const requestedUserId = searchParams.get("userId");

  let userId = session.user.id;
  if (requestedUserId && requestedUserId !== session.user.id) {
    if (session.user.role === "MEMBER") {
      return NextResponse.json({ error: "Members can only view their own timesheet." }, { status: 403 });
    }
    userId = requestedUserId;
  }

  const where: Record<string, unknown> = { userId, status: "COMPLETED" };
  if (from || to) {
    where.clockIn = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { clockIn: "desc" },
    include: { project: { select: { title: true, client: true } } },
  });

  type SessionRow = (typeof sessions)[number];
  const totalMins = sessions.reduce((sum: number, s: SessionRow) => sum + (s.durationMins ?? 0), 0);

  if (format === "csv") {
    const header = "Project,Client,Clock In,Clock Out,Duration (mins)";
    const rows = sessions.map((s: SessionRow) =>
      [
        s.project.title,
        s.project.client,
        s.clockIn.toISOString(),
        s.clockOut?.toISOString() ?? "",
        String(s.durationMins ?? 0),
      ]
        .map((field) => `"${field.replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows, `,,,Total,${totalMins}`].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="timesheet-${userId}.csv"`,
      },
    });
  }

  return NextResponse.json({
    userId,
    totalMinutes: totalMins,
    totalHours: Math.round((totalMins / 60) * 100) / 100,
    entries: sessions,
  });
}
