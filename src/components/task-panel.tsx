"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Archive, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Avatar } from "@/components/ui";
import { inputClass } from "@/components/modal";
import {
  addCommentAction,
  archiveTaskAction,
  setTaskStatusAction,
  updateTaskAction,
} from "@/app/actions";
import type { Priority } from "@/generated/prisma/enums";
import { taskRef } from "@/lib/utils";

type Person = { id: string; name: string | null; image: string | null } | null;

export type PanelTask = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  priority: Priority;
  statusId: string;
  dueDate: string | null;
  startDate: string | null;
  estimateHours: number | null;
  completedAt: string | null;
  createdAt: string;
  comments: {
    id: string;
    body: string;
    createdAt: string;
    author: Person;
  }[];
  activities: {
    id: string;
    type: string;
    data: Record<string, unknown> | null;
    createdAt: string;
    actor: Person;
  }[];
};

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "NONE", label: "No priority" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

/** ISO instant -> the local YYYY-MM-DD an <input type="date"> expects. */
function toDateInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function TaskPanel({
  task,
  projectId,
  projectKey,
  statuses,
}: {
  task: PanelTask;
  projectId: string;
  projectKey: string;
  statuses: { id: string; name: string; color: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [comment, setComment] = useState("");

  // Re-seed the draft fields when a different ticket is opened in the panel.
  const [seededFrom, setSeededFrom] = useState(task.id);
  if (seededFrom !== task.id) {
    setSeededFrom(task.id);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setComment("");
  }

  function close() {
    router.push(`/projects/${projectId}`, { scroll: false });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // Not while typing — Escape should not discard a half-written comment.
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function run(work: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await work();
        router.refresh();
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1500);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message.replace(/^\[.*?\]\s*/, "")
            : "Could not save that change.",
        );
      }
    });
  }

  function saveField(data: Record<string, unknown>) {
    run(() => updateTaskAction({ taskId: task.id, projectId, ...data }));
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 p-4 pt-[7vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${taskRef(projectKey, task.number)} ${task.title}`}
        className="bg-surface-raised border-border scroll-slim flex max-h-[85vh] w-full max-w-2xl flex-col overflow-y-auto rounded-xl border shadow-[var(--shadow-pop)]"
      >
        <header className="border-border bg-surface-raised sticky top-0 z-10 flex items-center gap-2 border-b px-5 py-3">
          <span className="text-ink-subtle font-mono text-xs">
            {taskRef(projectKey, task.number)}
          </span>
          {saved && (
            <span className="text-success flex items-center gap-1 text-xs">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
          {pending && <span className="text-ink-subtle text-xs">Saving…</span>}

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Archive this task? It disappears from the board and the deadline digest.",
                  )
                ) {
                  run(async () => {
                    await archiveTaskAction(task.id, projectId);
                    close();
                  });
                }
              }}
              className="text-ink-subtle hover:text-danger hover:bg-surface-sunken rounded p-1.5 transition"
              aria-label="Archive task"
              title="Archive task"
            >
              <Archive className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={close}
              className="text-ink-subtle hover:text-ink hover:bg-surface-sunken rounded p-1.5 transition"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-5 px-5 py-4">
          {error && (
            <p className="bg-danger-soft text-danger rounded-lg px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <textarea
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => {
              const next = title.trim();
              if (!next) {
                setTitle(task.title);
                return;
              }
              if (next !== task.title) saveField({ title: next });
            }}
            rows={2}
            className="text-ink w-full resize-none rounded-lg bg-transparent px-2 py-1 text-lg leading-snug font-semibold outline-none focus:bg-[var(--surface-sunken)]"
            aria-label="Task title"
          />

          <div className="grid grid-cols-2 gap-3">
            <Labelled label="Status">
              <select
                value={task.statusId}
                onChange={(event) =>
                  run(() =>
                    setTaskStatusAction({
                      taskId: task.id,
                      projectId,
                      statusId: event.target.value,
                    }),
                  )
                }
                className={inputClass}
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </Labelled>

            <Labelled label="Priority">
              <select
                value={task.priority}
                onChange={(event) =>
                  saveField({ priority: event.target.value })
                }
                className={inputClass}
              >
                {PRIORITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Labelled>

            <Labelled label="Start date">
              <input
                type="date"
                defaultValue={toDateInput(task.startDate)}
                onChange={(event) =>
                  saveField({
                    startDate: event.target.value
                      ? `${event.target.value}T00:00:00`
                      : "",
                  })
                }
                className={inputClass}
              />
            </Labelled>

            <Labelled label="Due date">
              <input
                type="date"
                defaultValue={toDateInput(task.dueDate)}
                onChange={(event) =>
                  saveField({
                    // End of day, so a task due today is not overdue at 00:01.
                    dueDate: event.target.value
                      ? `${event.target.value}T23:59:59`
                      : "",
                  })
                }
                className={inputClass}
              />
            </Labelled>
          </div>

          <Labelled label="Description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={() => {
                if (description !== (task.description ?? "")) {
                  saveField({ description: description || null });
                }
              }}
              rows={5}
              placeholder="Add more detail…"
              className={inputClass}
            />
          </Labelled>

          <section>
            <h3 className="text-ink mb-2 text-sm font-semibold">
              Comments{" "}
              <span className="text-ink-subtle font-normal">
                {task.comments.length > 0 && task.comments.length}
              </span>
            </h3>

            <div className="space-y-3">
              {task.comments.map((entry) => (
                <div key={entry.id} className="flex gap-2.5">
                  <Avatar
                    name={entry.author?.name}
                    image={entry.author?.image}
                    size={26}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-ink text-xs font-medium">
                        {entry.author?.name ?? "Someone"}
                      </span>
                      <span
                        className="text-ink-subtle text-[11px]"
                        title={format(new Date(entry.createdAt), "PPpp")}
                      >
                        {formatDistanceToNow(new Date(entry.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-ink-muted mt-0.5 text-sm whitespace-pre-wrap">
                      {entry.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form
              className="mt-3"
              onSubmit={(event) => {
                event.preventDefault();
                const body = comment.trim();
                if (!body) return;
                run(async () => {
                  await addCommentAction({ taskId: task.id, projectId, body });
                  setComment("");
                });
              }}
            >
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={2}
                placeholder="Leave a note…"
                className={inputClass}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={pending || !comment.trim()}
                  className="bg-accent text-accent-ink rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Comment
                </button>
              </div>
            </form>
          </section>

          <section>
            <h3 className="text-ink mb-2 text-sm font-semibold">History</h3>
            <ol className="space-y-1.5">
              {task.activities.map((entry) => (
                <li
                  key={entry.id}
                  className="text-ink-subtle flex items-baseline gap-2 text-xs"
                >
                  <span
                    className="shrink-0"
                    title={format(new Date(entry.createdAt), "PPpp")}
                  >
                    {formatDistanceToNow(new Date(entry.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span className="text-ink-muted">
                    {describeActivity(entry.type, entry.data)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}

function describeActivity(type: string, data: Record<string, unknown> | null) {
  switch (type) {
    case "task.created":
      return "created this task";
    case "status.changed":
      return `moved from ${String(data?.from)} to ${String(data?.to)}`;
    case "due_date.changed": {
      const to = data?.to ? format(new Date(String(data.to)), "PP") : "none";
      const from = data?.from
        ? format(new Date(String(data.from)), "PP")
        : "none";
      return `changed the due date from ${from} to ${to}`;
    }
    default:
      return type;
  }
}

function Labelled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-ink-muted mb-1 block text-xs font-medium">
        {label}
      </span>
      {children}
    </label>
  );
}
