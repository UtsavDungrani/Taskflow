"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Field, Modal, SubmitButton, inputClass } from "@/components/modal";
import { createTaskAction } from "@/app/actions";

const PRIORITIES = [
  { value: "NONE", label: "No priority" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

/** Local YYYY-MM-DD for <input type="date">, avoiding a UTC off-by-one. */
function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function NewTaskDialog({
  projectId,
  statusId,
  statusName,
  onClose,
}: {
  projectId: string;
  statusId: string;
  statusName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const dueDate = String(formData.get("dueDate") ?? "");

    startTransition(async () => {
      try {
        await createTaskAction({
          projectId,
          statusId,
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          priority: String(formData.get("priority") ?? "NONE"),
          // Land due dates at end of day: a task due "today" should not read
          // as overdue from 00:01 onwards.
          dueDate: dueDate ? `${dueDate}T23:59:59` : "",
        });
        router.refresh();
        onClose();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message.replace(/^\[.*?\]\s*/, "")
            : "Could not create the task.",
        );
      }
    });
  }

  const today = toDateInput(new Date());

  return (
    <Modal title={`New task in ${statusName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title">
          <input
            name="title"
            className={inputClass}
            placeholder="What needs doing?"
            required
            maxLength={500}
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            className={inputClass}
            rows={3}
            placeholder="Optional"
            maxLength={20000}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <select name="priority" className={inputClass} defaultValue="NONE">
              {PRIORITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Due date">
            <input
              type="date"
              name="dueDate"
              className={inputClass}
              min={undefined}
              defaultValue=""
              data-today={today}
            />
          </Field>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:bg-surface-sunken rounded-lg px-3 py-2 text-sm transition"
          >
            Cancel
          </button>
          <SubmitButton pending={pending}>Create task</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
