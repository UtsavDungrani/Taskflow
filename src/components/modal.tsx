"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function Modal({
  title,
  onClose,
  children,
  width = "max-w-md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    // Focus the first field so the dialog is usable without reaching for the
    // mouse — this app is meant to be fast to log into and fast to leave.
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input, textarea, select",
    );
    first?.focus();

    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-surface-raised border-border w-full ${width} rounded-xl border shadow-[var(--shadow-pop)]`}
      >
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-ink text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-subtle hover:text-ink hover:bg-surface-sunken rounded p-1 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-ink-muted mb-1 block text-xs font-medium">
        {label}
      </span>
      {children}
      {hint && <span className="text-ink-subtle mt-1 block text-xs">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-subtle focus:border-accent focus:ring-2 focus:ring-accent/20";

export function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-accent text-accent-ink rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
