"use client";

import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameMonth,
  isWeekend,
  startOfDay,
} from "date-fns";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { updateTaskAction } from "@/app/actions";
import type { Priority, StatusCategory } from "@/generated/prisma/enums";
import { cn, taskRef } from "@/lib/utils";

export type GanttTask = {
  id: string;
  number: number;
  title: string;
  priority: Priority;
  statusName: string;
  statusColor: string;
  statusCategory: StatusCategory;
  startDate: string | null;
  dueDate: string | null;
  blockedBy: string[];
};

type Zoom = "day" | "week" | "month";

const PX_PER_DAY: Record<Zoom, number> = { day: 40, week: 14, month: 4 };
const ROW_HEIGHT = 36;
const LEFT_WIDTH = 288;

/** Drag in progress. `mode` decides which end(s) of the bar move. */
type Drag = {
  taskId: string;
  mode: "move" | "start" | "end";
  originX: number;
  offsetDays: number;
};

export function Gantt({
  projectId,
  projectKey,
  tasks: initialTasks,
  unscheduled,
}: {
  projectId: string;
  projectKey: string;
  tasks: GanttTask[];
  unscheduled: { id: string; number: number; title: string }[];
}) {
  const router = useRouter();
  const [zoom, setZoom] = useState<Zoom>("week");
  const [tasks, setTasks] = useState(initialTasks);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Server data wins on revalidation; see the same pattern in board.tsx.
  const [syncedFrom, setSyncedFrom] = useState(initialTasks);
  if (syncedFrom !== initialTasks) {
    setSyncedFrom(initialTasks);
    setTasks(initialTasks);
  }

  const pxPerDay = PX_PER_DAY[zoom];
  const today = startOfDay(new Date());

  // Span every date in the set, padded, and never shorter than ~3 months so
  // a project with one task still renders a legible calendar.
  const dates = tasks
    .flatMap((task) => [task.startDate, task.dueDate])
    .filter((value): value is string => Boolean(value))
    .map((value) => startOfDay(new Date(value)));

  const earliest = dates.length
    ? new Date(Math.min(...dates.map((d) => d.getTime()), today.getTime()))
    : today;
  const latest = dates.length
    ? new Date(Math.max(...dates.map((d) => d.getTime()), today.getTime()))
    : addDays(today, 30);

  const rangeStart = addDays(startOfDay(earliest), -7);
  const rangeEnd = addDays(startOfDay(latest), 21);
  const totalDays = Math.max(differenceInCalendarDays(rangeEnd, rangeStart), 90);

  const x = (date: Date) =>
    differenceInCalendarDays(startOfDay(date), rangeStart) * pxPerDay;

  /** The dates a task should render with right now, drag preview included. */
  function effectiveDates(task: GanttTask) {
    let start = task.startDate ? startOfDay(new Date(task.startDate)) : null;
    let end = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;

    if (drag?.taskId === task.id) {
      const shift = drag.offsetDays;
      if (drag.mode === "move") {
        if (start) start = addDays(start, shift);
        if (end) end = addDays(end, shift);
      } else if (drag.mode === "start") {
        // Dragging the left handle of a milestone is how a bar gets created.
        const base = start ?? end;
        if (base) start = addDays(base, shift);
      } else if (drag.mode === "end" && end) {
        end = addDays(end, shift);
      }
      // Never let the bar invert.
      if (start && end && start > end) {
        if (drag.mode === "start") start = end;
        else end = start;
      }
    }

    return { start, end };
  }

  function beginDrag(
    event: React.PointerEvent,
    taskId: string,
    mode: Drag["mode"],
  ) {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    setDrag({ taskId, mode, originX: event.clientX, offsetDays: 0 });
  }

  function moveDrag(event: React.PointerEvent) {
    if (!drag) return;
    const offsetDays = Math.round((event.clientX - drag.originX) / pxPerDay);
    if (offsetDays !== drag.offsetDays) setDrag({ ...drag, offsetDays });
  }

  async function endDrag(event: React.PointerEvent) {
    if (!drag) return;
    const active = drag;
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    setDrag(null);

    if (active.offsetDays === 0) return;

    const task = tasks.find((entry) => entry.id === active.taskId);
    if (!task) return;

    // Recompute with the drag still applied so we persist what was shown.
    setDrag(active);
    const { start, end } = effectiveDates(task);
    setDrag(null);

    const previous = tasks;
    setTasks((current) =>
      current.map((entry) =>
        entry.id === task.id
          ? {
              ...entry,
              startDate: start ? start.toISOString() : entry.startDate,
              dueDate: end ? end.toISOString() : entry.dueDate,
            }
          : entry,
      ),
    );

    try {
      await updateTaskAction({
        taskId: task.id,
        projectId,
        // Start of day for a start, end of day for a due date, matching how
        // the rest of the app treats the two.
        ...(start
          ? { startDate: `${format(start, "yyyy-MM-dd")}T00:00:00` }
          : {}),
        ...(end ? { dueDate: `${format(end, "yyyy-MM-dd")}T23:59:59` } : {}),
      });
      router.refresh();
    } catch {
      setTasks(previous);
      setError("Could not save the new dates. Your change was rolled back.");
    }
  }

  const gridWidth = totalDays * pxPerDay;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border flex shrink-0 items-center gap-2 border-b px-6 py-2">
        <span className="text-ink-subtle text-xs">Zoom</span>
        {(["day", "week", "month"] as Zoom[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setZoom(option)}
            className={cn(
              "rounded px-2 py-1 text-xs capitalize transition",
              zoom === option
                ? "bg-accent-soft text-accent font-medium"
                : "text-ink-muted hover:bg-surface-sunken",
            )}
          >
            {option}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            const node = scrollRef.current;
            if (node) node.scrollLeft = Math.max(x(today) - 200, 0);
          }}
          className="text-ink-muted hover:bg-surface-sunken ml-2 rounded px-2 py-1 text-xs transition"
        >
          Jump to today
        </button>

        {error && (
          <span className="text-danger ml-auto text-xs">
            {error}{" "}
            <button
              type="button"
              onClick={() => setError(null)}
              className="underline"
            >
              Dismiss
            </button>
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-ink-muted flex flex-1 items-center justify-center px-6 text-center text-sm">
          <div className="max-w-sm">
            <p className="text-ink font-medium">Nothing scheduled yet</p>
            <p className="mt-1">
              Give a task a due date and it appears here as a milestone. Drag
              its left edge to add a start date and it becomes a bar.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="scroll-slim min-h-0 flex-1 overflow-auto"
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={() => setDrag(null)}
        >
          <div
            className="relative"
            style={{ width: LEFT_WIDTH + gridWidth, minWidth: "100%" }}
          >
            <TimeHeader
              rangeStart={rangeStart}
              totalDays={totalDays}
              pxPerDay={pxPerDay}
              zoom={zoom}
              today={today}
            />

            <div className="relative">
              {/* Weekend shading and the today marker, behind the rows. */}
              <DayBackground
                rangeStart={rangeStart}
                totalDays={totalDays}
                pxPerDay={pxPerDay}
                zoom={zoom}
                today={today}
                height={tasks.length * ROW_HEIGHT}
              />

              <DependencyArrows
                tasks={tasks}
                effectiveDates={effectiveDates}
                x={x}
                pxPerDay={pxPerDay}
              />

              {tasks.map((task) => {
                const { start, end } = effectiveDates(task);
                return (
                  <Row
                    key={task.id}
                    task={task}
                    start={start}
                    end={end}
                    x={x}
                    pxPerDay={pxPerDay}
                    projectId={projectId}
                    projectKey={projectKey}
                    dragging={drag?.taskId === task.id}
                    onBeginDrag={beginDrag}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {unscheduled.length > 0 && (
        <div className="border-border bg-surface-sunken shrink-0 border-t px-6 py-2">
          <p className="text-ink-subtle mb-1.5 text-xs font-medium">
            Not scheduled ({unscheduled.length}) — give these a due date to
            place them on the timeline
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((task) => (
              <a
                key={task.id}
                href={`/projects/${projectId}?task=${task.id}`}
                className="bg-surface border-border text-ink-muted hover:text-ink rounded border px-2 py-1 text-xs transition"
              >
                <span className="font-mono">
                  {taskRef(projectKey, task.number)}
                </span>{" "}
                {task.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeHeader({
  rangeStart,
  totalDays,
  pxPerDay,
  zoom,
  today,
}: {
  rangeStart: Date;
  totalDays: number;
  pxPerDay: number;
  zoom: Zoom;
  today: Date;
}) {
  const days = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));

  // Month bands across the top; the finer row below depends on zoom.
  const months: { label: string; left: number; width: number }[] = [];
  days.forEach((day, index) => {
    const last = months[months.length - 1];
    if (last && isSameMonth(day, addDays(rangeStart, index - 1))) {
      last.width += pxPerDay;
    } else {
      months.push({
        label: format(day, "MMMM yyyy"),
        left: index * pxPerDay,
        width: pxPerDay,
      });
    }
  });

  return (
    <div className="bg-surface sticky top-0 z-30">
      <div className="flex">
        <div
          className="bg-surface border-border sticky left-0 z-40 shrink-0 border-r border-b"
          style={{ width: LEFT_WIDTH }}
        >
          <div className="text-ink-subtle border-border h-6 border-b px-3 text-[11px] leading-6">
            Task
          </div>
          <div className="h-6" />
        </div>

        <div className="border-border relative border-b" style={{ minWidth: totalDays * pxPerDay }}>
          <div className="relative h-6">
            {months.map((month) => (
              <div
                key={month.label + month.left}
                className="text-ink-muted border-border absolute top-0 h-6 truncate border-l px-2 text-[11px] leading-6"
                style={{ left: month.left, width: month.width }}
              >
                {month.width > 60 ? month.label : ""}
              </div>
            ))}
          </div>

          <div className="relative h-6">
            {days.map((day, index) => {
              const isToday = day.getTime() === today.getTime();
              // At month zoom every day label would be unreadable mush.
              const label =
                zoom === "day"
                  ? format(day, "d")
                  : zoom === "week"
                    ? day.getDay() === 1
                      ? format(day, "d MMM")
                      : ""
                    : day.getDate() === 1
                      ? format(day, "MMM")
                      : "";
              if (!label) return null;
              return (
                <div
                  key={index}
                  className={cn(
                    "absolute top-0 h-6 text-[10px] leading-6 whitespace-nowrap",
                    isToday ? "text-accent font-semibold" : "text-ink-subtle",
                  )}
                  style={{ left: index * pxPerDay + 2 }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayBackground({
  rangeStart,
  totalDays,
  pxPerDay,
  zoom,
  today,
  height,
}: {
  rangeStart: Date;
  totalDays: number;
  pxPerDay: number;
  zoom: Zoom;
  today: Date;
  height: number;
}) {
  const todayOffset = differenceInCalendarDays(today, rangeStart);

  return (
    <div
      className="pointer-events-none absolute top-0"
      style={{ left: LEFT_WIDTH, height, width: totalDays * pxPerDay }}
    >
      {/* Weekend tint only when days are wide enough to make sense of. */}
      {zoom !== "month" &&
        Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i)).map(
          (day, index) =>
            isWeekend(day) ? (
              <div
                key={index}
                className="bg-surface-sunken absolute top-0 h-full opacity-60"
                style={{ left: index * pxPerDay, width: pxPerDay }}
              />
            ) : null,
        )}

      {todayOffset >= 0 && todayOffset <= totalDays && (
        <div
          className="bg-accent absolute top-0 h-full w-px"
          style={{ left: todayOffset * pxPerDay }}
        />
      )}
    </div>
  );
}

/**
 * Arrows from each blocker's end to the blocked task's start. Drawn as one
 * SVG over the grid so the paths can cross rows freely.
 */
function DependencyArrows({
  tasks,
  effectiveDates,
  x,
  pxPerDay,
}: {
  tasks: GanttTask[];
  effectiveDates: (task: GanttTask) => { start: Date | null; end: Date | null };
  x: (date: Date) => number;
  pxPerDay: number;
}) {
  const rowOf = new Map(tasks.map((task, index) => [task.id, index]));
  const paths: string[] = [];

  for (const task of tasks) {
    const toRow = rowOf.get(task.id);
    if (toRow === undefined) continue;
    const to = effectiveDates(task);
    const toX = to.start ? x(to.start) : to.end ? x(to.end) : null;
    if (toX === null) continue;

    for (const blockerId of task.blockedBy) {
      const fromRow = rowOf.get(blockerId);
      const blocker = tasks.find((entry) => entry.id === blockerId);
      if (fromRow === undefined || !blocker) continue;
      const from = effectiveDates(blocker);
      const fromX = from.end ? x(from.end) + pxPerDay : from.start ? x(from.start) : null;
      if (fromX === null) continue;

      const y1 = fromRow * ROW_HEIGHT + ROW_HEIGHT / 2;
      const y2 = toRow * ROW_HEIGHT + ROW_HEIGHT / 2;
      const mid = fromX + 12;
      paths.push(`M ${fromX} ${y1} H ${mid} V ${y2} H ${toX}`);
    }
  }

  if (paths.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute top-0 z-10 overflow-visible"
      style={{ left: LEFT_WIDTH }}
      aria-hidden="true"
    >
      <defs>
        <marker
          id="gantt-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--ink-subtle)" />
        </marker>
      </defs>
      {paths.map((d, index) => (
        <path
          key={index}
          d={d}
          fill="none"
          stroke="var(--ink-subtle)"
          strokeWidth="1.5"
          markerEnd="url(#gantt-arrow)"
        />
      ))}
    </svg>
  );
}

function Row({
  task,
  start,
  end,
  x,
  pxPerDay,
  projectId,
  projectKey,
  dragging,
  onBeginDrag,
}: {
  task: GanttTask;
  start: Date | null;
  end: Date | null;
  x: (date: Date) => number;
  pxPerDay: number;
  projectId: string;
  projectKey: string;
  dragging: boolean;
  onBeginDrag: (
    event: React.PointerEvent,
    taskId: string,
    mode: Drag["mode"],
  ) => void;
}) {
  const done = task.statusCategory === "DONE";
  // A task with only a due date is a milestone, not a zero-length bar.
  const isMilestone = !start && Boolean(end);

  return (
    <div className="flex" style={{ height: ROW_HEIGHT }}>
      <div
        className="bg-surface border-border sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-b px-3"
        style={{ width: LEFT_WIDTH }}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: task.statusColor }}
          title={task.statusName}
        />
        <a
          href={`/projects/${projectId}?task=${task.id}`}
          className="flex min-w-0 items-baseline gap-2"
        >
          <span className="text-ink-subtle shrink-0 font-mono text-[11px]">
            {taskRef(projectKey, task.number)}
          </span>
          <span
            className={cn(
              "truncate text-xs",
              done ? "text-ink-subtle line-through" : "text-ink",
            )}
          >
            {task.title}
          </span>
        </a>
      </div>

      <div className="border-border relative min-w-0 flex-1 border-b">
        {isMilestone && end && (
          <div
            className="group absolute top-1/2 z-10 -translate-y-1/2"
            style={{ left: x(end) + pxPerDay / 2 - 7 }}
          >
            <div
              onPointerDown={(event) => onBeginDrag(event, task.id, "move")}
              title={`${task.title} — due ${format(end, "PP")}. Drag to move; drag the left handle to add a start date.`}
              className={cn(
                "h-3.5 w-3.5 rotate-45 cursor-grab border",
                done
                  ? "bg-surface-sunken border-border-strong"
                  : "bg-warning border-warning",
                dragging && "cursor-grabbing opacity-80",
              )}
            />
            {/*
              Pulling this leftwards turns the milestone into a bar. It
              reveals on hovering the whole milestone, not itself — hiding a
              handle until you hover the handle is unhittable.
            */}
            <div
              onPointerDown={(event) => onBeginDrag(event, task.id, "start")}
              className="absolute top-1/2 -left-3 flex h-5 w-3 -translate-y-1/2 cursor-ew-resize items-center justify-center opacity-0 transition group-hover:opacity-100"
              title="Drag left to set a start date"
            >
              <div className="bg-accent h-4 w-1 rounded-full" />
            </div>
          </div>
        )}

        {start && (
          <div
            className={cn(
              "absolute top-1/2 z-10 flex h-5 -translate-y-1/2 items-center rounded",
              dragging && "opacity-80 ring-2 ring-[var(--accent)]",
            )}
            style={{
              left: x(start),
              width: Math.max(
                ((end ? differenceInCalendarDays(end, start) : 0) + 1) * pxPerDay,
                pxPerDay,
              ),
              backgroundColor: done ? "var(--surface-sunken)" : task.statusColor,
            }}
            title={`${task.title}\n${format(start, "PP")}${end ? ` → ${format(end, "PP")}` : ""}`}
          >
            <div
              onPointerDown={(event) => onBeginDrag(event, task.id, "start")}
              className="h-full w-1.5 shrink-0 cursor-ew-resize rounded-l bg-black/20"
            />
            <div
              onPointerDown={(event) => onBeginDrag(event, task.id, "move")}
              className="h-full min-w-0 flex-1 cursor-grab"
            />
            <div
              onPointerDown={(event) => onBeginDrag(event, task.id, "end")}
              className="h-full w-1.5 shrink-0 cursor-ew-resize rounded-r bg-black/20"
            />
          </div>
        )}
      </div>
    </div>
  );
}
