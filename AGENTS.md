<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TaskFlow

A work tracker built around not missing deadlines. See README.md for setup and
ROADMAP.md for what is built vs planned.

## Ground rules

- **Access control lives in `src/server/`.** Every query is scoped through a
  workspace-membership check. Never query `prisma.task` directly from a page
  or action — go through the helpers, or add one.
- **`src/app/actions.ts` is the validation boundary.** Input is parsed with
  zod there; `src/server/` may assume its arguments are already valid.
- **Board columns are data.** Branch on `TaskStatus.category`
  (`TODO`/`IN_PROGRESS`/`DONE`), never on the column's name.
- **Positions are floats.** Reordering writes the midpoint of the two
  neighbours; do not renumber a column.
- **Styling uses semantic tokens** from `globals.css` (`bg-surface`,
  `text-ink-muted`, `text-danger`). No raw Tailwind colours — they break dark
  mode.

## Checks

`npm run build` typechecks as well as builds. `npm run lint` must pass with
zero warnings.

## Database

Prisma 7 connects through a driver adapter (`@prisma/adapter-pg`), not a
connection URL in the schema. After editing `prisma/schema.prisma`, run
`npm run db:migrate`.
