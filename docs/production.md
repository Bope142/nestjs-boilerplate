# Production checklist

Before deploying this API:

## Configuration

- [ ] `NODE_ENV=production`
- [ ] Strong unique values for `JWT_SECRET`, `REFRESH_JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `API_ACCESS_KEY`
- [ ] `DATABASE_URL_PROD` points to a managed PostgreSQL instance
- [ ] Redis is reachable (`REDIS_*`, separate `REDIS_QUEUE_DB` if jobs enabled)
- [ ] SMTP credentials are production-ready (`MAIL_*`)
- [ ] `FRONTEND_BASE_URL` and `CORS_ORIGINS` match real frontends
- [ ] `GOOGLE_CLIENT_ID` set if Google login is used

## Database

- [ ] Migrations applied (`pnpm db:migrate`)
- [ ] Super admin seeded or provisioned securely
- [ ] Backups and restore procedure documented

## Runtime

- [ ] Process manager or container orchestration (Docker/K8s)
- [ ] Health check wired to `GET /api/health`
- [ ] Structured logs collected (no secrets)
- [ ] HTTPS terminated at the edge
- [ ] Rate limits reviewed for public auth routes

## Optional features

- [ ] Disable unused features via env (`CACHE_ENABLED`, `JOBS_ENABLED`)
- [ ] Review Swagger exposure (disable or protect in production if needed)

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
