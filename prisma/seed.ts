import { PrismaClient, Role, ProjectStatus, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@siteledger.dev" },
    update: {},
    create: {
      name: "Alex Rivera",
      email: "admin@siteledger.dev",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@siteledger.dev" },
    update: {},
    create: {
      name: "Priya Nair",
      email: "manager@siteledger.dev",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@siteledger.dev" },
    update: {},
    create: {
      name: "Jordan Lee",
      email: "member@siteledger.dev",
      passwordHash,
      role: Role.MEMBER,
    },
  });

  const projects = [
    {
      id: "PRJ-101",
      title: "Riverside Tower — Electrical Rough-In",
      client: "Meridian Development",
      status: ProjectStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      progressPercentage: 62,
    },
    {
      id: "PRJ-102",
      title: "Oakwood School Roof Replacement",
      client: "Oakwood ISD",
      status: ProjectStatus.REVIEW,
      priority: Priority.MEDIUM,
      progressPercentage: 88,
    },
    {
      id: "PRJ-103",
      title: "Harbor Logistics Warehouse Fit-Out",
      client: "Harbor Logistics Co.",
      status: ProjectStatus.PENDING,
      priority: Priority.LOW,
      progressPercentage: 0,
    },
    {
      id: "PRJ-104",
      title: "Cedar Street Duplex Renovation",
      client: "Private Owner",
      status: ProjectStatus.COMPLETED,
      priority: Priority.MEDIUM,
      progressPercentage: 100,
    },
  ];

  for (const p of projects) {
    await prisma.project.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  await prisma.task.createMany({
    data: [
      { projectId: "PRJ-101", assignedUserId: member.id, title: "Pull conduit on 3rd floor", isCompleted: true },
      { projectId: "PRJ-101", assignedUserId: member.id, title: "Panel labeling", isCompleted: false },
      { projectId: "PRJ-102", assignedUserId: member.id, title: "Final inspection walk-through", isCompleted: false },
      { projectId: "PRJ-104", assignedUserId: member.id, title: "Punch list sign-off", isCompleted: true },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete:", { admin: admin.email, manager: manager.email, member: member.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
