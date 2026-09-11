"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { loginAction } from "@/app/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="bg-danger-soft text-danger border-danger/20 rounded-lg border p-3 text-sm"
        >
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="text-ink mb-1.5 block text-xs font-medium"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="border-border bg-surface text-ink placeholder:text-ink-subtle focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-ink block text-xs font-medium"
          >
            Password
          </label>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="border-border bg-surface text-ink placeholder:text-ink-subtle focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-accent text-accent-ink hover:opacity-90 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Signing in…</span>
          </>
        ) : (
          <span>Sign in with Email</span>
        )}
      </button>

      <div className="text-ink-muted pt-1 text-center text-xs">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-accent hover:underline font-medium"
        >
          Create one
        </Link>
      </div>
    </form>
  );
}
