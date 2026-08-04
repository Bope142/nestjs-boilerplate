# NestJS Boilerplate

Production-ready NestJS API starter with JWT auth, Drizzle ORM, PostgreSQL, Redis, BullMQ jobs, email, and Swagger.

## Prerequisites

- Node.js 22+
- pnpm 10.1.0 (`corepack enable && corepack prepare pnpm@10.1.0 --activate`)
- Docker (recommended for PostgreSQL and Redis)

## Quick start

```bash
git clone <repo-url> my-api
cd my-api
pnpm install
pnpm init:project          # optional: rename package and env defaults
cp .env.example .env       # or: pnpm setup
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm start:dev
```

Open Swagger at [http://localhost:3000/api/docs](http://localhost:3000/api/docs) (adjust `PORT` if changed).

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm setup` | Create `.env`, install Git hooks, print next steps |
| `pnpm init:project` | Interactive rename of package/env defaults |
| `pnpm start:dev` | Run API in watch mode |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | E2E tests (requires DB/Redis) |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate Drizzle migration from schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed super admin user |

## Git hooks

`pnpm install` configures hooks from `.githooks/`:

- **pre-commit:** lint-staged
- **pre-push:** lint, typecheck, test, build
- **commit-msg:** Conventional Commits via commitlint

## Docker

Local infrastructure:

```bash
docker compose up -d
```

Production API image:

```bash
docker build -t my-api .
```

## Documentation

See [docs/README.md](docs/README.md) for architecture, auth, database, dependency upgrades, and [production checklist](docs/production.md).

## License

UNLICENSED (update for your project).
