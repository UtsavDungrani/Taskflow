"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Field, Modal, SubmitButton, inputClass } from "@/components/modal";
import { createProjectAction } from "@/app/actions";

// Earth tones rather than the usual saturated wheel: they sit on a cream
// canvas without fighting it, and leave red free to mean "late".
const COLORS = [
  "#b4471f",
  "#c88b2e",
  "#5e8c4a",
  "#3e7c7b",
  "#a86b8c",
  "#8c5a3c",
  "#6e8b74",
  "#8a8578",
];

/** "Visual Whiteboard Pro" -> "VWP"; "udur" -> "UDU". */
function suggestKey(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 4)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  // Once the user edits the key by hand, stop overwriting it from the name.
  const [keyTouched, setKeyTouched] = useState(false);
  const [key, setKey] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await createProjectAction({
          name: String(formData.get("name") ?? ""),
          key: String(formData.get("key") ?? ""),
          description: String(formData.get("description") ?? ""),
          color,
        });
        router.push(`/projects/${result.id}`);
        router.refresh();
        onClose();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message.replace(/^\[.*?\]\s*/, "")
            : "Could not create the project.",
        );
      }
    });
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name">
          <input
            name="name"
            className={inputClass}
            placeholder="Visual Whiteboard Pro"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!keyTouched) setKey(suggestKey(event.target.value));
            }}
            required
            maxLength={120}
          />
        </Field>

        <Field label="Ticket prefix" hint="Tickets appear as e.g. VWP-14.">
          <input
            name="key"
            className={`${inputClass} font-mono uppercase`}
            placeholder="VWP"
            value={key}
            onChange={(event) => {
              setKeyTouched(true);
              setKey(event.target.value.replace(/[^A-Za-z]/g, "").toUpperCase());
            }}
            required
            minLength={2}
            maxLength={6}
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            className={inputClass}
            rows={2}
            placeholder="Optional"
            maxLength={2000}
          />
        </Field>

        <Field label="Colour">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`Colour ${option}`}
                aria-pressed={color === option}
                className={`h-6 w-6 rounded-md transition ${
                  color === option
                    ? "ring-accent ring-2 ring-offset-2 ring-offset-[var(--surface-raised)]"
                    : ""
                }`}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </Field>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:bg-surface-sunken rounded-lg px-3 py-2 text-sm transition"
          >
            Cancel
          </button>
          <SubmitButton pending={pending}>Create project</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
