import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Kanban,
  Layers,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import Link from "next/link";

import Header from "@/components/Header";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "TaskFlow · Projects, tickets & deadlines that refuse to be forgotten",
  description:
    "A self-hosted work tracker built around one idea: a single screen that tells you what is already late and what is about to be.",
};

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="bg-canvas text-ink flex min-h-screen flex-col selection:bg-accent-soft selection:text-accent">

      {/* Main Navigation */}
      <Header user={user} />

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-10 pb-6 md:pt-16 md:pb-12">
        {/* Decorative gradient — clipped separately so it never hides content */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-accent/5 absolute -top-24 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="border-border bg-surface text-ink-muted shadow-sm mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
            <Sparkles className="text-accent h-3.5 w-3.5 shrink-0" />
            <span className="leading-snug">Warm paper aesthetic · Focused on shipping on time</span>
          </div>

          <h1 className="font-display text-ink text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-[1.12]">
            Projects, tickets &amp; deadlines that{" "}
            <span className="text-accent italic">refuse</span> to be forgotten.
          </h1>

          <p className="text-ink-muted mx-auto mt-5 max-w-2xl text-sm leading-relaxed sm:text-base sm:mt-6">
            The thing that stops you missing a deadline is not another cluttered board.
            It is a <strong>single screen</strong> that tells you what is already
            late and what is about to be. The Kanban, Gantt, and Calendar views
            are all synchronized renderings of the same data.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            {user ? (
              <Link
                href="/deadlines"
                className="bg-accent text-accent-ink hover:opacity-90 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold shadow-md transition sm:w-auto"
              >
                <span>Go to Your Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="bg-accent text-accent-ink hover:opacity-90 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold shadow-md transition sm:w-auto"
                >
                  <span>Start Tracking Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="bg-surface border-border text-ink hover:bg-surface-sunken flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-medium shadow-sm transition sm:w-auto"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          <div className="text-ink-subtle mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="text-success h-4 w-4" /> Free forever for personal projects
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="text-success h-4 w-4" /> Zero cookie trackers or ads
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="text-success h-4 w-4" /> Native PostgreSQL &amp; Prisma 7
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Board / Workspace Preview */}
      <section id="preview" className="px-4 sm:px-6 py-8 md:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-accent text-xs font-semibold tracking-wider uppercase">
                Interactive Preview
              </span>
              <h2 className="font-display text-ink text-2xl font-semibold">
                Designed for clarity under pressure
              </h2>
            </div>
            <Link
              href={user ? "/deadlines" : "/login"}
              className="text-accent hover:underline hidden items-center gap-1 text-xs font-medium sm:flex"
            >
              <span>Explore live app</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Realistic Mockup Window */}
          <div className="border-border bg-surface shadow-[var(--shadow-pop)] overflow-hidden rounded-2xl border">
            {/* Window Top Bar */}
            <div className="border-border bg-surface-sunken flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#f26f63]" />
                <span className="h-3 w-3 rounded-full bg-[#f4be4f]" />
                <span className="h-3 w-3 rounded-full bg-[#62c554]" />
                <span className="text-ink-subtle ml-2 font-mono text-xs">
                  taskflow.app · Visual Whiteboard Pro
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-success-soft text-success rounded px-2 py-0.5 text-[11px] font-medium">
                  Live &amp; Synced
                </span>
              </div>
            </div>

            {/* Mockup Deadlines Header Digest Bar */}
            <div className="border-border/80 bg-surface-raised border-b p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-accent text-accent-ink flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold">
                    VW
                  </span>
                  <span className="text-ink text-sm font-semibold">
                    Deadlines Digest
                  </span>
                </div>
                <span className="text-ink-muted text-xs">
                  3 tickets due soon
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Overdue Card */}
                <div className="border-danger/30 bg-danger-soft/40 rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-danger flex items-center gap-1.5 text-xs font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" /> 1d Overdue
                    </span>
                    <span className="text-danger text-[11px] font-bold">URGENT</span>
                  </div>
                  <p className="text-ink mt-1.5 truncate text-xs font-medium">
                    Sticky notes rich text editing &amp; markdown
                  </p>
                  <p className="text-ink-muted mt-0.5 text-[11px]">VWBP-5 · In Review</p>
                </div>

                {/* Due Today Card */}
                <div className="border-warning/30 bg-warning-soft/40 rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-warning flex items-center gap-1.5 text-xs font-semibold">
                      <Clock className="h-3.5 w-3.5" /> Due Today
                    </span>
                    <span className="text-warning text-[11px] font-bold">HIGH</span>
                  </div>
                  <p className="text-ink mt-1.5 truncate text-xs font-medium">
                    Infinite zoom and pan canvas rendering
                  </p>
                  <p className="text-ink-muted mt-0.5 text-[11px]">VWBP-3 · 320m logged</p>
                </div>

                {/* Due Tomorrow Card */}
                <div className="border-border bg-surface rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted flex items-center gap-1.5 text-xs font-semibold">
                      <CalendarDays className="h-3.5 w-3.5" /> Due Tomorrow
                    </span>
                    <span className="text-accent text-[11px] font-medium">HIGH</span>
                  </div>
                  <p className="text-ink mt-1.5 truncate text-xs font-medium">
                    Real-time multiplayer cursor synchronization
                  </p>
                  <p className="text-ink-muted mt-0.5 text-[11px]">VWBP-4 · In Progress</p>
                </div>
              </div>
            </div>

            {/* Mockup Kanban Board Columns */}
            <div className="bg-canvas/50 grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
              {/* Column 1: To Do */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-ink text-xs font-semibold uppercase tracking-wider">
                    To Do
                  </span>
                  <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-[11px] font-medium">
                    2
                  </span>
                </div>
                <div className="border-border bg-surface space-y-2 rounded-xl border p-3 shadow-sm">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-subtle font-mono">VWBP-6</span>
                    <span className="bg-accent-soft text-accent rounded px-1.5 py-0.5 font-medium">
                      Medium
                    </span>
                  </div>
                  <p className="text-ink text-xs font-medium">
                    Vector shape tools (Rectangle, Ellipse, Freehand)
                  </p>
                  <div className="text-ink-subtle flex items-center justify-between pt-1 text-[11px]">
                    <span>Est. 420m</span>
                    <span className="text-ink-muted">Due in 4d</span>
                  </div>
                </div>

                <div className="border-border bg-surface space-y-2 rounded-xl border p-3 shadow-sm">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-subtle font-mono">VWBP-7</span>
                    <span className="bg-accent-soft text-accent rounded px-1.5 py-0.5 font-medium">
                      Medium
                    </span>
                  </div>
                  <p className="text-ink text-xs font-medium">
                    Export whiteboard to high-resolution PNG &amp; PDF
                  </p>
                  <div className="text-ink-subtle flex items-center justify-between pt-1 text-[11px]">
                    <span>Est. 240m</span>
                    <span className="text-ink-muted">Due in 6d</span>
                  </div>
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-ink text-xs font-semibold uppercase tracking-wider">
                    In Progress
                  </span>
                  <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-[11px] font-medium">
                    2
                  </span>
                </div>
                <div className="border-border bg-surface space-y-2 rounded-xl border p-3 shadow-sm">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-subtle font-mono">VWBP-3</span>
                    <span className="bg-danger-soft text-danger rounded px-1.5 py-0.5 font-semibold">
                      Urgent
                    </span>
                  </div>
                  <p className="text-ink text-xs font-medium">
                    Infinite zoom and pan canvas rendering
                  </p>
                  <div className="text-ink-subtle flex items-center justify-between pt-1 text-[11px]">
                    <span>320m / 480m</span>
                    <span className="bg-warning-soft text-warning rounded px-1.5 py-0.5 font-semibold">
                      Today
                    </span>
                  </div>
                </div>

                <div className="border-border bg-surface space-y-2 rounded-xl border p-3 shadow-sm">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-subtle font-mono">VWBP-8</span>
                    <span className="bg-warning-soft text-warning rounded px-1.5 py-0.5 font-semibold">
                      High
                    </span>
                  </div>
                  <p className="text-ink text-xs font-medium">
                    WebRTC peer-to-peer audio/video calling overlay
                  </p>
                  <div className="text-ink-subtle flex items-center justify-between pt-1 text-[11px]">
                    <span>210m / 600m</span>
                    <span className="text-ink-muted">Due in 3d</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Done */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-ink text-xs font-semibold uppercase tracking-wider">
                    Done
                  </span>
                  <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-[11px] font-medium">
                    3
                  </span>
                </div>
                <div className="border-border bg-surface/80 space-y-2 rounded-xl border p-3 opacity-80 shadow-sm">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-subtle font-mono">VWBP-10</span>
                    <span className="bg-success-soft text-success rounded px-1.5 py-0.5 font-medium">
                      Completed
                    </span>
                  </div>
                  <p className="text-ink text-xs line-through">
                    Undo/Redo history stack with state diffing
                  </p>
                  <div className="text-ink-subtle flex items-center justify-between pt-1 text-[11px]">
                    <span>360m logged</span>
                    <span>Sep 10</span>
                  </div>
                </div>

                <div className="border-border bg-surface/80 space-y-2 rounded-xl border p-3 opacity-80 shadow-sm">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-subtle font-mono">VWBP-14</span>
                    <span className="bg-success-soft text-success rounded px-1.5 py-0.5 font-medium">
                      Completed
                    </span>
                  </div>
                  <p className="text-ink text-xs line-through">
                    Dark mode theme toggle for whiteboard canvas
                  </p>
                  <div className="text-ink-subtle flex items-center justify-between pt-1 text-[11px]">
                    <span>150m logged</span>
                    <span>Sep 11</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="border-border bg-surface/50 border-y px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <span className="text-accent text-xs font-semibold tracking-wider uppercase">
              Core Capabilities
            </span>
            <h2 className="font-display text-ink mt-1.5 text-3xl font-bold tracking-tight">
              One dataset. Every lens you need.
            </h2>
            <p className="text-ink-muted mx-auto mt-3 max-w-xl text-sm">
              The board, timeline, and deadline digest are not disjointed views.
              They read the exact same underlying PostgreSQL records.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="border-border bg-surface hover:border-accent/40 rounded-2xl border p-6 transition">
              <div className="bg-accent-soft text-accent mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-ink font-semibold">Deadlines Digest</h3>
              <p className="text-ink-muted mt-2 text-xs leading-relaxed">
                A single screen sorting work by urgency temperature: overdue (deep red), today (amber), this week, and later.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border-border bg-surface hover:border-accent/40 rounded-2xl border p-6 transition">
              <div className="bg-accent-soft text-accent mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
                <Kanban className="h-5 w-5" />
              </div>
              <h3 className="text-ink font-semibold">Fluid Kanban</h3>
              <p className="text-ink-muted mt-2 text-xs leading-relaxed">
                Smooth drag-and-drop powered by dnd-kit. Float positions calculate the midpoint between neighbours, eliminating renumbering locks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border-border bg-surface hover:border-accent/40 rounded-2xl border p-6 transition">
              <div className="bg-accent-soft text-accent mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-ink font-semibold">Gantt &amp; Calendar</h3>
              <p className="text-ink-muted mt-2 text-xs leading-relaxed">
                Visual dependency edges and timeline duration spans let you balance workload and anticipate bottlenecks before they happen.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border-border bg-surface hover:border-accent/40 rounded-2xl border p-6 transition">
              <div className="bg-accent-soft text-accent mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
                <Timer className="h-5 w-5" />
              </div>
              <h3 className="text-ink font-semibold">Micro Time Tracking</h3>
              <p className="text-ink-muted mt-2 text-xs leading-relaxed">
                Log work in whole minutes with date precision. Denormalized aggregates prevent N+1 queries when viewing large boards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Design Philosophy Section */}
      <section id="philosophy" className="px-6 py-16 md:py-24">
        <div className="border-border bg-surface mx-auto max-w-4xl rounded-2xl border p-8 md:p-12 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <span className="text-accent text-xs font-semibold tracking-wider uppercase">
                Design Philosophy
              </span>
              <h2 className="font-display text-ink mt-2 text-2xl font-bold sm:text-3xl">
                Warm Paper. Not Sterile Grey.
              </h2>
              <p className="text-ink-muted mt-4 text-sm leading-relaxed">
                An app meant to tell you what you are late on should read like a
                personal notebook you want to open, not a clinical audit filed
                against you.
              </p>
              <p className="text-ink-muted mt-3 text-sm leading-relaxed">
                By grounding the design in cream canvas and earthy terracotta
                accents, deadlines gain a natural, intuitive temperature scale —
                calm cream, warm amber, terracotta, then deep warning red.
              </p>
            </div>
            <div className="border-border bg-surface-sunken/70 flex shrink-0 flex-col gap-2.5 rounded-xl border p-5 sm:w-64">
              <span className="text-ink text-xs font-semibold">Palette Tokens</span>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-[#f5f1e8] border border-border" />
                <span className="text-ink-muted text-xs font-mono">--canvas (#f5f1e8)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-[#b4471f]" />
                <span className="text-ink-muted text-xs font-mono">--accent (#b4471f)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-[#a32b2b]" />
                <span className="text-ink-muted text-xs font-mono">--danger (#a32b2b)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-[#201a15]" />
                <span className="text-ink-muted text-xs font-mono">Warm Dark Mode</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-accent text-accent-ink px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Never let another deadline slip by.
          </h2>
          <p className="text-accent-ink/80 mt-4 text-sm sm:text-base">
            Create your workspace in seconds. Add your projects, schedule your
            deliverables, and stay ahead of every due date.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={user ? "/deadlines" : "/signup"}
              className="bg-accent-ink text-ink hover:opacity-90 rounded-xl px-7 py-3.5 text-sm font-semibold shadow-lg transition"
            >
              {user ? "Open Your Workspace →" : "Get Started for Free →"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border bg-surface border-t px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="bg-accent text-accent-ink flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold">
              TF
            </div>
            <span className="text-ink font-semibold">TaskFlow</span>
            <span className="text-ink-subtle">· Built for punctual teams.</span>
          </div>

          <div className="text-ink-muted flex items-center gap-6">
            <Link href="/login" className="hover:text-ink transition">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-ink transition">
              Sign Up
            </Link>
            <a
              href="https://github.com/UtsavDungrani/Taskflow"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink flex items-center gap-1 transition"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
