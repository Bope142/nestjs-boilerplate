---
name: database-test-isolation
description: Use DATABASE_URL_TEST for all NestJS e2e / Jest DB work and keep DEV/PROD clean. Use when running e2e, migrating the test database, cleaning e2e fixture pollution, or configuring Postgres URLs.
---

# Database Test Isolation

## Goal

E2e fixtures never land in the database used by `pnpm run start` / Postman (`DATABASE_URL_DEV`).

## Mapping (source of truth)

[`src/database/database-url.ts`](../../../src/database/database-url.ts):

| `NODE_ENV` | URL env var |
|------------|-------------|
| `test` | `DATABASE_URL_TEST` |
| `production` | `DATABASE_URL_PROD` |
| otherwise | `DATABASE_URL_DEV` |

## Steps — run e2e safely

1. Confirm `.env` has **distinct** DB names, e.g. `wapigo_dev` vs `wapigo_test` (never the same name for DEV and TEST).
2. Ensure test DB exists and is migrated:

```bash
pnpm db:setup:test
```

3. Run e2e only via:

```bash
pnpm test:e2e
# or
pnpm test:e2e -- --testPathPattern=<name> --forceExit
```

Completion criterion: the process runs with `NODE_ENV=test` (see `scripts/run-with-node-env.mjs`) so Drizzle/Nest resolve `DATABASE_URL_TEST`.

4. After schema changes that need a migration on the DB e2e uses:

```bash
pnpm db:migrate:test
```

Do **not** rely on `pnpm db:migrate` alone for e2e readiness (that migrates DEV when `NODE_ENV=development`).

## Steps — clean e2e merchant types leaked into DEV

Symptom: `GET /client/merchant-types/options` lists `e2e-*` / `Catalog E2E` / `Commission E2E` while `pnpm run start` is running.

1. With default `NODE_ENV=development` (so the script hits `DATABASE_URL_DEV`):

```bash
pnpm db:cleanup:e2e-types
```

2. Restart or bump Redis cache for `merchant-types` / `client-merchant-types` if options still look stale.
3. Optionally re-seed real types: `pnpm db:seed:merchant-types`.

Completion criterion: options no longer return rows whose slug/name match e2e fixture patterns; real types (e.g. `restaurant`, `fastfood`) remain.

## Steps — verify isolation before claiming “e2e OK”

1. `pnpm db:migrate:test` if schema changed.
2. `pnpm test:e2e -- --testPathPattern=<relevant> --forceExit`.
3. Spot-check that `DATABASE_URL_DEV` was not required for the run (no manual override of `DATABASE_URL_*` in the command).

## Anti-patterns

- Invoking Jest e2e without `run-with-node-env.mjs test` / `pnpm test:e2e`
- Truncating or deleting from DEV “to fix tests”
- Setting `DATABASE_URL_TEST` equal to `DATABASE_URL_DEV`
- Documenting Postman flows against TEST DB
