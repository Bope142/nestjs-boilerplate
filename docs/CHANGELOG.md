# Changelog

## 0.2.0 — Boilerplate modernization

- Upgrade NestJS **11 → 12** (`@nestjs/core` 12.4.x) and companion packages
- TypeScript **6**, Jest **30**, Nest CLI **12**
- Fix `DATABASE_URL_TEST` resolution for e2e isolation
- Add Draw.io automation (`tools/database-diagram`, `docs/database/database-architecture.drawio`)
- Harden Docker (non-root, healthcheck, optional `RUN_DB_MIGRATE`)
- CI: Postgres 16 (not PostGIS), migrate test DB, e2e, prod audit, diagram check, Docker build
- Swagger gated by `SWAGGER_ENABLED`
- Health checks Postgres + Redis
- Postman starter collection
- AGENTS.md + `database-diagram-generator` / `production-readiness-check` skills
- Strip Wapigo-specific Cursor rules; archive HappyGo reference under `docs/reference/`
- Production dependency audit clean (`pnpm audit --prod`)

## 0.1.0

- Initial NestJS boilerplate (Identity + Communication, Drizzle, Redis, BullMQ)
