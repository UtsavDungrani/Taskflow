"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Archive, Check, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Avatar } from "@/components/ui";
import { inputClass } from "@/components/modal";
import {
  addCommentAction,
  archiveTaskAction,
  deleteTimeEntryAction,
  logTimeAction,
  setTaskStatusAction,
  updateTaskAction,
  updateTimeEntryAction,
} from "@/app/actions";
import { formatDuration, parseDuration } from "@/lib/duration";
import type { Priority } from "@/generated/prisma/enums";
import { cn, taskRef } from "@/lib/utils";

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
  estimateMinutes: number | null;
  spentMinutes: number;
  timeEntries: {
    id: string;
    minutes: number;
    note: string | null;
    spentOn: string;
    user: Person;
  }[];
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
  // See the note on `dirty` in TimeSection: blur alone is not evidence of an
  // edit, so these fields only write when the user actually typed in them.
  const [titleDirty, setTitleDirty] = useState(false);
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const [comment, setComment] = useState("");
  const [estimate, setEstimate] = useState(
    task.estimateMinutes ? formatDuration(task.estimateMinutes) : "",
  );
  const [logAmount, setLogAmount] = useState("");
  const [logNote, setLogNote] = useState("");
  const [logDate, setLogDate] = useState(() => toDateInput(new Date().toISOString()));

  // Re-seed the draft fields when a different ticket is opened in the panel.
  const [seededFrom, setSeededFrom] = useState(task.id);
  if (seededFrom !== task.id) {
    setSeededFrom(task.id);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setComment("");
    setEstimate(task.estimateMinutes ? formatDuration(task.estimateMinutes) : "");
    setLogAmount("");
    setLogNote("");
    setTitleDirty(false);
    setDescriptionDirty(false);
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
            onChange={(event) => {
              setTitleDirty(true);
              setTitle(event.target.value);
            }}
            onBlur={() => {
              if (!titleDirty) return;
              const next = title.trim();
              if (!next) {
                setTitle(task.title);
                setTitleDirty(false);
                return;
              }
              if (next !== task.title) saveField({ title: next });
              setTitleDirty(false);
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
              onChange={(event) => {
                setDescriptionDirty(true);
                setDescription(event.target.value);
              }}
              onBlur={() => {
                if (!descriptionDirty) return;
                if (description !== (task.description ?? "")) {
                  saveField({ description: description || null });
                }
                setDescriptionDirty(false);
              }}
              rows={5}
              placeholder="Add more detail…"
              className={inputClass}
            />
          </Labelled>

          <TimeSection
            task={task}
            projectId={projectId}
            pending={pending}
            estimate={estimate}
            setEstimate={setEstimate}
            logAmount={logAmount}
            setLogAmount={setLogAmount}
            logNote={logNote}
            setLogNote={setLogNote}
            logDate={logDate}
            setLogDate={setLogDate}
            onSaveEstimate={(minutes) => saveField({ estimateMinutes: minutes })}
            onLog={(minutes) =>
              run(async () => {
                await logTimeAction({
                  taskId: task.id,
                  projectId,
                  minutes,
                  note: logNote.trim() || undefined,
                  spentOn: logDate,
                });
                setLogAmount("");
                setLogNote("");
              })
            }
            onDeleteEntry={(entryId) =>
              run(() => deleteTimeEntryAction(entryId, projectId))
            }
            onUpdateEntry={(entryId, patch) =>
              run(() =>
                updateTimeEntryAction({ entryId, projectId, ...patch }),
              )
            }
          />

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

function TimeSection({
  task,
  pending,
  estimate,
  setEstimate,
  logAmount,
  setLogAmount,
  logNote,
  setLogNote,
  logDate,
  setLogDate,
  onSaveEstimate,
  onLog,
  onDeleteEntry,
  onUpdateEntry,
}: {
  task: PanelTask;
  projectId: string;
  pending: boolean;
  estimate: string;
  setEstimate: (value: string) => void;
  logAmount: string;
  setLogAmount: (value: string) => void;
  logNote: string;
  setLogNote: (value: string) => void;
  logDate: string;
  setLogDate: (value: string) => void;
  onSaveEstimate: (minutes: number | null) => void;
  onLog: (minutes: number) => void;
  onDeleteEntry: (entryId: string) => void;
  onUpdateEntry: (
    entryId: string,
    patch: { minutes: number; note?: string; spentOn: string },
  ) => void;
}) {
  const [amountError, setAmountError] = useState<string | null>(null);

  /*
   * Save-on-blur has a sharp edge: a blur fires whether or not the user
   * touched the field, so an input that happens to be empty at that moment
   * will happily persist "cleared". That silently destroyed an estimate
   * during testing. Only write when the field has actually been edited, and
   * forget the edit once the server value catches up.
   */
  const [dirty, setDirty] = useState(false);
  const [syncedEstimate, setSyncedEstimate] = useState(task.estimateMinutes);
  if (syncedEstimate !== task.estimateMinutes) {
    setSyncedEstimate(task.estimateMinutes);
    setDirty(false);
  }

  const spent = task.spentMinutes;
  const estimated = task.estimateMinutes ?? 0;
  const over = estimated > 0 && spent > estimated;
  const percent =
    estimated > 0 ? Math.min((spent / estimated) * 100, 100) : 0;

  const parsedLog = parseDuration(logAmount);

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-ink text-sm font-semibold">Time</h3>
        <span className="text-ink-subtle text-xs tabular-nums">
          {formatDuration(spent)} logged
          {estimated > 0 && ` of ${formatDuration(estimated)}`}
        </span>
      </div>

      {estimated > 0 && (
        <div className="mb-3">
          <div className="bg-surface-sunken h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                over ? "bg-danger" : "bg-success",
              )}
              style={{ width: `${Math.max(percent, spent > 0 ? 3 : 0)}%` }}
            />
          </div>
          {over && (
            <p className="text-danger mt-1 text-xs">
              {formatDuration(spent - estimated)} over estimate
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block">
          <span className="text-ink-muted mb-1 block text-xs font-medium">
            Estimate
          </span>
          <input
            value={estimate}
            onChange={(event) => {
              setDirty(true);
              setEstimate(event.target.value);
            }}
            onBlur={() => {
              // Untouched field: nothing to save, and crucially nothing to
              // clear. See the note on `dirty` above.
              if (!dirty) return;

              const text = estimate.trim();
              if (text === "") {
                if (task.estimateMinutes !== null) onSaveEstimate(null);
                setDirty(false);
                return;
              }
              const minutes = parseDuration(text);
              if (minutes === null) {
                // Unparseable: put the stored value back rather than guess.
                setEstimate(
                  task.estimateMinutes
                    ? formatDuration(task.estimateMinutes)
                    : "",
                );
                setDirty(false);
                return;
              }
              if (minutes !== task.estimateMinutes) onSaveEstimate(minutes);
              setEstimate(formatDuration(minutes));
            }}
            placeholder="e.g. 4h, 90m, 1h 30m"
            className={inputClass}
          />
        </label>
      </div>

      <form
        className="mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          const minutes = parseDuration(logAmount);
          if (minutes === null) {
            setAmountError("Try 2h, 45m, 1h 30m or 1:30.");
            return;
          }
          setAmountError(null);
          onLog(minutes);
        }}
      >
        <span className="text-ink-muted mb-1 block text-xs font-medium">
          Log time
        </span>
        {/*
          Two rows rather than one. A native date input will not shrink below
          its own content width, so putting amount, date, note and the button
          on a single line forced the modal to scroll sideways. Each track
          here is either fixed or free to shrink to zero (minmax(0,1fr)).
        */}
        <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] gap-2">
          <input
            value={logAmount}
            onChange={(event) => {
              setLogAmount(event.target.value);
              if (amountError) setAmountError(null);
            }}
            placeholder="2h"
            aria-label="Amount of time"
            className={inputClass}
          />
          <input
            type="date"
            value={logDate}
            onChange={(event) => setLogDate(event.target.value)}
            aria-label="Day the work happened"
            className={`${inputClass} min-w-0`}
          />
          <button
            type="submit"
            disabled={pending || !logAmount.trim()}
            className="bg-accent text-accent-ink shrink-0 rounded-lg px-4 py-2 text-xs font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Log
          </button>
        </div>
        <input
          value={logNote}
          onChange={(event) => setLogNote(event.target.value)}
          placeholder="What did you do? (optional)"
          aria-label="Note"
          className={`${inputClass} mt-2`}
        />
        {amountError ? (
          <p className="text-danger mt-1 text-xs">{amountError}</p>
        ) : (
          parsedLog !== null && (
            <p className="text-ink-subtle mt-1 text-xs">
              Will log {formatDuration(parsedLog)}
            </p>
          )
        )}
      </form>

      {task.timeEntries.length > 0 && (
        <ul className="divide-border border-border mt-3 divide-y rounded-lg border">
          {task.timeEntries.map((entry) => (
            <TimeEntryRow
              key={entry.id}
              entry={entry}
              pending={pending}
              onDelete={() => onDeleteEntry(entry.id)}
              onSave={(patch) => onUpdateEntry(entry.id, patch)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * A logged entry, editable in place. Edit state is local to the row so
 * opening one does not disturb any other, and cancelling restores the
 * server's values rather than whatever was half-typed.
 */
function TimeEntryRow({
  entry,
  pending,
  onDelete,
  onSave,
}: {
  entry: PanelTask["timeEntries"][number];
  pending: boolean;
  onDelete: () => void;
  onSave: (patch: {
    minutes: number;
    note?: string;
    spentOn: string;
  }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(formatDuration(entry.minutes));
  const [note, setNote] = useState(entry.note ?? "");
  const [day, setDay] = useState(toDateInput(entry.spentOn));
  const [amountError, setAmountError] = useState<string | null>(null);

  function beginEdit() {
    setAmount(formatDuration(entry.minutes));
    setNote(entry.note ?? "");
    setDay(toDateInput(entry.spentOn));
    setAmountError(null);
    setEditing(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const minutes = parseDuration(amount);
    if (minutes === null) {
      setAmountError("Try 2h, 45m, 1h 30m or 1:30.");
      return;
    }
    onSave({ minutes, note: note.trim() || undefined, spentOn: day });
    setEditing(false);
  }

  if (!editing) {
    return (
      <li className="group flex items-baseline gap-2 px-3 py-1.5 text-xs">
        <span className="text-ink w-16 shrink-0 font-medium tabular-nums">
          {formatDuration(entry.minutes)}
        </span>
        <span className="text-ink-subtle w-20 shrink-0">
          {format(new Date(entry.spentOn), "d MMM")}
        </span>
        <span className="text-ink-muted min-w-0 flex-1 truncate">
          {entry.note ?? ""}
        </span>
        {/* Revealed on hovering the row, not the button itself. */}
        <span className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={beginEdit}
            disabled={pending}
            className="text-ink-subtle hover:text-ink transition disabled:opacity-40"
            aria-label={`Edit ${formatDuration(entry.minutes)} entry`}
            title="Edit entry"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="text-ink-subtle hover:text-danger transition disabled:opacity-40"
            aria-label={`Delete ${formatDuration(entry.minutes)} entry`}
            title="Delete entry"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </li>
    );
  }

  return (
    <li className="bg-surface-sunken px-3 py-2">
      <form onSubmit={submit}>
        {/* Same two-row shape as the log form, for the same reason: a native
            date input will not shrink, so it gets its own track. */}
        <div className="grid grid-cols-[minmax(0,6rem)_minmax(0,1fr)_auto_auto] gap-2">
          <input
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              if (amountError) setAmountError(null);
            }}
            aria-label="Amount of time"
            className={`${inputClass} text-xs`}
            autoFocus
          />
          <input
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
            aria-label="Day the work happened"
            className={`${inputClass} min-w-0 text-xs`}
          />
          <button
            type="submit"
            disabled={pending}
            className="bg-accent text-accent-ink shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-90 disabled:opacity-40"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-ink-muted hover:bg-surface shrink-0 rounded-lg px-2 py-2 text-xs transition"
          >
            Cancel
          </button>
        </div>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What did you do? (optional)"
          aria-label="Note"
          className={`${inputClass} mt-2 text-xs`}
        />
        {amountError && (
          <p className="text-danger mt-1 text-xs">{amountError}</p>
        )}
      </form>
    </li>
  );
}

function describeActivity(type: string, data: Record<string, unknown> | null) {
  switch (type) {
    case "task.created":
      return "created this task";
    case "status.changed":
      return `moved from ${String(data?.from)} to ${String(data?.to)}`;
    case "time.logged":
      return `logged ${formatDuration(Number(data?.minutes ?? 0))}`;
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
