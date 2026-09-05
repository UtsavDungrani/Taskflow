import { notFound } from "next/navigation";

import { Board } from "@/components/board";
import { TaskPanel } from "@/components/task-panel";
import { requireUser } from "@/lib/auth";
import { getBoard, getTask } from "@/server/tasks";

export default async function ProjectBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const { projectId } = await params;
  const { task: openTaskId } = await searchParams;
  const user = await requireUser();

  const project = await getBoard(projectId, user.id).catch(() => null);
  if (!project) notFound();

  // The open task lives in the URL rather than component state, so a ticket
  // is linkable and the back button closes the panel.
  const openTask = openTaskId
    ? await getTask(openTaskId, user.id).catch(() => null)
    : null;

  return (
    <div className="flex h-full flex-col">
      <header className="border-border flex items-center gap-3 border-b px-6 py-3">
        <span
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: project.color }}
        />
        <h1 className="text-ink text-base font-semibold tracking-tight">
          {project.name}
        </h1>
        <span className="text-ink-subtle font-mono text-xs">{project.key}</span>
        {project.description && (
          <p className="text-ink-muted ml-2 truncate text-sm">
            {project.description}
          </p>
        )}
      </header>

      <Board
        projectId={project.id}
        projectKey={project.key}
        columns={project.statuses.map((status) => ({
          id: status.id,
          name: status.name,
          color: status.color,
          category: status.category,
          tasks: status.tasks.map((task) => ({
            id: task.id,
            number: task.number,
            title: task.title,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            position: task.position,
            assignee: task.assignee,
            labels: task.labels.map((entry) => entry.label),
            subtaskCount: task._count.subtasks,
            commentCount: task._count.comments,
          })),
        }))}
      />

      {openTask && (
        <TaskPanel
          projectId={project.id}
          projectKey={project.key}
          statuses={project.statuses.map((status) => ({
            id: status.id,
            name: status.name,
            color: status.color,
          }))}
          task={{
            id: openTask.id,
            number: openTask.number,
            title: openTask.title,
            description: openTask.description,
            priority: openTask.priority,
            statusId: openTask.statusId,
            dueDate: openTask.dueDate?.toISOString() ?? null,
            startDate: openTask.startDate?.toISOString() ?? null,
            estimateHours: openTask.estimateHours,
            completedAt: openTask.completedAt?.toISOString() ?? null,
            createdAt: openTask.createdAt.toISOString(),
            comments: openTask.comments.map((comment) => ({
              id: comment.id,
              body: comment.body,
              createdAt: comment.createdAt.toISOString(),
              author: comment.author,
            })),
            activities: openTask.activities.map((activity) => ({
              id: activity.id,
              type: activity.type,
              data: activity.data as Record<string, unknown> | null,
              createdAt: activity.createdAt.toISOString(),
              actor: activity.actor,
            })),
          }}
        />
      )}
    </div>
  );
}
