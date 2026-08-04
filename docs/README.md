# Documentation index

| Document | Description |
|----------|-------------|
| [getting-started.md](getting-started.md) | Local setup and first run |
| [auth.md](auth.md) | Authentication flows and extension points |
| [database.md](database.md) | Drizzle schema, migrations, seeds |
| [creating-a-module.md](creating-a-module.md) | Add a new NestJS feature module |
| [dependency-upgrades.md](dependency-upgrades.md) | Safe dependency update process |
| [production.md](production.md) | Production deployment checklist |
| [architecture/overview.md](architecture/overview.md) | Modular monolith layout |

## API reference

Interactive OpenAPI docs are served at `/api/docs` when the app is running.

## Contributing

- Use Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).
- Run `pnpm lint` before pushing (also enforced by hooks).
- CI runs lint, typecheck, test, and build on PRs to `main`.
