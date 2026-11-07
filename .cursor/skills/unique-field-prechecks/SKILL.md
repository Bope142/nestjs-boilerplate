---
name: unique-field-prechecks
description: >-
  Pre-check DB unique columns before insert/update and map Postgres 23505
  (including Drizzle wrappers) to specific DomainErrors and localized messages.
  Use when adding create/register/import/duplicate flows, fixing unique
  constraint failures, empty import errors[], or MERCHANT_*_ALREADY_REGISTERED
  / AUTH_* conflict codes.
---

# Unique Field Pre-checks

## When to use

- Creating or updating rows that hit `.unique()` / `uniqueIndex` columns
- Import / BullMQ confirm jobs that create users or merchants
- Fixing `duplicate key value violates unique constraint` in logs with a generic API failure
- Adding a new unique column to a schema write path

## Steps

1. **Inventory uniques** on the table(s) written by the flow (Drizzle schema + live constraint names from the error if available).
2. **Add repository pre-checks** for each unique value before the transaction (reuse `findByEmail` / `findByPhone` / equivalent). Soft-deleted rows still conflict if the index includes them.
3. **Throw a dedicated DomainError** per field (`MERCHANT_PHONE_ALREADY_REGISTERED` ≠ email). Add fr/en i18n keys.
4. **Harden the catch** with shared helpers:
   - `isPgUniqueViolation(error)`
   - `getPgUniqueConstraintName(error)`
   - from `src/common/utils/pg-error.ts` (walks `cause` for Drizzle).
5. **Map constraint → DomainError** (`users_phone_unique` → phone; `users_email_uq` → email). Never collapse every `23505` into one code.
6. **Async / session responses** (merchant import confirm): set `failureCode` + `failureMessage` **and** push `errors[]` (`file`, `row`, `field`, `code`, `message`).
7. **Docs**: Swagger, `docs/*.md`, Postman conflict codes.
8. **Tests**: validator/service cases for each unique conflict + `pg-error` wrapper detection.

## Completion criteria

- [ ] Every unique on the insert path is pre-checked
- [ ] Residual `23505` maps to the correct DomainError via constraint name
- [ ] User sees a specific localized message (not only `IMPORT_CONFIRM_FAILED` / empty `errors`)
- [ ] i18n + API docs updated
- [ ] Unit coverage for the new conflict path

## Reference

- Rule: `.cursor/rules/unique-field-prechecks.mdc`
- Helpers: `src/common/utils/pg-error.ts`
- Merchant codes: `src/modules/marketplace/merchants/errors/merchant.errors.ts`
- Import confirm mapping: `MerchantImportsService.mapConfirmFailure`
