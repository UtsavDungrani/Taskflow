# Roadmap

The ordering principle: build the thing that stops deadlines slipping first,
then the views that make it pleasant, then the integrations that make it a
portfolio piece. Every phase reads and writes the same tables — no phase
requires rewriting an earlier one.

## Phase 1 — Deadlines you cannot miss ✅

Built.

- [x] Auth (GitHub OAuth + dev login), workspaces created on first sign-in
- [x] Projects with ticket prefixes (`DEMO-14`) and per-project columns
- [x] Tasks: title, description, priority, due date, start date, assignee
- [x] Kanban board with drag-and-drop across and within columns
- [x] Deadlines digest: overdue / today / next 7 days / later
- [x] Activity log written on create, status change, and due-date change

## Phase 2 — Seeing time

The schema already carries `startDate`, `dueDate`, `estimateHours` and a
`TaskDependency` edge table, so none of this needs a migration.

- [x] **Task detail panel** — click a card to open a slide-over: edit title,
      status, priority, start and due dates, description; leave comments; read
      the history. The open ticket lives in the URL (`?task=<id>`) rather than
      component state, so it is linkable and the back button closes it.
- [ ] **Assignee picker** — the field exists on `Task` and the avatar already
      renders on cards, but nothing sets it while the app is single-user.
- [x] **Gantt chart** — bars from `startDate` to `dueDate`, day/week/month
      zoom, a today marker, weekend shading, and dependency arrows drawn from
      `TaskDependency`. Built by hand rather than with a library: the good
      React Gantt packages are paid and the free ones look it.

      A task with only a due date renders as a **milestone diamond**, not a
      zero-width bar — which matters, because in practice almost every task
      starts life with a due date and no start date. Dragging a milestone's
      left handle sets a start date and turns it into a bar, which is the
      fastest way to actually schedule work.

      Tasks with no dates at all are listed in a tray beneath the chart
      rather than silently hidden.
- [x] **Calendar view** — a month grid; tasks with a start and due date span
      every day they cover, so "how busy is next week" is legible at a glance.
- [x] **Drag to reschedule** — dragging a bar moves both dates, dragging an
      edge moves one. Optimistic, with rollback if the write fails.
- [ ] **List view** with sorting and filtering by assignee, label, priority.

## Phase 3 — Making it hard to forget

This is the part that actually addresses the original problem. A board you
have to remember to open is still a board you can forget.

- [ ] **Email digest** — a morning summary of what is due, via Resend.
- [ ] **Browser notifications** for same-day deadlines.
- [ ] **Recurring tasks** — needs a `recurrenceRule` on `Task`.
- [ ] **Snooze / reschedule from the digest**, one click.

## Phase 4 — GitHub

`Project.gitHubRepoOwner` / `gitHubRepoName` and `Task.gitHubIssueNumber` are
already in the schema, and the OAuth token is already on the `Account` row.
Requesting the `repo` scope will trigger a re-consent.

- [ ] Link a project to a repo
- [ ] Import issues as tasks, two-way status sync
- [ ] Move a task to Done when its PR merges (webhook)
- [ ] Show PR/CI state on the card

## Phase 5 — Other people

The tenancy seam is in place: `WorkspaceMember` exists and every query is
already scoped through it.

- [ ] Invite by email, roles (`OWNER` / `ADMIN` / `MEMBER` / `VIEWER`)
- [ ] Enforce roles on writes — currently membership is checked, role is not
- [ ] @mentions in comments, notification feed
- [ ] Per-assignee workload view

## Phase 6 — Portfolio polish

- [ ] Deploy to Vercel against the same Neon database
- [ ] A public read-only demo workspace so recruiters can click around
- [ ] Keyboard shortcuts (`c` to create, `/` to search)
- [ ] Command palette
- [ ] Tests — the position arithmetic in `moveTask` and the digest bucketing
      are the two places where a silent regression would hurt most

## Deliberately not doing

- **Real-time multiplayer cursors.** Impressive, irrelevant to the problem.
- **A custom rich-text editor.** Markdown in a textarea is enough.
- **Time tracking.** Different product.
