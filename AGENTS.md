# AGENTS.md — NestJS Boilerplate

How AI agents should collaborate in this repository.

## Roles → skills

| Role | Primary skills / rules |
|------|------------------------|
| Backend Architect | `nestjs-architecture-principles`, `codebase-design`, `improve-codebase-architecture` |
| NestJS Developer | `nestjs-expert`, `create-nest-module`, `create-secure-endpoint`, `implement` |
| Database Architect | `create-drizzle-schema`, `create-migration`, `drizzle-snake-case-schema`, `database-diagram-generator`, `database-test-isolation` |
| Security Auditor | `review-security`, `upgrade-dependencies`, security rule |
| Testing Engineer | `write-tests`, `tdd`, `jest-teardown-open-handles` |
| Code Reviewer | `code-review` |
| DevOps Engineer | Docker/CI docs, `verify-changes`, `production-readiness-check` |
| API Documentation | `update-api-docs` rule, `postman-json-body` |

Prefer **one** skill activation over duplicating the same checklist across tools (Cursor / Claude / Codex share `.cursor/skills` and `.agents/skills`).

## Collaboration rules

1. Read the relevant skill **before** coding.
2. Never invent Wapigo marketplace domain (merchants, riders, orders) — this starter is Identity + Communication only.
3. Auth stack: `ApiKeyGuard` → `JwtAuthGuard` → `RolesGuard`. Wire `EncryptedBearerTokenMiddleware` for every JWT controller.
4. Roles: `SUPER_ADMIN` \| `ADMIN` \| `USER`.
5. After any change: `pnpm lint` (mandatory). Then typecheck / tests as warranted.
6. **A Drizzle migration is not complete until Draw.io is synced** (`pnpm db:diagram:generate` + `pnpm db:diagram:check`). Schema + migrations are the source of truth; Draw.io is generated documentation.
7. E2e and DB tests use `DATABASE_URL_TEST` only (`NODE_ENV=test`).
8. Do not leave a Nest process listening after the session (stop port 3000 / 8020 if started).

## Common workflows

### New module / endpoint

`create-nest-module` → `create-secure-endpoint` → Swagger + Postman → `write-tests` → `verify-changes`

### Schema change

`create-drizzle-schema` → `create-migration` → `database-diagram-generator` → migrate TEST → tests

### Dependency upgrade

`upgrade-dependencies` → `pnpm audit` / `pnpm audit:security` → lint/typecheck/test/build

## Draw.io

- File: `docs/database/database-architecture.drawio`
- Page `00 — Current Database Schema` always reflects the latest snapshot
- Pages `01+` are immutable migration history
- Open with [diagrams.net](https://app.diagrams.net/) (File → Open from device)
