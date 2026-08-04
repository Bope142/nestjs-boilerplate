import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { users } from './users';

export const emailVerificationTokens = defineTable(
  pgTable(
    'email_verification_tokens',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      user_id: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      token_hash: text('token_hash').notNull(),
      otp_hash: text('otp_hash').notNull(),
      expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
      verified_at: timestamp('verified_at', { withTimezone: true }),
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      unique('email_verification_tokens_token_hash_uq').on(table.token_hash),
      unique('email_verification_tokens_otp_hash_uq').on(table.otp_hash),
    ],
  ),
);
