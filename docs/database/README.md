# Database documentation

## Stack

- PostgreSQL 16
- Drizzle ORM + Drizzle Kit SQL migrations
- Three URLs: `DATABASE_URL_DEV` / `DATABASE_URL_TEST` / `DATABASE_URL_PROD`

Resolver: `src/database/database-url.ts` (by `NODE_ENV`).

## Migrations

```bash
pnpm exec drizzle-kit generate --name <snake_case_slug>
pnpm db:diagram:generate
pnpm db:migrate          # DEV
pnpm db:migrate:test     # TEST
```

`pnpm db:generate` runs Drizzle generate then diagram sync.

## Draw.io ER diagrams

Master file: [`database-architecture.drawio`](./database-architecture.drawio)

| Page | Meaning |
|------|---------|
| `00 — Current Database Schema` | Live full schema from latest snapshot |
| `01+ — <migration_tag>` | Immutable history of each migration |

Open with [diagrams.net](https://app.diagrams.net/) → File → Open from Device.

```bash
pnpm db:diagram:generate
pnpm db:diagram:check
pnpm db:diagram:validate
```

**Source of truth:** Drizzle schema + snapshots. Draw.io is generated documentation only. Never apply production migrations solely to refresh diagrams.
