---
name: database-diagram-generator
description: Keep docs/database/database-architecture.drawio in sync with Drizzle snapshots and migrations. Use whenever creating or changing migrations, tables, columns, FKs, indexes, or constraints.
---

# Database Diagram Generator

## Purpose

Ensure every database schema change is reflected in the editable Draw.io master file. Migrations are **not complete** until the diagram is generated, validated, and checked.

## When to activate

- Creating a migration (`pnpm db:generate` / drizzle-kit)
- Adding/removing/renaming tables or columns
- Changing FKs, indexes, or unique constraints
- CI fails on `pnpm db:diagram:check`

## Source of truth

1. Drizzle TypeScript schema
2. SQL migrations + `drizzle/meta/*_snapshot.json`
3. Draw.io is **generated documentation only** — never hand-edit as schema source

Do **not** apply migrations to production/DEV just to generate diagrams. The tool reads journal + snapshots.

## Workflow

1. Change schema under `src/database/schema/`.
2. Generate migration with a descriptive name:

```bash
pnpm exec drizzle-kit generate --name <snake_case_slug>
pnpm db:diagram:generate
```

Or use the combined script (generate then diagram):

```bash
pnpm db:generate -- --name <snake_case_slug>
```

3. Validate:

```bash
pnpm db:diagram:validate
pnpm db:diagram:check
```

4. Commit migration SQL + `drizzle/meta/*` + `docs/database/database-architecture.drawio` together.

## Page layout

| Page | Content |
|------|---------|
| `00 — Current Database Schema` | Full current ER (overwritten each generate) |
| `01 — <tag>` … | One page per journal entry (never overwritten) |

Visual convention on history pages: green = added, amber = modified, red = removed.

## Rules

- Never silently delete historical pages
- Never duplicate migration pages
- Never rewrite history if a migration was already documented — report inconsistency
- Tool lives in `tools/database-diagram/`

## Open in diagrams.net

1. Open https://app.diagrams.net/
2. File → Open from Device → select `docs/database/database-architecture.drawio`
3. Use the page tabs at the bottom to switch Current vs migration history

## Checklist

- [ ] Snapshot exists for the new migration tag
- [ ] `pnpm db:diagram:generate` succeeded
- [ ] Page `00` updated
- [ ] New `NN — <tag>` page present
- [ ] `pnpm db:diagram:check` passes
- [ ] Diagram committed with the migration

## Expected output

Updated `docs/database/database-architecture.drawio` with current schema + new history page(s).
