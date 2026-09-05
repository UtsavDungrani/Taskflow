import { redirect } from "next/navigation";

import { Sidebar } from "@/components/sidebar";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureWorkspace } from "@/server/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // A brand-new account has no workspace yet; create it here so every
  // authenticated page below can assume one exists.
  const workspace = await ensureWorkspace(session.user.id);

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id, archivedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, key: true, color: true },
  });

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar
        workspaceName={workspace.name}
        projects={projects}
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
        }}
        signOutAction={handleSignOut}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
