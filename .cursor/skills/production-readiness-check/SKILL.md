---
name: production-readiness-check
description: Verify the NestJS boilerplate is ready to ship or initialize a new project — lint, typecheck, tests, audit, diagram check, Docker, env.
---

# Production Readiness Check

## When to activate

- Before tagging a release
- After modernization / dependency upgrades
- When validating a fresh clone of this starter

## Workflow

1. Ensure `.env` exists from `.env.example` (distinct `DATABASE_URL_*` names).
2. `pnpm docker:dev` — Postgres + Redis healthy.
3. `pnpm db:migrate` and `pnpm db:setup:test`.
4. Run gates:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm audit --prod
pnpm db:diagram:check
```

5. Optional: `docker build -t nestjs-boilerplate:local .`
6. Stop any local Nest process on ports 3000 / 8020.

## Checklist

- [ ] Fresh install with pnpm only
- [ ] Env validation passes at boot
- [ ] Health reports Postgres up
- [ ] Swagger gated by `SWAGGER_ENABLED` / non-production default
- [ ] No Critical/High prod audit findings
- [ ] Draw.io in sync with migrations
- [ ] CI workflow mirrors these gates
