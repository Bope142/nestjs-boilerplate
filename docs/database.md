# Database

PostgreSQL is the source of truth. Schema is defined with Drizzle ORM under `src/database/schema/`.

## Baseline schema

Single migration `drizzle/0000_core_baseline.sql` creates:

**Core identity**

- `users`, `auth_identities`, `auth_sessions`
- `email_verification_tokens`, `magic_link_tokens`, `password_reset_tokens`

**Audit**

- `audit_logs`

**Communication**

- `reminders`, `reminder_time_slots`
- `user_notification_preferences`, `in_app_notifications`, `notification_deliveries`

## Enums (baseline)

- `user_role`: `SUPER_ADMIN`, `ADMIN`, `USER`
- `audit_log_type`: `AUTH`, `SECURITY`, `USER`, `SYSTEM`, `COMMUNICATION` (no finance-specific types)
- `reminder_resource_type`: `GENERIC` (extend when you add domain resources)

## Commands

```bash
pnpm db:generate    # after schema changes
pnpm db:migrate     # apply pending migrations
pnpm db:studio      # Drizzle Studio (dev)
pnpm db:check       # validate migration history
pnpm db:seed        # seed super admin
```

## Conventions

- **snake_case** column names in TypeScript and SQL.
- UUID primary keys, `timestamptz` for instants, UTC in application code.
- Review generated SQL before committing; never edit applied migrations—add a new one.

## Changing schema

1. Edit tables/enums in `src/database/schema/`.
2. Export new tables from `tables/index.ts` if added.
3. `pnpm db:generate --name descriptive_name`
4. Review `drizzle/*.sql` and `drizzle/meta/_journal.json`.
5. Apply locally: `pnpm db:migrate`.

## Seeds

`scripts/seed-users.ts` creates the platform super admin from env vars. Keep seeds idempotent and safe for development only.

## Connection

- Development: `DATABASE_URL_DEV` (default `postgresql://postgres:postgres@localhost:5432/app_dev`)
- Production: `DATABASE_URL_PROD` when `NODE_ENV=production`

Resolved in `src/database/database-url.ts`.
