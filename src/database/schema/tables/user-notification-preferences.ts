import {
  boolean,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { users } from './users';

export const userNotificationPreferences = defineTable(
  pgTable('user_notification_preferences', {
    user_id: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    reminders_enabled: boolean('reminders_enabled').notNull().default(true),
    default_channels: text('default_channels')
      .array()
      .notNull()
      .default(['IN_APP', 'EMAIL']),
    timezone: text('timezone'),
    quiet_hours_start: time('quiet_hours_start'),
    quiet_hours_end: time('quiet_hours_end'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
);
