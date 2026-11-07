---
name: verify-changes
description: Run mandatory post-change verification for this NestJS boilerplate (always pnpm run lint, then typecheck/tests when relevant). Use after implementing features, fixes, refactors, schema changes, or before claiming work is done.
---

# Verify Changes

Use this skill after every code change before telling the user the work is complete.

## Mandatory

Always run:

```bash
pnpm run lint
```

- Fix errors caused by the change.
- Re-run until clean, or report remaining failures with real command output.
- Never claim lint passed without running it in the current session.

## When also required

| Change type | Also run |
|-------------|----------|
| TypeScript / Nest modules / schema | `pnpm typecheck` if the script exists |
| Behavior / API / DB | relevant `pnpm test` / `pnpm test:e2e` |
| Drizzle schema | `pnpm db:generate -- --name <slug>` + review SQL when scripts exist; `pnpm db:check` when available; **sync typed spec fixtures** (skill `sync-schema-typed-fixtures`) then `pnpm test` — `typecheck` excludes `**/*spec.ts` |
| Money or audit workflows | include conflict, idempotency, and authorization tests |
| ExcelJS / `.xlsx` unit specs | follow `excel-heavy-unit-tests`; ensure `jest.setTimeout(30_000)` — default 5s flakes under full `pnpm test` and blocks push |
| Jest hang / SIGTERM / detectOpenHandles / libphonenumber `isValid.js` flake | follow `jest-teardown-open-handles`; run `pnpm test:detect-handles` then full `pnpm test` |

Check `package.json` for available scripts; do not invent scripts.

## Dev server (port 8020)

Before telling the user the work is complete:

- If a process is listening on **8020**, kill it.
- Do **not** start or leave `pnpm run dev` running — the user starts the server themselves.
- See rule `stop-dev-server-8020`.

## Completion report

Include in the summary:

- Commands executed
- Pass / fail for each
- Lint failures fixed or still open
- Confirmation that port **8020** is free (or was already free)