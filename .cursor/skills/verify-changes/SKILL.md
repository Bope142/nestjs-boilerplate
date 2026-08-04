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
| Drizzle schema | `pnpm db:generate -- --name <slug>` + review SQL when scripts exist; `pnpm db:check` when available |
| Money or audit workflows | include conflict, idempotency, and authorization tests |

Check `package.json` for available scripts; do not invent scripts.

## Completion report

Include in the summary:

- Commands executed
- Pass / fail for each
- Lint failures fixed or still open
