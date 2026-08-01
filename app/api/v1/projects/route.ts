import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth, requireRole } from "@/lib/auth";
import { ProjectStatus, Priority } from "@prisma/client";

// GET /api/v1/projects?status=IN_PROGRESS&search=acme
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") {
    if (!Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }
    where.status = status;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { client: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tasks: { select: { id: true, isCompleted: true } },
      workSessions: {
        where: { status: "ACTIVE" },
        select: { id: true, userId: true },
      },
    },
  });

  const shaped = projects.map((p) => ({
    id: p.id,
    title: p.title,
    client: p.client,
    status: p.status,
    priority: p.priority,
    progressPercentage: p.progressPercentage,
    createdAt: p.createdAt,
    taskCount: p.tasks.length,
    completedTaskCount: p.tasks.filter((t) => t.isCompleted).length,
    activeWorkerCount: p.workSessions.length,
  }));

  return NextResponse.json({ projects: shaped });
}

const createProjectSchema = z.object({
  id: z.string().min(3).regex(/^[A-Z0-9-]+$/, "Use an uppercase code like PRJ-101"),
  title: z.string().min(1),
  client: z.string().min(1),
  status: z.nativeEnum(ProjectStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
});

// POST /api/v1/projects — Admin/Manager only
export async function POST(req: NextRequest) {
  const check = await requireRole(["ADMIN", "MANAGER"]);
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: check.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({ where: { id: parsed.data.id } });
  if (existing) {
    return NextResponse.json({ error: `Project ${parsed.data.id} already exists` }, { status: 409 });
  }

  const project = await prisma.project.create({
    data: {
      id: parsed.data.id,
      title: parsed.data.title,
      client: parsed.data.client,
      status: parsed.data.status ?? "PENDING",
      priority: parsed.data.priority ?? "MEDIUM",
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
