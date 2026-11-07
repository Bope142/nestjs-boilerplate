# NestJS Boilerplate

Production-ready NestJS **12** starter kit with authentication, Drizzle ORM (PostgreSQL), Redis caching, BullMQ jobs, i18n, Swagger, Postman, Docker, and automated Draw.io database diagrams.

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm docker:dev
pnpm db:migrate
pnpm db:setup:test
pnpm db:seed
pnpm dev
```

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs` (disable in production via `SWAGGER_ENABLED=false`)

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js ≥ 22.12, pnpm ≥ 10 |
| Framework | NestJS 12 |
| Language | TypeScript 6 |
| ORM | Drizzle + PostgreSQL 16 |
| Cache / queues | Redis 7 + BullMQ |
| Auth | Encrypted JWT bearer + refresh sessions, Argon2id |
| Docs | Swagger + Postman |
| Diagrams | Draw.io synced from Drizzle snapshots |

## Sample domain

- **Identity** — register/login, Google, magic link, sessions, users
- **Communication** — reminders, in-app notifications, preferences

Roles: `SUPER_ADMIN` · `ADMIN` · `USER`

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Watch mode |
| `pnpm build` / `pnpm start:prod` | Production build / run |
| `pnpm lint` / `pnpm typecheck` | Static checks |
| `pnpm test` / `pnpm test:e2e` / `pnpm test:cov` | Tests |
| `pnpm audit` / `pnpm audit:security` | Vulnerability scan (`audit:security` = prod) |
| `pnpm db:generate` | Drizzle migration + Draw.io sync |
| `pnpm db:migrate` / `pnpm db:migrate:test` | Apply migrations |
| `pnpm db:diagram:generate` / `check` / `validate` | Database diagrams |
| `pnpm docker:dev` | Start Postgres + Redis |

## Database & Draw.io

Schema and SQL migrations under `drizzle/` are the **source of truth**.

```bash
pnpm exec drizzle-kit generate --name add_example_table
pnpm db:diagram:generate
pnpm db:diagram:check
```

Master diagram: [`docs/database/database-architecture.drawio`](docs/database/database-architecture.drawio)

- Page `00 — Current Database Schema` — full live ER
- Pages `01+` — immutable migration history

Open with [diagrams.net](https://app.diagrams.net/).

## Security defaults

Helmet, CORS allowlist, throttling, validation whitelist, encrypted bearer tokens, Argon2id passwords, fail-fast env validation, sanitized error responses.

`pnpm audit --prod` is enforced in CI.

## AI agents

See [`AGENTS.md`](AGENTS.md) for roles and skills. Schema changes must use `database-diagram-generator`.

## Documentation

- [`docs/getting-started.md`](docs/getting-started.md)
- [`docs/architecture/overview.md`](docs/architecture/overview.md)
- [`docs/database/README.md`](docs/database/README.md)
- [`docs/security/dependency-audit.md`](docs/security/dependency-audit.md)
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md)
- Archived patterns reference: [`docs/reference/happygoreference.md`](docs/reference/happygoreference.md)

## Postman

Import [`postman/collections/nestjs-boilerplate.postman_collection.json`](postman/collections/nestjs-boilerplate.postman_collection.json) and [`postman/environments/local.postman_environment.json`](postman/environments/local.postman_environment.json).

## License

MIT
