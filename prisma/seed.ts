/**
 * Seeds a workspace with one project and a spread of tasks whose due dates sit
 * on either side of today, so the Deadlines page has something real to show on
 * first run.
 *
 * Run with: npm run db:seed
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Fill it in .env first.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const EMAIL = process.env.DEV_LOGIN_EMAIL ?? "you@example.com";

/** Days from now, landing at end of day. */
function due(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 999);
  return date;
}

const STATUSES = [
  { name: "Backlog", category: "TODO", color: "#a1907c" },
  { name: "To Do", category: "TODO", color: "#6e8b74" },
  { name: "In Progress", category: "IN_PROGRESS", color: "#c88b2e" },
  { name: "In Review", category: "IN_PROGRESS", color: "#a86b8c" },
  { name: "Done", category: "DONE", color: "#5e8c4a" },
] as const;

const TASKS = [
  { title: "Ship invoice export to CSV", status: "In Progress", priority: "URGENT", due: -3 },
  { title: "Reply to the Henderson contract email", status: "To Do", priority: "HIGH", due: -1 },
  { title: "Renew the SSL certificate", status: "To Do", priority: "URGENT", due: 0 },
  { title: "Review pull request #218", status: "In Review", priority: "MEDIUM", due: 0 },
  { title: "Write the Q3 status update", status: "To Do", priority: "HIGH", due: 2 },
  { title: "Migrate the staging database", status: "Backlog", priority: "MEDIUM", due: 5 },
  { title: "Refactor the notification service", status: "Backlog", priority: "LOW", due: 12 },
  { title: "Fix the mobile nav overlap", status: "In Progress", priority: "MEDIUM", due: 4 },
  { title: "Archive the 2024 project files", status: "Backlog", priority: "NONE", due: null },
  { title: "Set up automated backups", status: "Done", priority: "HIGH", due: -8 },
] as const;

async function main() {
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {},
    create: { email: EMAIL, name: "Local Developer" },
  });

  let workspace = (
    await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    })
  )?.workspace;

  workspace ??= await prisma.workspace.create({
    data: {
      name: "Local Developer's Workspace",
      slug: `workspace-${Date.now()}`,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  const existing = await prisma.project.findFirst({
    where: { workspaceId: workspace.id, key: "DEMO" },
  });

  if (existing) {
    console.log("Demo project already exists — nothing to seed.");
    return;
  }

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Demo Project",
      key: "DEMO",
      description: "Sample data so the board and deadline views aren't empty.",
      color: "#b4471f",
      statuses: {
        create: STATUSES.map((status, index) => ({
          name: status.name,
          category: status.category,
          color: status.color,
          position: (index + 1) * 1000,
        })),
      },
    },
    include: { statuses: true },
  });

  const statusByName = new Map(
    project.statuses.map((status) => [status.name, status]),
  );

  let counter = 0;
  for (const task of TASKS) {
    counter += 1;
    const status = statusByName.get(task.status)!;

    await prisma.task.create({
      data: {
        projectId: project.id,
        number: counter,
        statusId: status.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.due === null ? null : due(task.due),
        completedAt: status.category === "DONE" ? new Date() : null,
        creatorId: user.id,
        assigneeId: user.id,
        position: counter * 1000,
      },
    });
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { taskCounter: counter },
  });

  console.log(`Seeded "${project.name}" with ${counter} tasks for ${EMAIL}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
