---
name: upgrade-dependencies
description: Upgrade dependencies safely for this NestJS boilerplate — read docs/dependency-upgrades.md, update in groups, run lint/typecheck/test/build, no blind latest or auto-merge majors.
---

# Upgrade Dependencies

Use this skill when bumping package versions, reviewing Dependabot PRs, or planning Nest/Drizzle major upgrades.

## Primary reference

Read and follow **`docs/dependency-upgrades.md`** before changing versions.

## Principles

- **No blind latest** — read changelogs and migration guides for the target versions.
- **Group logically** — e.g. all `@nestjs/*` together, Drizzle pair together, ESLint toolchain together.
- **One group per commit/PR** when possible for easier rollback.
- **No auto-merge for major bumps** — majors need explicit review and migration notes.
- **pnpm only** — never mix npm, Yarn, or Bun.
- **Commit `pnpm-lock.yaml`** after every upgrade.

## Workflow

1. Read `docs/dependency-upgrades.md` and relevant upstream migration guides.
2. Create a branch (e.g. `chore/deps-YYYY-MM`).
3. Update one logical group in `package.json`.
4. Install and verify:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

5. For Drizzle bumps, also run `pnpm db:check` when available.
6. Fix breaking changes in small, focused commits with clear messages.
7. Open a PR summarizing versions changed, breaking fixes, and any deployment notes.

## Dependabot

This repo uses grouped weekly Dependabot PRs (see `.github/dependabot.yml`):

- Minor/patch for `@nestjs/*`, Drizzle, ESLint toolchain
- Major bumps for Nest and Drizzle are **ignored** by automation — upgrade those intentionally

Review each Dependabot PR; do not enable auto-merge without running the verification commands above.

## Security patches

Prioritize `pnpm audit` findings on production dependencies. Patch quickly; if a major bump is required, follow the major upgrade process in `docs/dependency-upgrades.md`.

## Output

Report: packages updated, commands run, pass/fail for each gate, and any follow-up migration work.
