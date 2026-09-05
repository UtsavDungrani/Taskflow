# TaskFlow

Projects, tickets and deadlines that refuse to be forgotten.

A self-hosted work tracker built around one idea: the thing that stops you
missing a deadline is not another board, it is a single screen that tells you
what is already late and what is about to be. The kanban board, and the Gantt
and timeline views that follow, are all different renderings of the same rows.

## Status

Phase 1 is built: auth, projects, tickets with due dates, a drag-and-drop
kanban board, and the Deadlines digest. See [ROADMAP.md](./ROADMAP.md) for what
comes next and why the schema is already shaped for it.

## Stack

| Concern  | Choice                                        |
| -------- | --------------------------------------------- |
| Framework| Next.js 16 (App Router, Server Actions)        |
| Language | TypeScript                                     |
| Database | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Auth     | Auth.js v5 — GitHub OAuth + a dev-only login   |
| Styling  | Tailwind CSS v4, semantic tokens in `globals.css` |
| Drag/drop| dnd-kit                                        |

## Getting started

### 1. Create a database

Any Postgres works. [Neon](https://neon.tech) has a free tier and needs no
local install — create a project and copy the **pooled** connection string.

### 2. Configure the environment

```bash
cp .env.example .env
```

Fill in `DATABASE_URL`. `AUTH_SECRET` is already generated. Leave
`ALLOW_DEV_LOGIN="true"` for now so you can sign in without registering a
GitHub OAuth app.

### 3. Create the tables and seed

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

The seed creates a demo project whose due dates straddle today, so the
Deadlines page has something to show immediately.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000 and choose **Continue as local developer**.

## Adding GitHub sign-in

Create an OAuth app at <https://github.com/settings/developers>:

- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback/github`

Put the client ID and secret in `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`. The
button appears on the login page on its own. Set `ALLOW_DEV_LOGIN="false"`
once you have it working.

## Scripts

| Script               | Does                                        |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Dev server                                  |
| `npm run build`      | Production build (also typechecks)          |
| `npm run lint`       | ESLint                                      |
| `npm run db:migrate` | Create/apply a migration                    |
| `npm run db:push`    | Push schema without a migration (prototyping)|
| `npm run db:studio`  | Prisma Studio, a GUI over the data          |
| `npm run db:seed`    | Insert the demo project                     |

## Architecture notes

**Everything hangs off a `Workspace`, even with one user.** That is the tenancy
seam. Adding teammates later is an insert into `WorkspaceMember`, not a
migration of every table.

**Board columns are data, not an enum.** Each `TaskStatus` carries a
`category` (`TODO` / `IN_PROGRESS` / `DONE`), so "is this done?" stays
queryable no matter what you rename your columns to.

**Card order is a float.** Dropping a card between two neighbours writes the
midpoint of their positions, so a reorder updates one row instead of
renumbering the column.

**Access control lives in `src/server/`, not in the actions.** Every read and
write goes through a helper that scopes the query to workspaces the caller is
a member of, so a forged id returns `NOT_FOUND` rather than someone else's data.

### Layout

```
src/
  app/
    (app)/          authenticated pages — shell, deadlines, boards
    login/          sign-in
    api/auth/       Auth.js route handler
    actions.ts      server actions (validation boundary; zod-parsed)
  components/       client components and UI primitives
  lib/              prisma client, auth config, helpers
  server/           data access — every query is access-checked here
prisma/
  schema.prisma     the data model, commented
  seed.ts           demo data
```

## Known issues

`npm audit` reports vulnerabilities in `mysql2`, pulled in transitively by the
Prisma **CLI**. It is a build-time dependency, this project uses Postgres, and
that code never executes at runtime. Downgrading Prisma to clear it would cost
more than it buys.
