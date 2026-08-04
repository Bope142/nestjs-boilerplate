# Creating a module

Add features as cohesive modules under `src/modules/<name>/`.

## Minimal steps

1. **Create folder structure**

```text
src/modules/example/
├── example.module.ts
├── example.controller.ts
├── example.service.ts
├── dto/
└── example.repository.ts   # if persistence is needed
```

2. **Register in `AppModule`**

```ts
imports: [ExampleModule],
```

3. **Controller**

- Thin: validate input, call service, return DTO.
- Add Swagger decorators and guards (`JwtAuthGuard`, `@Throttle`, etc.).

4. **Service**

- Business rules and orchestration.
- Throw typed application errors.

5. **Repository** (optional)

- Drizzle queries only; accept transaction client when needed.

6. **Schema** (if new tables)

- Add under `src/database/schema/tables/`.
- Export from `tables/index.ts`.
- `pnpm db:generate --name add_example`

7. **Tests**

- Unit tests for service logic.
- Integration/e2e for HTTP boundaries when behavior is non-trivial.

## Shared code

Put cross-cutting NestJS utilities in `src/common/`, configuration in `src/config/`, external adapters in `src/integrations/`, background work in `src/jobs/`.

Do not put domain logic in `src/common/`.

## Checklist

- [ ] DTO validation (`class-validator`)
- [ ] Auth on protected routes
- [ ] Swagger updated
- [ ] Migration if schema changed
- [ ] `pnpm lint` and relevant tests pass

See [architecture/overview.md](architecture/overview.md) for layer responsibilities.
