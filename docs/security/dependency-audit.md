# Dependency audit

Last refreshed during NestJS Boilerplate modernization (Nest 11 → 12).

## Baseline → current

| Package | Before | After |
|---------|--------|-------|
| `@nestjs/core` | ^11.0.1 | ^12.4.0 |
| `@nestjs/common` | ^11.0.1 | ^12.4.0 |
| `@nestjs/platform-express` | ^11.0.1 | ^12.4.0 |
| `@nestjs/config` | ^4.0.4 | ^12.1.1 |
| `@nestjs/cli` | ^11 | ^12.0.12 |
| `typescript` | ^5.7 / 5.9 | ^6.0.3 |
| `nodemailer` | ^9 / 7 | ^10.4.0 |
| `jest` | ^29 | ^30.5.2 |

## Production audit (`pnpm audit --prod`)

**Status:** no known vulnerabilities (verified after nodemailer ≥10.0.13 and Nest 12 upgrade).

## Full audit (`pnpm audit`)

Remaining findings are **devDependency / toolchain** transitive issues (eslint, jest, nest cli, esbuild via drizzle-kit, etc.). They are not shipped in the production image after `pnpm prune --prod`.

| Severity | Package | Notes |
|----------|---------|--------|
| High / Moderate | `brace-expansion` (via minimatch in eslint/jest) | Override pins `brace-expansion@<1.1.17` → `1.1.17`; remaining may be v2/v5 lines with separate advisories |
| Moderate | `esbuild` (drizzle-kit) | Dev-only migration tooling |
| Moderate | `file-type`, `glob`, `minimatch` | Toolchain |
| Low | `deepmerge` (fork-ts-checker / jest-config) | Dev-only; no patched release listed as `<0.0.0` in some advisories |

### Policy

- CI fails on `pnpm audit --prod` findings (Critical/High/Moderate).
- Do not silence advisories with `--audit-level` tricks.
- Re-run `pnpm outdated` and `pnpm audit` after every dependency PR.

## Commands

```bash
pnpm outdated
pnpm audit
pnpm audit:security   # alias of audit --prod
```
