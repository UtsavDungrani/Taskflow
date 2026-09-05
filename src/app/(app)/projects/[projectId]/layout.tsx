import { notFound } from "next/navigation";

import { ViewTabs } from "@/components/view-tabs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();

  // Layouts and pages render concurrently in the App Router, so this header
  // query overlaps the page's own fetch rather than adding to it.
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId: user.id } } } },
    select: { id: true, name: true, key: true, color: true, description: true },
  });

  if (!project) notFound();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-border shrink-0 border-b px-6 pt-3">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="text-ink text-base font-semibold tracking-tight">
            {project.name}
          </h1>
          <span className="text-ink-subtle font-mono text-xs">
            {project.key}
          </span>
          {project.description && (
            <p className="text-ink-muted ml-2 truncate text-sm">
              {project.description}
            </p>
          )}
        </div>

        <ViewTabs projectId={project.id} />
      </header>

      {children}
    </div>
  );
}
