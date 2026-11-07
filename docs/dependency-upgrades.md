# Dependency upgrades

Keep dependencies current without breaking the build. Runtime target: **NestJS 12**, **TypeScript 6**, **Node ≥ 22.12** (Jest Nest ESM needs Node 24.9+ with `--experimental-vm-modules` on some platforms).

## Weekly automation

Dependabot opens PRs weekly (see `.github/dependabot.yml`):

- **Grouped:** `@nestjs/*` (minor/patch only), Drizzle, ESLint toolchain
- **Ignored:** major semver bumps for `@nestjs/*`, `drizzle-orm`, `drizzle-kit`

Major Nest or Drizzle upgrades should be intentional, not automatic.

## Manual upgrade process

1. Read changelogs for NestJS, Drizzle, BullMQ, and security advisories.
2. Update one logical group at a time.
3. Run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
```

4. For Drizzle bumps, also run `pnpm db:check` and `pnpm db:diagram:check`.

## NestJS majors

Update `@nestjs/*`, `@nestjs/cli`, and `@nestjs/schematics` together. Follow https://docs.nestjs.com/migration-guide.

Nest 12 packages are ESM-only. Jest scripts already pass `--experimental-vm-modules`.

## Security

- Prioritize `pnpm audit --prod`.
- Document residual **dev-only** findings in `docs/security/dependency-audit.md`.
- Never silence advisories with `--audit-level` tricks.

## Lockfile

Always commit `pnpm-lock.yaml`. Use `pnpm install --frozen-lockfile` in CI and Docker.
