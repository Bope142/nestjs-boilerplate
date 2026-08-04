---
name: drizzle-snake-case-schema
description: Define Drizzle schema tables and columns using snake_case TypeScript property names matching PostgreSQL identifiers. Use when creating or editing Drizzle tables, columns, relations, schema files, camelCase column keys, or TS2742 portable type errors (PgColumn, One, Many, Relations).
---

# Drizzle snake_case schema

## Rule

In Drizzle schema files (`src/database/schema/**` or module `schemas/`), TypeScript object keys for columns **must** be `snake_case` and match the PostgreSQL column name.

Correct:

```ts
first_name: text('first_name').notNull(),
user_id: uuid('user_id').notNull(),
created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
```

Incorrect:

```ts
firstName: text('first_name').notNull(),
userId: uuid('user_id').notNull(),
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
```

## Also apply to

- Partial unique `where` clauses: `table.deleted_at`, not `table.deletedAt`
- Indexes / unique constraints: `table.user_id`, `table.receipt_number`, `table.session_id`
- Relations `fields: [...]`: `payments.user_id`, not `.userId`
- Inserts/selects in repositories later: use `snake_case` keys

Add tenant isolation columns (e.g. `organization_id`) only when the product needs them.

## Portable exports (`declaration: true` / TS2742)

With `declaration: true`, exporting bare `pgTable(...)` or `relations(...)` often fails in the IDE because types resolve through non-portable `*.cjs` paths:

- tables: `PgColumn` / `PgTableWithColumns`
- relations: `One` / `Many` / `Relations`

### Tables

When the repository provides helpers, prefer them:

```ts
import { defineTable } from '../define-table';

export const users = defineTable(
  pgTable('users', {
    first_name: text('first_name').notNull(),
  }),
);
```

If helpers are not present yet, follow the existing schema export pattern in the repo and avoid non-portable re-exports that trigger TS2742.

### Relations

When helpers exist, wrap and annotate with `PortableRelations`:

```ts
import {
  defineRelations,
  type PortableRelations,
} from '../define-relations';

export const paymentsRelations: PortableRelations = defineRelations(
  relations(payments, ({ one }) => ({
    user: one(users, {
      fields: [payments.user_id],
      references: [users.id],
    }),
  })),
);
```

Never export a bare inferred `relations(...)` result when that causes TS2742.

## After changes

Run `pnpm run lint`.
