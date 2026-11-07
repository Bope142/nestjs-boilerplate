---
name: create-migration
description: Generate and review a safe Drizzle Kit PostgreSQL migration for this NestJS boilerplate using pnpm. Use when creating, renaming, reviewing, or applying database migrations, or when the user mentions drizzle-kit generate/migrate.
---

# Create Migration

Use this skill whenever Drizzle schema changes require a database migration.

## Naming (mandatory)

Never ship Drizzle’s random Marvel-style names (`0000_lively_mephistopheles`).

Always pass an explicit `--name` when generating:

```bash
pnpm db:generate -- --name <snake_case_slug>
```

### Name rules

- Use **snake_case**, English, descriptive of the change.
- Prefer **what** changed, not “update” or “fix”.
- Keep it short (2–5 words after the numeric prefix Drizzle adds).
- Do **not** include dates or ticket IDs unless the team already does.

### Good examples

| Change | `--name` value | Resulting file |
|--------|----------------|----------------|
| Initial users / roles / sessions | `identity_users_roles` | `0000_identity_users_roles.sql` |
| Notifications and delivery | `communication_notifications` | `0001_communication_notifications.sql` |
| Payments and receipts | `payments_receipts` | `0002_payments_receipts.sql` |
| Unique provider payment reference | `payments_provider_reference_unique` | `0003_payments_provider_reference_unique.sql` |
| Soft-delete users | `users_soft_delete` | `0004_users_soft_delete.sql` |

### Bad examples

- `0000_lively_mephistopheles` (random)
- `migration` / `update` / `changes` (vague)
- `fix_stuff` (unclear)
- Vague names that do not describe the schema change

### If a bad name was already generated (not applied)

1. Rename the `.sql` file to match the intended tag (`NNNN_<slug>.sql`).
2. Update `tag` in `drizzle/meta/_journal.json` to the same `NNNN_<slug>` string.
3. Do **not** rename or edit a migration already applied to a shared environment — create a new named migration instead.

## Procedure

1. Inspect the current Drizzle schema and migration history under `drizzle/`.
2. Confirm the intended business change.
3. Identify existing data and deployment compatibility risks (extra care for money or audit tables).
4. Modify schema definitions.
5. Generate migration with a **good name**:

```bash
pnpm db:generate -- --name <snake_case_slug>
```

or:

```bash
pnpm exec drizzle-kit generate --name <snake_case_slug>
```

6. Confirm the file under `drizzle/` uses that slug (not a random name).
7. Inspect every SQL statement.
8. Check forward compatibility with the currently deployed application.
9. Add a custom migration or staged backfill when generation is insufficient (`pnpm exec drizzle-kit generate --custom --name <slug>`).
10. Sync Draw.io documentation (mandatory):

```bash
pnpm db:diagram:generate
pnpm db:diagram:check
```

Activate skill `database-diagram-generator`. A migration is **not complete** without diagram sync.
11. Run migration against an isolated PostgreSQL **TEST** database (`pnpm db:migrate:test`).
12. Run `pnpm run lint`.
13. Run repository and e2e tests.
14. Document deployment order and rollback or forward-fix plan.
15. Commit SQL + `drizzle/meta/*` + `docs/database/database-architecture.drawio` together.

## Review checklist

- [ ] Migration file name is descriptive (`NNNN_<snake_case_slug>.sql`).
- [ ] Journal `tag` matches the SQL filename stem.
- [ ] No accidental table or column drops.
- [ ] No accidental data truncation.
- [ ] No hard-delete path introduced for confirmed audit or financial history.
- [ ] New required columns are safe for existing rows.
- [ ] Defaults are correct and not misleading.
- [ ] Foreign keys use intentional delete behavior.
- [ ] Unique constraints match business invariants.
- [ ] Indexes support expected queries.
- [ ] Large-table locks are considered.
- [ ] Enum modifications are safe.
- [ ] Backfill is deterministic and restartable.
- [ ] Application compatibility is preserved.
- [ ] Migration ran on PostgreSQL TEST (`pnpm db:migrate:test`).
- [ ] Draw.io page `00` updated and new history page present (`pnpm db:diagram:check`).
- [ ] `pnpm run lint` passed.
- [ ] Tests pass.
- [ ] Typed spec fixtures updated for new/renamed columns (`sync-schema-typed-fixtures`); `pnpm test` compiles specs (`typecheck` does not).

## Prohibited behavior

- Do not leave random Drizzle default migration names.
- Do not edit a migration already applied to staging or production.
- Do not use `drizzle-kit push` for shared environments.
- Do not invent that a migration was executed.
- Do not delete data without explicit approval.
- Do not place secrets or environment-specific identifiers in migrations.
- Do not add tenant isolation columns unless an ADR or product requirement explicitly calls for them.

## Deployment strategies

For breaking changes use expand-and-contract.

For data backfills:

- Prefer a separate resumable script or custom migration.
- Batch large updates.
- Record progress.
- Make reruns safe.
- Avoid long transactions when possible.
