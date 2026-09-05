import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import type { ReactNode } from "react";

import type { Priority } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-surface border-border rounded-xl border shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  count,
  tone = "default",
}: {
  title: string;
  count?: number;
  tone?: "default" | "danger" | "warning";
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2
        className={cn(
          "text-sm font-semibold tracking-tight",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-warning",
          tone === "default" && "text-ink",
        )}
      >
        {title}
      </h2>
      {count !== undefined && (
        <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

const PRIORITY_STYLES: Record<Priority, { label: string; className: string }> = {
  URGENT: { label: "Urgent", className: "bg-danger-soft text-danger" },
  HIGH: { label: "High", className: "bg-warning-soft text-warning" },
  MEDIUM: { label: "Medium", className: "bg-accent-soft text-accent" },
  LOW: { label: "Low", className: "bg-surface-sunken text-ink-muted" },
  NONE: { label: "None", className: "bg-surface-sunken text-ink-subtle" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "NONE") return null;
  const style = PRIORITY_STYLES[priority];

  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[11px] font-medium",
        style.className,
      )}
    >
      {style.label}
    </span>
  );
}

/**
 * The chip that does the actual nagging. Overdue is red and states how late;
 * today and tomorrow are named rather than dated, because "Jul 4" does not
 * register as urgent the way "Today" does.
 */
export function DueDateChip({
  date,
  done = false,
}: {
  date: Date | string;
  done?: boolean;
}) {
  const value = typeof date === "string" ? new Date(date) : date;
  const days = differenceInCalendarDays(value, new Date());

  let label: string;
  if (isToday(value)) label = "Today";
  else if (isTomorrow(value)) label = "Tomorrow";
  else if (days < 0)
    label = `${Math.abs(days)}d overdue`;
  else if (days <= 6) label = format(value, "EEE");
  else label = format(value, "MMM d");

  const tone = done
    ? "bg-surface-sunken text-ink-subtle"
    : days < 0
      ? "bg-danger-soft text-danger font-semibold"
      : days === 0
        ? "bg-warning-soft text-warning font-semibold"
        : "bg-surface-sunken text-ink-muted";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] whitespace-nowrap",
        tone,
      )}
      title={format(value, "PPP")}
    >
      {label}
    </span>
  );
}

export function Avatar({
  name,
  image,
  size = 24,
}: {
  name?: string | null;
  image?: string | null;
  size?: number;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (image) {
    return (
      // Avatars are small, remote (GitHub) and already the right size; the
      // next/image optimizer would add a round trip for no benefit here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? "Assignee"}
        width={size}
        height={size}
        className="border-border rounded-full border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="bg-surface-sunken text-ink-muted border-border inline-flex items-center justify-center rounded-full border font-medium"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name ?? undefined}
    >
      {initials || "?"}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border text-center rounded-xl border border-dashed px-6 py-10">
      <p className="text-ink text-sm font-medium">{title}</p>
      {description && (
        <p className="text-ink-muted mx-auto mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
