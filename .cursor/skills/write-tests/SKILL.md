---
name: write-tests
description: Write meaningful unit, PostgreSQL integration, and NestJS e2e tests for this boilerplate (auth, RBAC, data integrity, domain workflows).
---

# Write Tests

Use this skill when adding tests, fixing a regression, or reviewing insufficient test coverage.

## Procedure

1. Identify observable behavior and business invariants.
2. Select the lowest useful test level.
3. Reuse existing factories and test infrastructure.
4. Make actor roles/permissions explicit in setup.
5. Freeze time when behavior is time-dependent.
6. Cover success, failure, authorization, and conflict / retry paths.
7. Use a real PostgreSQL database for persistence behavior — for e2e that means **`DATABASE_URL_TEST` only** (`pnpm test:e2e` / `pnpm db:migrate:test`). Never invent fixtures on `DATABASE_URL_DEV`. Follow skill `database-test-isolation`.
8. Avoid real external network calls (mail, SMS, payment providers, storage).
9. Run the narrow test first, then the wider relevant suite.
10. Report exactly what ran.

## Test selection

Use unit tests for pure logic.

Use PostgreSQL integration tests for:

- Drizzle queries.
- Constraints.
- Transactions.
- Index-sensitive query design.
- Uniqueness (receipts, provider references, idempotency keys).
- Date / timezone behavior.
- Concurrency on financial state transitions.

Use e2e tests for:

- HTTP contract.
- Validation.
- Guards.
- Authentication.
- Serialization.
- Error mapping.

## Required authorization tests

For protected resources:

- Authenticated user with permission can access.
- Missing permission is rejected (`403`).
- Missing/invalid auth is rejected (`401`).
- Inactive account is rejected when that policy exists.
- IDOR: another user cannot read/mutate a private resource when ownership rules apply.

Add tenant isolation tests only when the product implements multi-tenancy.

## Required finance tests (when applicable)

- Duplicate payment / webhook does not double-post.
- Invalid status transitions are rejected.
- Receipt uniqueness holds.
- Confirmed records are not hard-deleted.
- Currency is required and not mixed silently.
- Concurrent confirm / close races are safe.

## Quality rules

- Test behavior, not private methods.
- Use descriptive names.
- Avoid snapshots for complex business responses unless stable and valuable.
- Avoid arbitrary sleeps.
- Avoid order dependence.
- Keep fixtures minimal.
- Full row fixtures typed as `$inferSelect` / mapper rows must list **every** column. After a schema change, follow `sync-schema-typed-fixtures` — do not cast with `as RowType`.
- Do not mock the database in repository integration tests.
- Do not claim a command passed unless it was executed.
- Always run `pnpm run lint` after related implementation changes.
- ExcelJS / real `.xlsx` unit specs: follow skill `excel-heavy-unit-tests` (`jest.setTimeout(30_000)`, buffer writes, `try/finally` cleanup). Default 5s timeouts flake under full `pnpm test` / OneDrive and block push.
- Open handles / fake timers / worker SIGTERM / flaky `libphonenumber-js` under full `pnpm test`: follow skill `jest-teardown-open-handles` (`afterEach` real timers, `pnpm test:detect-handles`, no `--forceExit` on default test).

## Output summary

Provide:

- Tests added.
- Behaviors covered.
- Commands executed.
- Results.
- Remaining untested risks.
