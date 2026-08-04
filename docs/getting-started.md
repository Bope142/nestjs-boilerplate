# Getting started

## 1. Clone and install

```bash
git clone <repo-url> my-api
cd my-api
pnpm install
```

## 2. Configure environment

Copy the example env file and review secrets:

```bash
cp .env.example .env
```

Or run the setup helper (creates `.env` if missing and installs Git hooks):

```bash
pnpm setup
```

Optional: customize project name, port, and Redis prefix:

```bash
pnpm init:project
```

## 3. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL 16 (`localhost:5432`, database `app_dev`) and Redis 7 (`localhost:6379`).

## 4. Database

Apply the baseline migration and seed the super admin:

```bash
pnpm db:migrate
pnpm db:seed
```

Default seed credentials come from `.env` (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`).

## 5. Run the API

```bash
pnpm start:dev
```

- API base: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`

## 6. Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Missing DATABASE_URL_DEV` | Set `DATABASE_URL_DEV` in `.env` and ensure Postgres is running |
| Redis connection errors with jobs enabled | Start Redis or set `JOBS_ENABLED=false` / `CACHE_ENABLED=false` for a minimal run |
| Hooks not running | `pnpm hooks:install` |
| Migration errors on fresh DB | Drop and recreate `app_dev`, then `pnpm db:migrate` |

## Production build

```bash
pnpm build
pnpm start:prod
```

Or use the multi-stage `Dockerfile` at the repository root.
