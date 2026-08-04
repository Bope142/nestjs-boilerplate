import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { reminderResourceTypeEnum } from '../enums/reminder-resource-type.enum';
import { users } from './users';

export const inAppNotifications = defineTable(
  pgTable(
    'in_app_notifications',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      user_id: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      title: text('title').notNull(),
      body: text('body').notNull(),
      resource_type: reminderResourceTypeEnum('resource_type'),
      resource_id: uuid('resource_id'),
      read_at: timestamp('read_at', { withTimezone: true }),
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index('in_app_notifications_user_created_idx').on(
        table.user_id,
        table.created_at,
      ),
    ],
  ),
);
