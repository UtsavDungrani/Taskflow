"use client";

import { CalendarClock, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NewProjectDialog } from "@/components/new-project-dialog";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  key: string;
  color: string;
};

export function Sidebar({
  workspaceName,
  projects,
  user,
  signOutAction,
}: {
  workspaceName: string;
  projects: Project[];
  user: { name: string | null; email: string | null; image: string | null };
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <aside className="bg-surface border-border flex w-60 shrink-0 flex-col border-r">
        <div className="border-border flex items-center gap-2 border-b px-4 py-3">
          <div className="bg-accent text-accent-ink flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold">
            TF
          </div>
          <div className="min-w-0">
            <p className="text-ink truncate text-sm font-semibold">TaskFlow</p>
            <p className="text-ink-subtle truncate text-xs">{workspaceName}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <NavLink
            href="/"
            active={pathname === "/"}
            icon={<CalendarClock className="h-4 w-4" />}
          >
            Deadlines
          </NavLink>

          <div className="mt-5 mb-1 flex items-center justify-between px-2">
            <span className="text-ink-subtle text-xs font-medium tracking-wide uppercase">
              Projects
            </span>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="text-ink-subtle hover:text-ink hover:bg-surface-sunken rounded p-1 transition"
              aria-label="New project"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-ink-subtle px-2 py-2 text-xs">
              No projects yet.
            </p>
          ) : (
            projects.map((project) => (
              <NavLink
                key={project.id}
                href={`/projects/${project.id}`}
                active={pathname.startsWith(`/projects/${project.id}`)}
                icon={
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: project.color }}
                  />
                }
              >
                {project.name}
              </NavLink>
            ))
          )}
        </nav>

        <div className="border-border border-t p-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar name={user.name} image={user.image} size={26} />
            <div className="min-w-0 flex-1">
              <p className="text-ink truncate text-xs font-medium">
                {user.name ?? "You"}
              </p>
              <p className="text-ink-subtle truncate text-[11px]">
                {user.email}
              </p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-ink-subtle hover:text-ink hover:bg-surface-sunken rounded p-1.5 transition"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {creating && <NewProjectDialog onClose={() => setCreating(false)} />}
    </>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition",
        active
          ? "bg-accent-soft text-accent font-medium"
          : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
      )}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
}
