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
| Theme    | Warm paper, light-first, with a warm-dark counterpart |
| Drag/drop| dnd-kit                                        |

## Getting started

### 1. Create a database

Any Postgres works. Both [Supabase](https://supabase.com) and
[Neon](https://neon.tech) have free tiers needing no local install.

**Choose the region nearest you — it cannot be changed later, and it matters
more than anything else for how the app feels.** See
[Performance](#performance-put-the-database-near-you) for measurements. From
India, Supabase's `ap-south-1` (Mumbai) is the closest option; Neon has no
Indian region.

On Supabase, copy the **Session pooler** connection string (port `5432`).

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
| `npm run db:export`  | Dump every table to JSON                    |
| `npm run db:restore` | Replay a dump into the current database     |

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

## Performance: put the database near you

The single biggest factor in how this app feels is the physical distance to
your Postgres — not the choice of database engine, and not the ORM.

Measured from India, first against Neon in `us-east-2` (Ohio), then against
Supabase in `ap-south-1` (Mumbai):

| | Ohio | Mumbai |
| --- | --- | --- |
| One round trip (`SELECT 1`, warm) | 265 ms | **20 ms** |
| Connection setup (TCP + TLS) | ~4 s | **165 ms** |
| Board load | ~1300 ms | **~376 ms** |
| Board + open a ticket | ~3800 ms | **~360 ms** |

Server-side execution was close to zero in both cases — essentially all of
that time was network. Prisma splits each nested `include` into its own
query and runs them in sequence, so latency multiplies by the number of
relations you load.

Two conclusions worth keeping:

**Swapping Postgres for another engine would have changed nothing.** The
database was never the bottleneck; the packet's flight time was. MySQL or
MongoDB in Ohio would have measured the same.

**Region is chosen at creation and cannot be changed.** Neon has no Indian
region (closest is Singapore); Supabase has Mumbai. Whichever host you use,
pick the region nearest your users before anything else.

If you need to move providers, `npm run db:export` dumps every table to JSON
and `npm run db:restore <file>` replays it in foreign-key-safe order.

The code side is already tightened: access checks ride in the `where` clause
instead of a preceding query, the board and the open ticket are fetched with
`Promise.all`, and the app shell gets its workspace and project list in one
query. If you ever need more, collapsing the board read into a single SQL
statement with JSON aggregation measured 5x faster than Prisma's five
queries — at the cost of hand-written mapping and no type safety.

### Connecting Prisma to Supabase

Use the **Session pooler** string (port `5432`), not "Direct connection" —
direct is IPv6-only on the free plan and will not connect from most home
ISPs. Avoid the *transaction* pooler on `6543`; it does not support the
prepared statements Prisma uses.

If your database password contains `@`, `%`, `#` or `/`, percent-encode it
(`@` becomes `%40`), or the URL parser will split the string in the wrong
place. And delete the square brackets around `[YOUR-PASSWORD]` — they are a
placeholder, not part of the format.

## About the theme

The palette is deliberately warm and light-first, and it is worth saying why,
because the default for an app like this is charcoal with an indigo accent.

This app's job is to show you what you are late on. A paper surface makes
that read like a notebook you keep; charcoal and indigo makes it read like a
report filed against you. Keeping the accent in the orange family and danger
in the red family also gives the deadline views a genuine temperature scale
— cream, then amber, then terracotta, then deep red — rather than one lonely
red among blues.

Dark mode is a warm dark: espresso browns, not grey. Desaturating the
neutrals would throw away the point of the palette.

Everything is driven by semantic tokens (`--accent`, `--surface`, `--ink`) in
`globals.css`. Components never reference a raw colour, so the whole app
re-themes from that one file. The `<html data-theme>` attribute overrides the
system preference and is set before first paint by a small inline script in
the root layout, so there is no flash.

## Known issues

`npm audit` reports vulnerabilities in `mysql2`, pulled in transitively by the
Prisma **CLI**. It is a build-time dependency, this project uses Postgres, and
that code never executes at runtime. Downgrading Prisma to clear it would cost
more than it buys.
