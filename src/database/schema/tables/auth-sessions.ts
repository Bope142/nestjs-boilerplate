import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { authMethodEnum } from '../enums/auth-method.enum';
import { sessionRevocationReasonEnum } from '../enums/session-revocation-reason.enum';
import { users } from './users';

export const authSessions = defineTable(
  pgTable(
    'auth_sessions',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      user_id: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      auth_method: authMethodEnum('auth_method').notNull(),
      refresh_token_hash: text('refresh_token_hash').notNull(),
      ip_address: text('ip_address').notNull(),
      user_agent: text('user_agent').notNull(),
      device_name: text('device_name'),
      device_type: text('device_type'),
      browser: text('browser'),
      operating_system: text('operating_system'),
      last_activity_at: timestamp('last_activity_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
      revoked_at: timestamp('revoked_at', { withTimezone: true }),
      revoked_reason: sessionRevocationReasonEnum('revoked_reason'),
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      updated_at: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    },
    (table) => [
      unique('auth_sessions_refresh_token_hash_uq').on(
        table.refresh_token_hash,
      ),
      index('auth_sessions_user_id_idx').on(table.user_id),
      index('auth_sessions_expires_at_idx').on(table.expires_at),
    ],
  ),
);
