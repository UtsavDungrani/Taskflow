import { notFound } from "next/navigation";

import { Gantt } from "@/components/gantt";
import { requireUser } from "@/lib/auth";
import { getSchedule } from "@/server/tasks";

export const metadata = { title: "Gantt · TaskFlow" };

export default async function GanttPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();

  const schedule = await getSchedule(projectId, user.id);
  if (!schedule) notFound();

  return (
    <Gantt
      projectId={schedule.project.id}
      projectKey={schedule.project.key}
      tasks={schedule.scheduled.map((task) => ({
        id: task.id,
        number: task.number,
        title: task.title,
        priority: task.priority,
        statusName: task.status.name,
        statusColor: task.status.color,
        statusCategory: task.status.category,
        startDate: task.startDate?.toISOString() ?? null,
        dueDate: task.dueDate?.toISOString() ?? null,
        blockedBy: task.blockedBy.map((edge) => edge.blockerId),
      }))}
      unscheduled={schedule.unscheduled.map((task) => ({
        id: task.id,
        number: task.number,
        title: task.title,
      }))}
    />
  );
}
