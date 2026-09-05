"use client";

import { CalendarDays, GanttChartSquare, KanbanSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function ViewTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  const tabs = [
    { href: base, label: "Board", icon: KanbanSquare },
    { href: `${base}/gantt`, label: "Gantt", icon: GanttChartSquare },
    { href: `${base}/calendar`, label: "Calendar", icon: CalendarDays },
  ];

  return (
    <nav className="mt-2 flex gap-1">
      {tabs.map((tab) => {
        // The board sits at the bare project path, so it would match every
        // sub-route under startsWith. Compare exactly for it.
        const active =
          tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition",
              active
                ? "border-accent text-ink font-medium"
                : "text-ink-muted hover:text-ink border-transparent",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
