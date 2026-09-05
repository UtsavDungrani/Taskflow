import { notFound } from "next/navigation";

import { Calendar } from "@/components/calendar";
import { requireUser } from "@/lib/auth";
import { getSchedule } from "@/server/tasks";

export const metadata = { title: "Calendar · TaskFlow" };

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();

  const schedule = await getSchedule(projectId, user.id);
  if (!schedule) notFound();

  return (
    <Calendar
      projectId={schedule.project.id}
      projectKey={schedule.project.key}
      tasks={schedule.scheduled.map((task) => ({
        id: task.id,
        number: task.number,
        title: task.title,
        statusName: task.status.name,
        statusColor: task.status.color,
        statusCategory: task.status.category,
        startDate: task.startDate?.toISOString() ?? null,
        dueDate: task.dueDate?.toISOString() ?? null,
      }))}
    />
  );
}
