"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  user?: any;
}

export default function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-border/80 bg-surface/80 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-accent text-accent-ink shadow-sm flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold transition group-hover:scale-105">
            TF
          </div>
          <div>
            <span className="font-display text-ink text-lg font-bold tracking-tight">
              TaskFlow
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="#features" className="text-ink-muted hover:text-ink transition">
            Features
          </Link>
          <Link href="#preview" className="text-ink-muted hover:text-ink transition">
            Live Views
          </Link>
          <Link href="#philosophy" className="text-ink-muted hover:text-ink transition">
            Design Philosophy
          </Link>
        </nav>

        {/* Mobile navigation toggle */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center p-2"
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile menu – hidden by default, shown when state true */}
        {mobileMenuOpen && (
          <nav className="absolute left-0 top-full w-full bg-surface/90 backdrop-blur-md border-b border-border md:hidden">
            <div className="flex flex-col gap-4 px-4 py-4">
              <Link href="#features" className="text-ink-muted hover:text-ink transition" onClick={() => setMobileMenuOpen(false)}>
                Features
              </Link>
              <Link href="#preview" className="text-ink-muted hover:text-ink transition" onClick={() => setMobileMenuOpen(false)}>
                Live Views
              </Link>
              <Link href="#philosophy" className="text-ink-muted hover:text-ink transition" onClick={() => setMobileMenuOpen(false)}>
                Design Philosophy
              </Link>
            </div>
          </nav>
        )}

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-ink-muted hidden text-xs font-medium lg:inline">
                Signed in as <strong className="text-ink">{user.name ?? user.email}</strong>
              </span>
              <Link
                href="/deadlines"
                className="bg-accent text-accent-ink hover:opacity-90 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition"
              >
                <span>Open Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-ink hover:bg-surface-sunken rounded-lg px-3 py-1.5 text-xs font-medium transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-ink text-canvas hover:opacity-90 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
