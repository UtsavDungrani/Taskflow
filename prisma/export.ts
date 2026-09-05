/**
 * Dumps every table to a JSON file, in an order a restore can replay
 * (parents before children, because the schema has real foreign keys).
 *
 * Written for moving between Postgres providers, which is otherwise a
 * pg_dump/pg_restore dance that most hosted tiers make awkward.
 *
 * Usage: node --experimental-strip-types prisma/export.ts [out.json]
 */
import "dotenv/config";

import { writeFileSync } from "node:fs";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const out = process.argv[2] ?? "taskflow-backup.json";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const dump = {
    exportedAt: new Date().toISOString(),
    user: await prisma.user.findMany(),
    workspace: await prisma.workspace.findMany(),
    workspaceMember: await prisma.workspaceMember.findMany(),
    project: await prisma.project.findMany(),
    taskStatus: await prisma.taskStatus.findMany(),
    label: await prisma.label.findMany(),
    task: await prisma.task.findMany(),
    taskLabel: await prisma.taskLabel.findMany(),
    taskDependency: await prisma.taskDependency.findMany(),
    comment: await prisma.comment.findMany(),
    activity: await prisma.activity.findMany(),
  };

  writeFileSync(out, JSON.stringify(dump, null, 2));

  for (const [name, rows] of Object.entries(dump)) {
    if (Array.isArray(rows)) {
      console.log(`  ${String(rows.length).padStart(4)} ${name}`);
    }
  }
  console.log(`Written to ${out}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
