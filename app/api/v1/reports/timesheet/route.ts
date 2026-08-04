// Opt out of static generation — these routes always need live DB/KV access.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/v1/reports/timesheet?userId=...&format=json|csv
export async function GET(req: NextRequest) {
  const check = await requireRole(["ADMIN" as const, "MANAGER" as const]);
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: check.status });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const format = searchParams.get("format") ?? "json";

  const where: Record<string, unknown> = {};
  if (userId) {
    where.userId = userId;
  }

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { clockIn: "desc" },
    include: {
      project: {
        select: {
          title: true,
          client: true,
        },
      },
    },
  });

  type SessionRow = (typeof sessions)[number];

  // Calculate durationMins dynamically from clockIn and clockOut
  const sessionsWithDuration = sessions.map((s: SessionRow) => {
    let durationMins = 0;
    if (s.clockOut) {
      const ms = new Date(s.clockOut).getTime() - new Date(s.clockIn).getTime();
      durationMins = Math.floor(ms / (1000 * 60));
    }
    return {
      ...s,
      durationMins,
    };
  });

  const totalMins = sessionsWithDuration.reduce((sum, s) => sum + s.durationMins, 0);

  if (format === "csv") {
    const header = "Project,Client,Clock In,Clock Out,Duration (mins)\n";
    const rows = sessionsWithDuration
      .map((s) => {
        const title = `"${s.project.title.replace(/"/g, '""')}"`;
        const client = `"${(s.project.client ?? "").replace(/"/g, '""')}"`;
        const clockIn = s.clockIn.toISOString();
        const clockOut = s.clockOut ? s.clockOut.toISOString() : "";
        return `${title},${client},${clockIn},${clockOut},${s.durationMins}`;
      })
      .join("\n");

    return new NextResponse(header + rows, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="timesheet-report.csv"',
      },
    });
  }

  return NextResponse.json({
    sessions: sessionsWithDuration,
    totalMins,
  });
}
