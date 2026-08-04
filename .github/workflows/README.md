# Workflows

## CI (`ci.yml`)

Runs on every push and pull request to `main`.

Steps:

1. Checkout
2. Node 22 + pnpm 10.1.0
3. `pnpm install --frozen-lockfile`
4. `pnpm lint`
5. `pnpm typecheck`
6. `pnpm test`
7. `pnpm build`

**Services:** PostgreSQL 16 and Redis 7 are started for future integration/e2e tests. E2E is not part of CI yet to avoid flaky env-dependent failures.

**Auto-merge:** not enabled. Review and merge PRs manually.

## Dependabot

See `.github/dependabot.yml` for weekly npm dependency update PRs. Major NestJS upgrades are ignored; minor/patch updates for `@nestjs/*` are grouped when possible.

## Deployment

Do not add deployment workflows until you have a target environment and secrets strategy.
