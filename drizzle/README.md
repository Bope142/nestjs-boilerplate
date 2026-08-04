# Drizzle migrations

SQL migrations and Drizzle Kit metadata live here.

## Baseline

- `0000_core_baseline.sql` — full schema for identity, audit, and communication modules.
- `meta/_journal.json` — migration journal (do not hand-edit unless resetting baseline).

## Commands

```bash
pnpm db:generate --name your_change
pnpm db:migrate
```

See [docs/database.md](../docs/database.md).
