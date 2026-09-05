import { redirect } from "next/navigation";

import { Sidebar } from "@/components/sidebar";
import { auth, signOut } from "@/lib/auth";
import { getShell } from "@/server/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Workspace and sidebar projects in a single query. A brand-new account
  // gets its workspace created here, so every page below can assume one.
  const workspace = await getShell(session.user.id);
  const projects = workspace.projects;

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
