"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { registerAndLoginAction } from "@/app/actions";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(
    registerAndLoginAction,
    null,
  );

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
          htmlFor="name"
          className="text-ink mb-1.5 block text-xs font-medium"
        >
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Jane Doe"
          className="border-border bg-surface text-ink placeholder:text-ink-subtle focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
        />
      </div>

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
        <label
          htmlFor="password"
          className="text-ink mb-1.5 block text-xs font-medium"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="At least 6 characters"
          className="border-border bg-surface text-ink placeholder:text-ink-subtle focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="text-ink mb-1.5 block text-xs font-medium"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Re-enter password"
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
            <span>Creating account…</span>
          </>
        ) : (
          <span>Create account</span>
        )}
      </button>

      <div className="text-ink-muted pt-1 text-center text-xs">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-accent hover:underline font-medium"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
