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

  // The open task lives in the URL rather than component state, so a ticket
  // is linkable and the back button closes the panel. Fetched alongside the
  // board rather than after it: they are independent, and against a distant
  // database serialising them doubles the wait to open a card.
  const [project, openTask] = await Promise.all([
    getBoard(projectId, user.id),
    openTaskId ? getTask(openTaskId, user.id) : null,
  ]);

  if (!project) notFound();

  return (
    <>
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
    </>
  );
}
