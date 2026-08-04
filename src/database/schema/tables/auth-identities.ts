import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { authProviderEnum } from '../enums/auth-provider.enum';
import { users } from './users';

export const authIdentities = defineTable(
  pgTable(
    'auth_identities',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      user_id: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      provider: authProviderEnum('provider').notNull(),
      provider_subject: text('provider_subject'),
      provider_email: text('provider_email'),
      password_hash: text('password_hash'),
      linked_at: timestamp('linked_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      last_used_at: timestamp('last_used_at', { withTimezone: true }),
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      updated_at: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    },
    (table) => [
      unique('auth_identities_user_provider_uq').on(
        table.user_id,
        table.provider,
      ),
      uniqueIndex('auth_identities_provider_subject_uq')
        .on(table.provider, table.provider_subject)
        .where(sql`${table.provider_subject} IS NOT NULL`),
    ],
  ),
);
