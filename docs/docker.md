# Docker

## Local infrastructure

```bash
pnpm docker:dev
```

Starts PostgreSQL 16 (`app_dev` on `5432`) and Redis 7 (`6379`). Create `app_test` via `pnpm db:setup:test` for e2e.

## API image

Multi-stage `Dockerfile`:

- Non-root user `nestjs`
- Healthcheck on `GET /api/health`
- Optional migrations: `RUN_DB_MIGRATE=true` (uses `DATABASE_URL_PROD` when `NODE_ENV=production`)

```bash
docker build -t nestjs-boilerplate:local .
docker run --env-file .env -p 3000:3000 nestjs-boilerplate:local
```

Do not generate Draw.io diagrams by migrating production databases — diagrams come from Drizzle snapshots only.
