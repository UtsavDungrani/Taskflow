import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { StatusCategory, type Priority } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { POSITION_STEP, positionBetween } from "@/lib/utils";

/** Asserts the task belongs to a workspace the user is a member of. */
async function assertTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { workspace: { members: { some: { userId } } } },
    },
    include: { status: true, project: { select: { id: true, key: true } } },
  });

  if (!task) throw new Error("NOT_FOUND");
  return task;
}

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId } } } },
  });

  if (!project) throw new Error("NOT_FOUND");
  return project;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getBoard(projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId);

  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      statuses: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            where: { archivedAt: null, parentId: null },
            orderBy: { position: "asc" },
            include: {
              assignee: { select: { id: true, name: true, image: true } },
              labels: { include: { label: true } },
              _count: { select: { subtasks: true, comments: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * The anti-missed-deadline query. Everything open with a due date, bucketed
 * by how much trouble it is in.
 */
export async function getDeadlineDigest(userId: string) {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(endOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const open = await prisma.task.findMany({
    where: {
      archivedAt: null,
      dueDate: { not: null },
      status: { category: { not: StatusCategory.DONE } },
      project: { archivedAt: null, workspace: { members: { some: { userId } } } },
    },
    orderBy: { dueDate: "asc" },
    include: {
      status: true,
      project: { select: { id: true, key: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  return {
    overdue: open.filter((t) => t.dueDate! < now),
    today: open.filter((t) => t.dueDate! >= now && t.dueDate! <= endOfToday),
    thisWeek: open.filter(
      (t) => t.dueDate! > endOfToday && t.dueDate! <= endOfWeek,
    ),
    later: open.filter((t) => t.dueDate! > endOfWeek),
  };
}

/** Everything with a date range, for the Gantt and timeline views. */
export async function getScheduledTasks(projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId);

  return prisma.task.findMany({
    where: {
      projectId,
      archivedAt: null,
      OR: [{ startDate: { not: null } }, { dueDate: { not: null } }],
    },
    orderBy: [{ startDate: "asc" }, { dueDate: "asc" }],
    include: {
      status: true,
      assignee: { select: { id: true, name: true, image: true } },
      blockedBy: { select: { blockerId: true } },
    },
  });
}

export async function getTask(taskId: string, userId: string) {
  await assertTaskAccess(taskId, userId);

  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      status: true,
      project: { select: { id: true, key: true, name: true } },
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: true } },
      subtasks: { include: { status: true }, orderBy: { position: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, image: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { actor: { select: { id: true, name: true, image: true } } },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createTask(input: {
  projectId: string;
  userId: string;
  title: string;
  statusId?: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date | null;
  startDate?: Date | null;
  assigneeId?: string | null;
  parentId?: string | null;
}) {
  await assertProjectAccess(input.projectId, input.userId);

  return prisma.$transaction(async (tx) => {
    // Bumping the counter inside the transaction is what keeps ticket
    // numbers unique under concurrent creates.
    const project = await tx.project.update({
      where: { id: input.projectId },
      data: { taskCounter: { increment: 1 } },
      select: { taskCounter: true },
    });

    const statusId =
      input.statusId ??
      (
        await tx.taskStatus.findFirstOrThrow({
          where: { projectId: input.projectId },
          orderBy: { position: "asc" },
        })
      ).id;

    // New cards go to the top of their column.
    const first = await tx.task.findFirst({
      where: { statusId, archivedAt: null },
      orderBy: { position: "asc" },
      select: { position: true },
    });

    const task = await tx.task.create({
      data: {
        projectId: input.projectId,
        number: project.taskCounter,
        statusId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate,
        startDate: input.startDate,
        assigneeId: input.assigneeId,
        parentId: input.parentId,
        creatorId: input.userId,
        position: first ? first.position - POSITION_STEP : POSITION_STEP,
      },
    });

    await tx.activity.create({
      data: {
        taskId: task.id,
        actorId: input.userId,
        type: "task.created",
        data: { title: task.title },
      },
    });

    return task;
  });
}

/**
 * Drag-and-drop write. `beforeId`/`afterId` are the cards that will sit above
 * and below the dropped card in its destination column.
 */
export async function moveTask(input: {
  taskId: string;
  userId: string;
  statusId: string;
  beforeId?: string | null;
  afterId?: string | null;
}) {
  const task = await assertTaskAccess(input.taskId, input.userId);

  const destination = await prisma.taskStatus.findFirst({
    where: { id: input.statusId, projectId: task.projectId },
  });
  if (!destination) throw new Error("INVALID_STATUS");

  const [before, after] = await Promise.all([
    input.beforeId
      ? prisma.task.findUnique({
          where: { id: input.beforeId },
          select: { position: true },
        })
      : null,
    input.afterId
      ? prisma.task.findUnique({
          where: { id: input.afterId },
          select: { position: true },
        })
      : null,
  ]);

  const position = positionBetween(
    before?.position ?? null,
    after?.position ?? null,
  );

  const statusChanged = task.statusId !== destination.id;

  // Moving into a Done column is what stamps completedAt; moving back out
  // clears it. Without this, "completed this week" reporting silently lies.
  const wasDone = task.status.category === StatusCategory.DONE;
  const isDone = destination.category === StatusCategory.DONE;

  const updated = await prisma.task.update({
    where: { id: input.taskId },
    data: {
      statusId: destination.id,
      position,
      completedAt: isDone ? (wasDone ? undefined : new Date()) : null,
    },
  });

  if (statusChanged) {
    await prisma.activity.create({
      data: {
        taskId: input.taskId,
        actorId: input.userId,
        type: "status.changed",
        data: { from: task.status.name, to: destination.name },
      },
    });
  }

  return updated;
}

export async function updateTask(input: {
  taskId: string;
  userId: string;
  data: {
    title?: string;
    description?: string | null;
    priority?: Priority;
    dueDate?: Date | null;
    startDate?: Date | null;
    estimateHours?: number | null;
    assigneeId?: string | null;
  };
}) {
  const task = await assertTaskAccess(input.taskId, input.userId);

  const updated = await prisma.task.update({
    where: { id: input.taskId },
    data: input.data,
  });

  // Due-date changes are the ones worth an audit trail here — they are the
  // thing this app exists to keep honest.
  if (
    "dueDate" in input.data &&
    task.dueDate?.getTime() !== updated.dueDate?.getTime()
  ) {
    await prisma.activity.create({
      data: {
        taskId: input.taskId,
        actorId: input.userId,
        type: "due_date.changed",
        data: {
          from: task.dueDate?.toISOString() ?? null,
          to: updated.dueDate?.toISOString() ?? null,
        } as Prisma.InputJsonValue,
      },
    });
  }

  return updated;
}

export async function archiveTask(taskId: string, userId: string) {
  await assertTaskAccess(taskId, userId);
  return prisma.task.update({
    where: { id: taskId },
    data: { archivedAt: new Date() },
  });
}
