---
name: sync-schema-typed-fixtures
description: Sync TypeScript object literals typed as Drizzle $inferSelect or mapper rows after adding, renaming, or removing table columns. Use when changing src/database/schema tables, generating a migration, or when tests fail with TS2322 Property is missing on OrderDetailRow / inferSelect fixtures.
---

# Sync Schema-Typed Fixtures

Drizzle row types are inferred from the table. A new or renamed column is a **compile break** for every object typed as that row — including unit-test fixtures that `pnpm typecheck` never sees.

## Why typecheck is not enough

`pnpm typecheck` runs `tsc -p tsconfig.build.json --noEmit`, which **excludes** `**/*spec.ts` and `test/`. Specs are typechecked only when Jest/`ts-jest` loads them (`pnpm test`).

A schema change can pass lint + typecheck + targeted e2e and still fail the full suite with:

```text
error TS2322: Type '{ … }' is not assignable to type 'OrderDetailRow'.
  Property '<new_column>' is missing …
```

## When this skill applies

- Add / rename / drop a column on any table under `src/database/schema/tables/`.
- Change an enum used as a column type.
- Tests fail to *run* with TS2322 on a mapper/repository fixture (suite failed to run).

## Procedure

1. List the changed columns (name, nullability, default).
2. Search the repo for literals of that row type. Run all of:

```text
rg "<column_name>" --glob "*.ts"
rg "OrderDetailRow|OrderListRow|ClientOrderDetailRow|AdminOrderDetailRow" --glob "*.spec.ts"
rg "\\$inferSelect" --glob "*.spec.ts"
rg "insert\\(<table>" --glob "*.{ts,spec.ts}"
```

Replace `<column_name>` / `<table>` / mapper type with the ones you changed (not only `orders`).

3. Update **every** complete object literal:

   - `const baseDetail: OrderDetailRow = { … }`
   - factory helpers that return the full row (not `Partial<…>` overrides)
   - `db.insert(table).values({ … })` when the column is `NOT NULL` and has no DB default

4. For nullable new columns on existing fixtures, set `null` (same as sibling FKs like `promo_code_id`).
5. Do **not** silence with `as OrderDetailRow` / `as any`. That hides the next column too.
6. Run:

```bash
pnpm test -- <affected>.spec.ts --runInBand
pnpm typecheck
pnpm run lint
```

If many mapper/repository specs exist for that table, run `pnpm test` (full unit suite) before claiming done.

**Done when:** every typed fixture compiles, the affected specs pass, and no `as RowType` was added to skip a field.

## Example (orders)

Column added:

```ts
user_referral_reward_id: uuid('user_referral_reward_id'),
```

Fixture must include:

```ts
promo_commercial_id: null,
user_referral_reward_id: null,
service_fee: '0.00',
```

## Anti-patterns

- Updating production mappers/repositories but not `*.mapper.spec.ts` / `*.service.spec.ts` factories
- Relying on `pnpm typecheck` or a single e2e file after a schema change
- Casting fixtures to the row type to make TS2322 go away
- Searching only the module you edited (fixtures often live next to a *mapper*, not the schema file)
