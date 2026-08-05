# NestJS Boilerplate

Production-ready NestJS API starter with JWT auth, Drizzle ORM, PostgreSQL, Redis, BullMQ jobs, email, i18n (fr/en), and Swagger.

**Author:** [Norbert Yemuang](https://github.com/Bope142)  
**License:** [MIT](LICENSE)

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

## Evolving this boilerplate

Use it as a **starting point**, not a frozen template. Typical paths:

### Start a new project from this repo

1. **Fork or clone** the repository.
2. Run **`pnpm init:project`** to rename the package, display name, and env defaults.
3. Follow [docs/getting-started.md](docs/getting-started.md) for local setup.
4. Remove or replace demo modules you do not need.

### Add a new feature module

Add domain features under `src/modules/<name>/` (controller, service, DTOs, optional repository). Register the module in `AppModule`, add Drizzle schema and migrations when persistence is required, and cover behavior with tests.

See [docs/creating-a-module.md](docs/creating-a-module.md) for the step-by-step checklist.

### Extend existing modules

| Area | Guide |
|------|--------|
| Auth, sessions, OAuth | [docs/auth.md](docs/auth.md) |
| Database schema and migrations | [docs/database.md](docs/database.md) |
| Roles and permissions | [docs/auth.md](docs/auth.md) — extend `user_role` enum and guards |
| API messages (i18n) | [src/i18n/README.md](src/i18n/README.md) |
| Architecture and layers | [docs/architecture/overview.md](docs/architecture/overview.md) |

### Keep dependencies up to date

Follow [docs/dependency-upgrades.md](docs/dependency-upgrades.md) — upgrade in small groups and run lint, typecheck, tests, and build after each batch.

## Contributing

Contributions are welcome — whether you improve the boilerplate itself or share patterns that help others build on it.

1. **Fork** the repository and create a branch from `main`.
2. **Make focused changes** — one concern per pull request when possible.
3. **Follow project conventions:**
   - [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, …) — enforced by the commit-msg hook.
   - Run **`pnpm lint`** before pushing (also enforced by pre-push hooks).
   - Add or update tests when behavior changes.
   - Update Swagger and docs when the API surface changes.
   - Generate and review Drizzle migrations for schema changes.
4. **Open a pull request** with a clear description and test plan.

CI runs lint, typecheck, test, and build on pull requests to `main`.

More detail: [docs/README.md](docs/README.md#contributing).

## Documentation

See [docs/README.md](docs/README.md) for the full index: architecture, auth, database, module creation, dependency upgrades, and the [production checklist](docs/production.md).

## License

[MIT](LICENSE) — Copyright (c) 2026 Norbert Yemuang.
