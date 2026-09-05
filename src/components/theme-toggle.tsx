"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "taskflow-theme";

/*
 * The <html data-theme> attribute is the source of truth, set before paint by
 * the inline script in the root layout. Reading it through
 * useSyncExternalStore rather than mirroring it into component state means
 * there is nothing to keep in sync, no setState in an effect, and no window
 * where the button disagrees with the page.
 */
let listeners: (() => void)[] = [];

function subscribe(onChange: () => void) {
  listeners = [...listeners, onChange];
  return () => {
    listeners = listeners.filter((listener) => listener !== onChange);
  };
}

function getSnapshot(): Theme {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "light" || value === "dark" ? value : "system";
}

/** The server cannot know the preference, so it renders the neutral option. */
function getServerSnapshot(): Theme {
  return "system";
}

function applyTheme(next: Theme) {
  const root = document.documentElement;

  // setAttribute rather than assigning to dataset: the same effect, but it
  // reads as a method call rather than mutating a value React is tracking.
  if (next === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);

  try {
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private browsing or blocked storage: the choice still applies for
    // this session, it just will not be remembered.
  }

  for (const listener of listeners) listener();
}

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      className="border-border bg-surface-sunken flex gap-0.5 rounded-lg border p-0.5"
      role="group"
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => applyTheme(value)}
          aria-pressed={theme === value}
          title={label}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md py-1 transition",
            theme === value
              ? "bg-surface text-ink shadow-[var(--shadow-card)]"
              : "text-ink-subtle hover:text-ink",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
