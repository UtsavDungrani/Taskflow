"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import {
  addComment,
  archiveTask,
  createTask,
  moveTask,
  setTaskStatus,
  updateTask,
} from "@/server/tasks";
import { createProject, getWorkspaceForUser } from "@/server/workspace";

const priority = z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]);

/** Turns "" / undefined from a form into null, and a date string into a Date. */
const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : new Date(value)))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    message: "Invalid date",
  })
  .nullable()
  .optional();

const createTaskSchema = z.object({
  projectId: z.string().min(1),
  statusId: z.string().min(1).optional(),
  title: z.string().trim().min(1, "Title is required").max(500),
  description: z.string().trim().max(20000).optional(),
  priority: priority.optional(),
  dueDate: optionalDate,
  startDate: optionalDate,
});

export async function createTaskAction(input: unknown) {
  const user = await requireUser();
  const parsed = createTaskSchema.parse(input);

  const task = await createTask({
    ...parsed,
    userId: user.id,
    dueDate: parsed.dueDate ?? null,
    startDate: parsed.startDate ?? null,
  });

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath("/");
  return { id: task.id };
}

const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  statusId: z.string().min(1),
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional(),
  projectId: z.string().min(1),
});

export async function moveTaskAction(input: unknown) {
  const user = await requireUser();
  const parsed = moveTaskSchema.parse(input);

  await moveTask({ ...parsed, userId: user.id });

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath("/");
  return { ok: true };
}

const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().max(20000).nullable().optional(),
  priority: priority.optional(),
  dueDate: optionalDate,
  startDate: optionalDate,
  estimateHours: z.coerce.number().min(0).max(10000).nullable().optional(),
});

export async function updateTaskAction(input: unknown) {
  const user = await requireUser();
  const { taskId, projectId, ...data } = updateTaskSchema.parse(input);

  await updateTask({ taskId, userId: user.id, data });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/");
  return { ok: true };
}

const addCommentSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  body: z.string().trim().min(1, "Comment cannot be empty").max(20000),
});

export async function addCommentAction(input: unknown) {
  const user = await requireUser();
  const parsed = addCommentSchema.parse(input);

  await addComment({ ...parsed, userId: user.id });

  revalidatePath(`/projects/${parsed.projectId}`);
  return { ok: true };
}

const setStatusSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  statusId: z.string().min(1),
});

export async function setTaskStatusAction(input: unknown) {
  const user = await requireUser();
  const parsed = setStatusSchema.parse(input);

  await setTaskStatus({ ...parsed, userId: user.id });

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function archiveTaskAction(taskId: string, projectId: string) {
  const user = await requireUser();
  await archiveTask(taskId, user.id);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return { ok: true };
}

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  // The prefix in ticket refs like TF-14, so keep it short and alphabetic.
  key: z
    .string()
    .trim()
    .min(2)
    .max(6)
    .regex(/^[A-Za-z]+$/, "Key must be letters only"),
  description: z.string().trim().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function createProjectAction(input: unknown) {
  const user = await requireUser();
  const parsed = createProjectSchema.parse(input);

  const workspace = await getWorkspaceForUser(user.id);
  if (!workspace) throw new Error("NO_WORKSPACE");

  const project = await createProject({
    workspaceId: workspace.id,
    ...parsed,
  });

  revalidatePath("/");
  return { id: project.id };
}
