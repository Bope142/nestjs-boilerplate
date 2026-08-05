# Architecture overview

## Style

**Modular monolith** — one deployable NestJS application, organized by domain modules. No microservices, CQRS, or event sourcing by default.

## Layout

```text
src/
├── main.ts                 # Bootstrap, Swagger, global pipes/filters
├── app.module.ts
├── common/                 # Guards, filters, decorators, shared types, i18n
├── config/                 # Env validation and typed configuration
├── database/               # Drizzle client, schema, migrations wiring
├── i18n/                   # fr/en JSON catalogs (API messages)
├── integrations/           # Email, external APIs
├── jobs/                   # BullMQ processors and schedulers
├── health/                 # Health checks
└── modules/
    ├── identity/           # Auth, users, tokens
    └── communication/      # Reminders, notifications
```

## Layers

| Layer | Responsibility |
|-------|----------------|
| Controller | HTTP, DTO validation, auth decorators, Swagger |
| Service | Use cases, business rules, transactions |
| Repository | Drizzle queries, explicit return types |
| DTO | Transport input/output; never expose password hashes |

## Cross-cutting

- **Auth:** JWT access + refresh sessions, API key on auth routes, Argon2 passwords.
- **Validation:** global `AppI18nValidationPipe` with whitelist and forbid unknown properties.
- **i18n:** `nestjs-i18n` with `fr` default/fallback and `en`; stable error `code` + translated `message`.
- **Errors:** centralized exception filter; stable prefixed error codes for clients.
- **Observability:** structured logging; audit log table for sensitive actions.
- **Cache / queues:** Redis optional; BullMQ for async email and reminder dispatch.

## API

- Global prefix: `/api`
- Versioning: add URI version (`/api/v1`) when you need breaking changes.
- OpenAPI: `/api/docs`

## Data

- PostgreSQL + Drizzle ORM
- Migrations in `drizzle/`
- Redis for cache and job queues (separate logical DB indexes recommended)

## Extension

When a module grows large, split by subdomain (e.g. `identity/auth`, `identity/users`) but keep one Nest module graph unless you have a clear boundary for extraction.

See [creating-a-module.md](../creating-a-module.md) for step-by-step module creation.
