import "server-only";

import { StatusCategory } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { POSITION_STEP } from "@/lib/utils";

/**
 * The columns every new project starts with. `category` is what the app
 * actually reasons about; `name` is just the label the user sees and can
 * rename freely.
 */
export const DEFAULT_STATUSES = [
  { name: "Backlog", category: StatusCategory.TODO, color: "#94a3b8" },
  { name: "To Do", category: StatusCategory.TODO, color: "#38bdf8" },
  { name: "In Progress", category: StatusCategory.IN_PROGRESS, color: "#f59e0b" },
  { name: "In Review", category: StatusCategory.IN_PROGRESS, color: "#a855f7" },
  { name: "Done", category: StatusCategory.DONE, color: "#22c55e" },
] as const;

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/**
 * Every user needs a workspace before they can do anything. Called from the
 * authenticated layout, so a brand-new account lands on a working app instead
 * of an empty-state dead end.
 */
export async function ensureWorkspace(userId: string) {
  const existing = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing.workspace;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const label = user?.name ?? "My";
  const base = slugify(`${label}-workspace`) || "workspace";

  // Slug is globally unique; suffix on collision.
  let slug = base;
  for (let i = 2; await prisma.workspace.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  return prisma.workspace.create({
    data: {
      name: `${label}'s Workspace`,
      slug,
      members: { create: { userId, role: "OWNER" } },
    },
  });
}

/** Resolves the workspace, asserting the user is a member of it. */
export async function getWorkspaceForUser(userId: string, workspaceId?: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: workspaceId ? { userId, workspaceId } : { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  return member?.workspace ?? null;
}

/** Creates a project with its default column set in one transaction. */
export async function createProject(input: {
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  color?: string;
}) {
  return prisma.project.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      key: input.key.toUpperCase(),
      description: input.description,
      color: input.color,
      statuses: {
        create: DEFAULT_STATUSES.map((status, index) => ({
          name: status.name,
          category: status.category,
          color: status.color,
          position: (index + 1) * POSITION_STEP,
        })),
      },
    },
    include: { statuses: { orderBy: { position: "asc" } } },
  });
}
