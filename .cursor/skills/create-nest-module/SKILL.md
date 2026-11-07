---
name: create-nest-module
description: Create or extend a production-ready NestJS business module following this boilerplate's architecture, security, testing, and API conventions.
---

# Create NestJS Module

Use this skill when creating a new backend module or a substantial use case inside an existing module (`identity`, `communication`, or domain modules under `src/modules/`).

## Inputs to determine

Before coding, identify:

- Business capability.
- Actors (admin, end user, system job, webhook).
- Required permissions.
- Main entities and invariants.
- API endpoints under `/api/v1`.
- State transitions (especially for money or workflow statuses).
- Audit requirements.
- External integrations (payments, email, SMS, PDF, storage).
- Expected query volume.
- Financial impact if any.

If information is missing, make conservative assumptions and list them clearly.

## Procedure

1. Read relevant `.cursor/rules` (`project-context`, `nestjs-architecture`, `security`, `api-conventions`) and `docs/` when useful.
2. Inspect existing modules and shared conventions under `src/modules`.
3. Search for related schemas, DTOs, permissions, errors, and utilities.
4. Propose the smallest module design that satisfies the use case.
5. Identify security, IDOR, and (for money workflows) race / idempotency risks. Add tenant isolation only when the product needs it.
6. Define API contracts and error codes.
7. Define or update Drizzle schemas and indexes.
8. Write tests for business behavior, authorization, and data integrity when applicable.
9. Implement controller, service, repository, mapper, and policy as needed.
10. If the module exposes JWT routes: implement `NestModule.configure` and register every JWT controller in `EncryptedBearerTokenMiddleware` `.forRoutes(…)` (see rule/skill `encrypted-bearer-token`).
11. Add Swagger documentation.
12. Run formatting, linting, type checking, and relevant tests (`pnpm run lint` mandatory).
13. Summarize changed files, commands run, assumptions, and residual risks.

## Required module qualities

- Thin controllers.
- Explicit DTO mapping.
- Permission guards.
- Typed errors.
- Transactions for atomic workflows.
- Safe structured logs.
- Pagination for collections.
- No circular dependencies.
- No unnecessary abstractions.
- No unrelated refactors.
- No tenant / organization isolation scaffolding unless the product requires it.

## Suggested structure

```text
src/modules/<module>/
├── <module>.module.ts
├── controllers/
├── dto/
├── services/
├── repositories/
├── schemas/
├── mappers/
├── policies/
├── errors/
└── tests/
```

Follow the repository’s existing structure when it differs. Keep modules under `src/modules` domain-oriented.

## Checklist

- [ ] The module is registered once.
- [ ] Dependencies are injected.
- [ ] Permissions are explicit.
- [ ] DTOs reject extra properties.
- [ ] Database invariants are constrained.
- [ ] Sensitive fields are not returned.
- [ ] Financial rules followed when money is involved.
- [ ] Success and failure tests exist.
- [ ] Unauthorized / forbidden / IDOR tests exist where relevant.
- [ ] Swagger is updated.
- [ ] No npm, Yarn, or Bun commands are used.
- [ ] `pnpm run lint` passed.
