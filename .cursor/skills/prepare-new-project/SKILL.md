---
name: prepare-new-project
description: Checklist for spinning up a new project from this NestJS boilerplate — rename, env, Docker, migrate, seed, start, and extend identity.
---

# Prepare New Project

Use this skill when cloning this boilerplate to start a new API service.

## Checklist

### 1. Install dependencies

```bash
pnpm install
```

### 2. Rename the project

Run the interactive initializer (or pass flags):

```bash
pnpm init:project
```

This updates `package.json` name, env defaults, and related identifiers. See `scripts/init-project.mjs` for supported flags (`--name`, `--package`, `--port`).

### 3. Configure environment

```bash
pnpm setup
```

Or manually:

```bash
cp .env.example .env
```

Review and set at minimum:

- `DATABASE_URL_DEV` (PostgreSQL)
- `JWT_SECRET` and related auth secrets
- `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` for seed
- `REDIS_URL` if cache or jobs are enabled
- `JOBS_ENABLED` / `CACHE_ENABLED` — set `false` for a minimal run without Redis

### 4. Start infrastructure

```bash
docker compose up -d
```

Starts PostgreSQL 16 and Redis 7 locally.

### 5. Database setup

```bash
pnpm db:migrate
pnpm db:seed
```

Seed creates the super admin from env vars.

### 6. Run the API

```bash
pnpm start:dev
```

- API: `http://localhost:<PORT>/api`
- Swagger: `http://localhost:<PORT>/api/docs`

### 7. Verify baseline

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### 8. Extend identity (users / roles)

Before adding domain modules:

1. Read `src/modules/identity/` — auth, users, roles, sessions, tokens.
2. Add permissions in the existing roles/permissions model; do not bypass guards.
3. Register new modules under `src/modules/` and import them in `AppModule`.
4. Follow `create-nest-module` and `create-secure-endpoint` for new features.

## References

- `README.md` — quick start
- `docs/getting-started.md` — detailed setup and troubleshooting
- `.cursor/rules/project-context.mdc` — stack and conventions

## Output

When helping a user spin up a project, confirm each checklist step, report blockers (missing Docker, env, migration errors), and list next steps for their domain work.
