import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { users } from './users';

export const magicLinkTokens = defineTable(
  pgTable(
    'magic_link_tokens',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      user_id: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      token_hash: text('token_hash').notNull(),
      expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
      used_at: timestamp('used_at', { withTimezone: true }),
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [unique('magic_link_tokens_token_hash_uq').on(table.token_hash)],
  ),
);
