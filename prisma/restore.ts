/**
 * One-off restore: loads a JSON dump into whatever DATABASE_URL points at.
 * Insert order matters (parents before children) because the schema has real
 * foreign keys. Uses skipDuplicates so a half-finished run can be repeated.
 *
 * Usage: node --experimental-strip-types prisma/restore.ts <dump.json>
 */
import "dotenv/config";

import { readFileSync } from "node:fs";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.ts";

const dumpPath = process.argv[2];
const connectionString = process.env.DATABASE_URL;

if (!dumpPath || !connectionString) {
  console.error("Usage: node --experimental-strip-types prisma/restore.ts <dump.json>");
  console.error("(and DATABASE_URL must be set)");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const dump = JSON.parse(readFileSync(dumpPath, "utf8"));

const DATE_FIELDS = new Set([
  "createdAt", "updatedAt", "dueDate", "startDate",
  "completedAt", "archivedAt", "emailVerified", "expires",
]);

function revive(row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };
  for (const key of Object.keys(out)) {
    if (DATE_FIELDS.has(key) && typeof out[key] === "string") {
      out[key] = new Date(out[key] as string);
    }
  }
  return out;
}

async function main() {
  console.log(`Restoring dump taken at ${dump.exportedAt}`);

  const order = [
    ["user", prisma.user],
    ["workspace", prisma.workspace],
    ["workspaceMember", prisma.workspaceMember],
    ["project", prisma.project],
    ["taskStatus", prisma.taskStatus],
    ["label", prisma.label],
    ["task", prisma.task],
    ["taskLabel", prisma.taskLabel],
    ["taskDependency", prisma.taskDependency],
    ["comment", prisma.comment],
    ["activity", prisma.activity],
  ] as const;

  for (const [name, model] of order) {
    const rows = (dump[name] ?? []).map(revive);
    if (rows.length === 0) {
      console.log(`     0 ${name} (skipped)`);
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (model as any).createMany({ data: rows, skipDuplicates: true });
    console.log(`  ${String(rows.length).padStart(4)} ${name}`);
  }

  console.log("Restore complete.");
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(() => prisma.$disconnect());
