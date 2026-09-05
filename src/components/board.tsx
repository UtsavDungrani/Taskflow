"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, Network, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { NewTaskDialog } from "@/components/new-task-dialog";
import { Avatar, DueDateChip, PriorityBadge } from "@/components/ui";
import { moveTaskAction } from "@/app/actions";
import type { Priority, StatusCategory } from "@/generated/prisma/enums";
import { cn, taskRef } from "@/lib/utils";

export type BoardTask = {
  id: string;
  number: number;
  title: string;
  priority: Priority;
  dueDate: string | null;
  position: number;
  assignee: { id: string; name: string | null; image: string | null } | null;
  labels: { id: string; name: string; color: string }[];
  subtaskCount: number;
  commentCount: number;
};

export type BoardColumn = {
  id: string;
  name: string;
  color: string;
  category: StatusCategory;
  tasks: BoardTask[];
};

export function Board({
  projectId,
  projectKey,
  columns: initialColumns,
}: {
  projectId: string;
  projectKey: string;
  columns: BoardColumn[];
}) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composingIn, setComposingIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Server data wins whenever the route revalidates (new task, edit, etc.).
  // Adjusting state during render rather than in an effect: React re-runs this
  // component immediately with the new state instead of painting a stale board
  // first, and it avoids the cascading-render warning.
  const [syncedFrom, setSyncedFrom] = useState(initialColumns);
  if (syncedFrom !== initialColumns) {
    setSyncedFrom(initialColumns);
    setColumns(initialColumns);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Without a small threshold, every click on a card starts a drag and
      // the card never opens.
      activationConstraint: { distance: 4 },
    }),
  );

  // Plain computation rather than useMemo: the React Compiler memoizes this
  // for us, and hand-rolling it here returns a fresh object the compiler
  // cannot preserve.
  function findCard(id: string | null) {
    if (!id) return null;
    for (const column of columns) {
      const found = column.tasks.find((task) => task.id === id);
      if (found) return { task: found, done: column.category === "DONE" };
    }
    return null;
  }

  const activeCard = findCard(activeId);

  function findColumnOf(taskId: string) {
    return columns.find((column) =>
      column.tasks.some((task) => task.id === taskId),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    const source = findColumnOf(taskId);
    if (!source) return;

    // `over` is either another card or the column's empty drop area.
    const destination =
      columns.find((column) => column.id === overId) ?? findColumnOf(overId);
    if (!destination) return;

    const withoutTask = destination.tasks.filter((task) => task.id !== taskId);
    const overIndex = withoutTask.findIndex((task) => task.id === overId);
    const insertAt = overId === destination.id ? withoutTask.length : overIndex;
    const index = insertAt < 0 ? withoutTask.length : insertAt;

    if (source.id === destination.id) {
      const currentIndex = source.tasks.findIndex((task) => task.id === taskId);
      if (currentIndex === index) return;
    }

    const before = withoutTask[index - 1] ?? null;
    const after = withoutTask[index] ?? null;

    const previous = columns;
    const task = source.tasks.find((entry) => entry.id === taskId)!;

    // Optimistic: move the card now, reconcile if the server disagrees.
    setColumns((current) =>
      current.map((column) => {
        if (column.id === source.id && column.id === destination.id) {
          const next = column.tasks.filter((entry) => entry.id !== taskId);
          next.splice(index, 0, task);
          return { ...column, tasks: next };
        }
        if (column.id === source.id) {
          return {
            ...column,
            tasks: column.tasks.filter((entry) => entry.id !== taskId),
          };
        }
        if (column.id === destination.id) {
          const next = [...withoutTask];
          next.splice(index, 0, task);
          return { ...column, tasks: next };
        }
        return column;
      }),
    );

    try {
      await moveTaskAction({
        taskId,
        projectId,
        statusId: destination.id,
        beforeId: before?.id ?? null,
        afterId: after?.id ?? null,
      });
      router.refresh();
    } catch {
      setColumns(previous);
      setError("Could not move that card. Your change was rolled back.");
    }
  }

  return (
    <>
      {error && (
        <div className="bg-danger-soft text-danger border-danger/20 mx-6 mt-3 rounded-lg border px-3 py-2 text-sm">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <DndContext
        // dnd-kit derives its accessibility ids from a module-level counter,
        // which starts at a different value on the server than in the browser
        // and produced a hydration mismatch on aria-describedby. A fixed id
        // makes both renders agree.
        id="taskflow-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="scroll-slim flex flex-1 gap-4 overflow-x-auto px-6 py-4">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              projectKey={projectKey}
              onCompose={() => setComposingIn(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <TaskCard
              task={activeCard.task}
              projectKey={projectKey}
              done={activeCard.done}
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {composingIn && (
        <NewTaskDialog
          projectId={projectId}
          statusId={composingIn}
          statusName={
            columns.find((column) => column.id === composingIn)?.name ?? ""
          }
          onClose={() => setComposingIn(null)}
        />
      )}
    </>
  );
}

function Column({
  column,
  projectKey,
  onCompose,
}: {
  column: BoardColumn;
  projectKey: string;
  onCompose: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h2 className="text-ink text-sm font-medium">{column.name}</h2>
        <span className="text-ink-subtle text-xs tabular-nums">
          {column.tasks.length}
        </span>
        <button
          type="button"
          onClick={onCompose}
          className="text-ink-subtle hover:text-ink hover:bg-surface-sunken ml-auto rounded p-1 transition"
          aria-label={`Add task to ${column.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "scroll-slim bg-surface-sunken flex-1 space-y-2 overflow-y-auto rounded-xl p-2 transition",
          isOver && "ring-accent/40 ring-2",
        )}
      >
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              projectKey={projectKey}
              done={column.category === "DONE"}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <button
            type="button"
            onClick={onCompose}
            className="border-border text-ink-subtle hover:text-ink hover:border-border-strong w-full rounded-lg border border-dashed py-6 text-xs transition"
          >
            Add a task
          </button>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({
  task,
  projectKey,
  done,
}: {
  task: BoardTask;
  projectKey: string;
  done: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(isDragging && "opacity-40")}
    >
      <TaskCard task={task} projectKey={projectKey} done={done} />
    </div>
  );
}

function TaskCard({
  task,
  projectKey,
  done = false,
  dragging = false,
}: {
  task: BoardTask;
  projectKey: string;
  done?: boolean;
  dragging?: boolean;
}) {
  return (
    <article
      className={cn(
        "bg-surface border-border cursor-grab rounded-lg border p-2.5 shadow-[var(--shadow-card)] active:cursor-grabbing",
        dragging && "rotate-2 shadow-[var(--shadow-pop)]",
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-ink-subtle font-mono text-[11px]">
          {taskRef(projectKey, task.number)}
        </span>
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="ml-auto">
            <DueDateChip date={task.dueDate} done={done} />
          </span>
        )}
      </div>

      <p className="text-ink text-sm leading-snug">{task.title}</p>

      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${label.color}22`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {(task.subtaskCount > 0 ||
        task.commentCount > 0 ||
        task.assignee) && (
        <div className="text-ink-subtle mt-2 flex items-center gap-3 text-[11px]">
          {task.subtaskCount > 0 && (
            <span className="flex items-center gap-1">
              <Network className="h-3 w-3" />
              {task.subtaskCount}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.commentCount}
            </span>
          )}
          {task.assignee && (
            <span className="ml-auto">
              <Avatar
                name={task.assignee.name}
                image={task.assignee.image}
                size={20}
              />
            </span>
          )}
        </div>
      )}
    </article>
  );
}
