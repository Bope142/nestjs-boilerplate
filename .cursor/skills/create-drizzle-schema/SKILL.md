---
name: create-drizzle-schema
description: Design or modify a PostgreSQL schema with Drizzle ORM for this NestJS boilerplate, including constraints, indexes, relations, data integrity, and migration planning.
---

# Create Drizzle Schema

Use this skill when adding or changing tables, columns, constraints, enums, relations, or indexes.

## Procedure

1. Read the business rule, existing schemas, and `.cursor/rules/drizzle-postgresql.mdc`.
2. Identify the domain module (`identity`, `communication`, or a new domain under `src/modules/`).
3. Define keys, lifecycle, retention, and audit needs.
4. Define columns with explicit types and nullability. Use **snake_case** TypeScript keys matching SQL column names (`user_id`, not `userId`).
5. Add foreign keys and intentional delete behavior (`RESTRICT` for audit or financial history).
6. Add unique constraints that match real business invariants (receipt numbers, provider references, idempotency keys). Add tenant isolation columns only when the product needs them.
7. Add check constraints for important invariants (positive amounts, allowed currencies when practical).
8. Add indexes based on expected query patterns.
9. Define Drizzle relations only where they improve typed querying (relation `fields` also use snake_case column refs).
10. Export tables/relations using the repository’s existing schema helpers when present (`defineTable` / `defineRelations`); otherwise follow established `src/database` patterns.
11. Generate a migration with `pnpm db:generate -- --name <snake_case_slug>` when that script exists; otherwise `pnpm exec drizzle-kit generate --name <snake_case_slug>`.
12. Review generated SQL manually (extra care for money or audit tables).
13. Add repository integration tests against PostgreSQL.
14. Run `pnpm run lint` before considering the schema work done.

## Required decisions

Document:

- Why the table exists.
- Primary key choice.
- Timezone semantics.
- Uniqueness scope.
- Deletion behavior.
- Expected high-frequency queries.
- Sensitive fields (PII, tokens, payment references).
- Financial impact and correction strategy if money-related.
- Migration and backfill risk.

## Commands

Use repository scripts when available. Always pass a descriptive `--name` (see `create-migration` skill):

```bash
pnpm db:generate -- --name <snake_case_slug>
pnpm db:check
```

Otherwise:

```bash
pnpm exec drizzle-kit generate --name <snake_case_slug>
pnpm exec drizzle-kit check
```

Never keep random Drizzle migration names (e.g. `lively_mephistopheles`). Do not run `push` on shared environments.

## Schema checklist

- [ ] UUID or justified primary key.
- [ ] Tenant isolation columns added only when the product requires them.
- [ ] `created_at`.
- [ ] `updated_at` when mutable.
- [ ] Correct `timestamptz` or `date` semantics.
- [ ] Money as `numeric` with explicit `currency` when applicable.
- [ ] Explicit `NOT NULL`.
- [ ] Foreign keys.
- [ ] Intentional delete behavior (no cascade-delete of confirmed audit/finance records).
- [ ] Business-scoped unique constraints.
- [ ] Query-driven indexes.
- [ ] No redundant index.
- [ ] No sensitive plaintext token.
- [ ] Migration SQL reviewed.
- [ ] PostgreSQL integration tests added.

## Migration safety

For populated tables:

- Avoid adding a required column without a safe default or backfill sequence.
- Avoid table rewrites during peak usage.
- Prefer concurrent index creation through a reviewed custom migration where operationally necessary.
- Use expand-and-contract for breaking changes.
- Never modify an already-applied migration.
