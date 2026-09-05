"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const COOKIE = "taskflow-theme";
const ONE_YEAR = 60 * 60 * 24 * 365;

/*
 * The <html data-theme> attribute is the source of truth. The server sets it
 * from a cookie, so it is already correct in the first byte of HTML; this
 * control reads it rather than keeping a copy, which means there is no window
 * where the button and the page disagree.
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

/** Server render cannot read the DOM; the real value arrives on hydration. */
function getServerSnapshot(): Theme {
  return "system";
}

function applyTheme(next: Theme) {
  const root = document.documentElement;

  // Applied immediately so the change is instant, and written to the cookie
  // so the next server render agrees without a client round trip.
  if (next === "system") {
    root.removeAttribute("data-theme");
    document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    root.setAttribute("data-theme", next);
    document.cookie = `${COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
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
