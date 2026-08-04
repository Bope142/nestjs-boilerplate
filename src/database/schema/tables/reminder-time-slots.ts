import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { reminders } from './reminders';

export const reminderTimeSlots = defineTable(
  pgTable(
    'reminder_time_slots',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      reminder_id: uuid('reminder_id')
        .notNull()
        .references(() => reminders.id, { onDelete: 'cascade' }),
      local_time: text('local_time').notNull(),
      sort_order: integer('sort_order').notNull().default(0),
    },
    (table) => [
      uniqueIndex('reminder_time_slots_reminder_time_uq').on(
        table.reminder_id,
        table.local_time,
      ),
      check(
        'reminder_time_slots_local_time_chk',
        sql`${table.local_time} ~ '^(?:[01]\\d|2[0-3]):[0-5]\\d$'`,
      ),
    ],
  ),
);
