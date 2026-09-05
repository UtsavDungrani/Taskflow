"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { StatusCategory } from "@/generated/prisma/enums";
import { cn, taskRef } from "@/lib/utils";

export type CalendarTask = {
  id: string;
  number: number;
  title: string;
  statusName: string;
  statusColor: string;
  statusCategory: StatusCategory;
  startDate: string | null;
  dueDate: string | null;
};

export function Calendar({
  projectId,
  projectKey,
  tasks,
}: {
  projectId: string;
  projectKey: string;
  tasks: CalendarTask[];
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = startOfDay(new Date());

  // Full weeks, so the grid is always a clean 7-wide block.
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  /**
   * A task shows on a day if that day is its due date, or falls inside its
   * start→due span. Spanning tasks appear on each day they cover rather than
   * only at the end, which is what makes "how busy is next week" legible.
   */
  function tasksOn(day: Date) {
    return tasks.filter((task) => {
      const due = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;
      const start = task.startDate ? startOfDay(new Date(task.startDate)) : null;

      if (start && due) {
        return isWithinInterval(day, { start, end: due });
      }
      if (due) return isSameDay(day, due);
      if (start) return isSameDay(day, start);
      return false;
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border flex shrink-0 items-center gap-2 border-b px-6 py-2">
        <button
          type="button"
          onClick={() => setMonth(subMonths(month, 1))}
          className="text-ink-muted hover:bg-surface-sunken rounded p-1 transition"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-ink min-w-40 text-center text-sm font-medium">
          {format(month, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="text-ink-muted hover:bg-surface-sunken rounded p-1 transition"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setMonth(startOfMonth(new Date()))}
          className="text-ink-muted hover:bg-surface-sunken ml-2 rounded px-2 py-1 text-xs transition"
        >
          Today
        </button>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b border-[var(--border)]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div
            key={label}
            className="text-ink-subtle px-2 py-1.5 text-center text-[11px] font-medium"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="scroll-slim grid min-h-0 flex-1 grid-cols-7 overflow-y-auto">
        {days.map((day) => {
          const dayTasks = tasksOn(day);
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-border min-h-28 border-r border-b p-1.5",
                !inMonth && "bg-surface-sunken/50",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    isToday
                      ? "bg-accent text-accent-ink flex h-5 w-5 items-center justify-center rounded-full font-semibold"
                      : inMonth
                        ? "text-ink-muted"
                        : "text-ink-subtle",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length > 3 && (
                  <span className="text-ink-subtle text-[10px]">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => {
                  const done = task.statusCategory === "DONE";
                  const overdue =
                    !done &&
                    task.dueDate &&
                    startOfDay(new Date(task.dueDate)) < today &&
                    isSameDay(day, startOfDay(new Date(task.dueDate)));

                  return (
                    <Link
                      key={task.id}
                      href={`/projects/${projectId}?task=${task.id}`}
                      className={cn(
                        "block truncate rounded px-1.5 py-0.5 text-[11px] transition hover:opacity-80",
                        done && "bg-surface-sunken text-ink-subtle line-through",
                        overdue && "bg-danger-soft text-danger font-medium",
                        !done && !overdue && "text-ink",
                      )}
                      style={
                        !done && !overdue
                          ? { backgroundColor: `${task.statusColor}22` }
                          : undefined
                      }
                      title={`${taskRef(projectKey, task.number)} ${task.title} — ${task.statusName}`}
                    >
                      <span className="font-mono opacity-70">
                        {taskRef(projectKey, task.number)}
                      </span>{" "}
                      {task.title}
                    </Link>
                  );
                })}

                {dayTasks.length > 3 && (
                  <span className="text-ink-subtle block px-1.5 text-[10px]">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
