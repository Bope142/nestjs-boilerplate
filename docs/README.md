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

Contributions welcome. See the [main README](../README.md#contributing) for the full workflow. In short:

- Fork, branch from `main`, and open a focused pull request.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.).
- Run `pnpm lint` before pushing (also enforced by hooks).
- Add tests and update docs/Swagger when behavior or API contracts change.
- CI runs lint, typecheck, test, and build on PRs to `main`.
