import { AlertTriangle, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

import {
  Card,
  DueDateChip,
  EmptyState,
  PriorityBadge,
  SectionHeading,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { taskRef } from "@/lib/utils";
import { getDeadlineDigest } from "@/server/tasks";

export const metadata = { title: "Deadlines · TaskFlow" };

type DigestTask = Awaited<
  ReturnType<typeof getDeadlineDigest>
>["overdue"][number];

export default async function DeadlinesPage() {
  const user = await requireUser();
  const digest = await getDeadlineDigest(user.id);

  const total =
    digest.overdue.length +
    digest.today.length +
    digest.thisWeek.length +
    digest.later.length;

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <header className="mb-8">
        <h1 className="text-ink text-2xl font-semibold tracking-tight">
          Deadlines
        </h1>
        <p className="text-ink-muted mt-1 text-sm">
          {digest.overdue.length > 0
            ? `${digest.overdue.length} ${
                digest.overdue.length === 1 ? "task is" : "tasks are"
              } past due.`
            : total > 0
              ? "Nothing overdue. Here's what's coming."
              : "Everything with a due date shows up here."}
        </p>
      </header>

      {total === 0 ? (
        <EmptyState
          title="No scheduled work"
          description="Create a project, add a few tickets with due dates, and this page becomes the one place that tells you what is about to slip."
        />
      ) : (
        <div className="space-y-8">
          <Bucket
            title="Overdue"
            tone="danger"
            icon={<AlertTriangle className="h-4 w-4" />}
            tasks={digest.overdue}
          />
          <Bucket
            title="Due today"
            tone="warning"
            icon={<Clock className="h-4 w-4" />}
            tasks={digest.today}
          />
          <Bucket
            title="Next 7 days"
            icon={<CalendarDays className="h-4 w-4" />}
            tasks={digest.thisWeek}
          />
          <Bucket
            title="Later"
            icon={<CheckCircle2 className="h-4 w-4" />}
            tasks={digest.later}
            collapsedByDefault
          />
        </div>
      )}
    </div>
  );
}

function Bucket({
  title,
  tasks,
  icon,
  tone = "default",
  collapsedByDefault = false,
}: {
  title: string;
  tasks: DigestTask[];
  icon: React.ReactNode;
  tone?: "default" | "danger" | "warning";
  collapsedByDefault?: boolean;
}) {
  if (tasks.length === 0) return null;

  // "Later" can be long and is the least urgent thing on the page, so it
  // renders behind a disclosure instead of pushing the urgent buckets up.
  const body = (
    <Card className="divide-border divide-y overflow-hidden">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </Card>
  );

  if (collapsedByDefault) {
    return (
      <details className="group">
        <summary className="mb-3 flex cursor-pointer list-none items-center gap-2">
          <span className="text-ink-subtle">{icon}</span>
          <h2 className="text-ink text-sm font-semibold tracking-tight">
            {title}
          </h2>
          <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
            {tasks.length}
          </span>
        </summary>
        {body}
      </details>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2">
        <span
          className={
            tone === "danger"
              ? "text-danger"
              : tone === "warning"
                ? "text-warning"
                : "text-ink-subtle"
          }
        >
          {icon}
        </span>
        <SectionHeading title={title} count={tasks.length} tone={tone} />
      </div>
      {body}
    </section>
  );
}

function TaskRow({ task }: { task: DigestTask }) {
  return (
    <Link
      href={`/projects/${task.project.id}`}
      className="hover:bg-surface-sunken flex items-center gap-3 px-4 py-2.5 transition"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: task.project.color }}
        title={task.project.name}
      />
      <span className="text-ink-subtle shrink-0 font-mono text-xs">
        {taskRef(task.project.key, task.number)}
      </span>
      <span className="text-ink min-w-0 flex-1 truncate text-sm">
        {task.title}
      </span>
      <PriorityBadge priority={task.priority} />
      <span
        className="text-ink-subtle shrink-0 text-xs"
        title={`Status: ${task.status.name}`}
      >
        {task.status.name}
      </span>
      {task.dueDate && <DueDateChip date={task.dueDate} />}
    </Link>
  );
}
