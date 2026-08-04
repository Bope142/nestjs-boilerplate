# Dependency upgrades

Keep dependencies current without breaking the build. This project pins Node 22 and pnpm 10.1.0 in `package.json` / CI.

## Weekly automation

Dependabot opens PRs weekly (see `.github/dependabot.yml`):

- **Grouped:** `@nestjs/*` (minor/patch only), Drizzle, ESLint toolchain
- **Ignored:** major semver bumps for `@nestjs/*`, `drizzle-orm`, `drizzle-kit`

Major Nest or Drizzle upgrades should be intentional, not automatic.

## Manual upgrade process

1. **Read changelogs** for NestJS, Drizzle, BullMQ, and any security advisories.
2. **Create a branch** (`chore/deps-YYYY-MM`).
3. **Update one logical group at a time** (e.g. Nest patch, then devDependencies).
4. **Run locally:**

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

5. **Fix breaking changes** in small commits with clear messages.
6. **Open PR** with summary of versions and any migration notes.

## NestJS major upgrades

- Review [NestJS migration guide](https://docs.nestjs.com/migration-guide) for the target major.
- Update `@nestjs/*`, `@nestjs/cli`, and `@nestjs/schematics` together.
- Re-run code generation schematics only if you rely on them.
- Pay attention to Express/Fastify peer changes and Swagger compatibility.

## Drizzle upgrades

- Run `pnpm db:check` after upgrading `drizzle-orm` / `drizzle-kit`.
- Regenerate nothing unless schema changed; verify existing migrations still apply on a fresh DB.

## Security patches

- Prioritize `pnpm audit` findings on production dependencies.
- Patch quickly; if a major bump is required, follow the major upgrade process above.

## Lockfile

Always commit `pnpm-lock.yaml`. Use `pnpm install --frozen-lockfile` in CI and Docker builds.

## Do not

- Mix npm/yarn with pnpm.
- Skip tests on dependency-only PRs.
- Enable auto-merge for Dependabot PRs without review.
