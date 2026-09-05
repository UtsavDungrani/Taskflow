import { notFound } from "next/navigation";

import { Board } from "@/components/board";
import { requireUser } from "@/lib/auth";
import { getBoard } from "@/server/tasks";

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();

  const project = await getBoard(projectId, user.id).catch(() => null);
  if (!project) notFound();

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
    </div>
  );
}
