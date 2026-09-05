import { redirect } from "next/navigation";

import { auth, devLoginEnabled, gitHubEnabled, signIn } from "@/lib/auth";

export const metadata = { title: "Sign in · TaskFlow" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const nothingConfigured = !gitHubEnabled && !devLoginEnabled;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="bg-accent text-accent-ink mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold">
            TF
          </div>
          <h1 className="font-display text-ink text-2xl font-semibold">
            TaskFlow
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            Projects, tickets and deadlines that refuse to be forgotten.
          </p>
        </div>

        <div className="bg-surface border-border space-y-3 rounded-xl border p-5 shadow-[var(--shadow-card)]">
          {gitHubEnabled && (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="bg-ink text-canvas hover:opacity-90 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition"
              >
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="h-4 w-4 fill-current"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                Continue with GitHub
              </button>
            </form>
          )}

          {gitHubEnabled && devLoginEnabled && (
            <div className="flex items-center gap-3">
              <span className="bg-border h-px flex-1" />
              <span className="text-ink-subtle text-xs">or</span>
              <span className="bg-border h-px flex-1" />
            </div>
          )}

          {devLoginEnabled && (
            <form
              action={async () => {
                "use server";
                await signIn("dev-login", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="border-border text-ink hover:bg-surface-sunken w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              >
                Continue as local developer
              </button>
              <p className="text-ink-subtle mt-2 text-center text-xs">
                Development only. Disabled when NODE_ENV is production.
              </p>
            </form>
          )}

          {nothingConfigured && (
            <div className="text-sm">
              <p className="text-ink font-medium">No sign-in method configured</p>
              <p className="text-ink-muted mt-2">
                Set <code className="font-mono text-xs">ALLOW_DEV_LOGIN</code> and{" "}
                <code className="font-mono text-xs">DEV_LOGIN_EMAIL</code> in{" "}
                <code className="font-mono text-xs">.env</code>, or add GitHub
                OAuth credentials. See{" "}
                <code className="font-mono text-xs">.env.example</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
