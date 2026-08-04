import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { reminderResourceTypeEnum } from '../enums/reminder-resource-type.enum';
import { reminderScheduleTypeEnum } from '../enums/reminder-schedule-type.enum';
import { reminderStatusEnum } from '../enums/reminder-status.enum';
import { users } from './users';

export const reminders = defineTable(
  pgTable(
    'reminders',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      user_id: uuid('user_id').references(() => users.id, {
        onDelete: 'restrict',
      }),
      guest_email: text('guest_email'),
      resource_type: reminderResourceTypeEnum('resource_type').notNull(),
      resource_id: uuid('resource_id').notNull(),
      schedule_type: reminderScheduleTypeEnum('schedule_type').notNull(),
      timezone: text('timezone').notNull().default('Africa/Kinshasa'),
      weekly_days: smallint('weekly_days').array(),
      deadline_at: timestamp('deadline_at', { withTimezone: true }),
      offset_days: integer('offset_days').array(),
      channels: text('channels').array().notNull(),
      status: reminderStatusEnum('status').notNull().default('ACTIVE'),
      enabled: boolean('enabled').notNull().default(true),
      title: text('title').notNull(),
      template_key: text('template_key').notNull(),
      metadata: jsonb('metadata').$type<Record<string, unknown>>(),
      next_run_at: timestamp('next_run_at', { withTimezone: true }),
      last_enqueued_at: timestamp('last_enqueued_at', { withTimezone: true }),
      consecutive_failures: integer('consecutive_failures')
        .notNull()
        .default(0),
      cancelled_at: timestamp('cancelled_at', { withTimezone: true }),
      cancel_reason: text('cancel_reason'),
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      updated_at: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    },
    (table) => [
      uniqueIndex('reminders_resource_user_active_uq')
        .on(table.resource_type, table.resource_id, table.user_id)
        .where(
          sql`${table.user_id} IS NOT NULL AND ${table.status} IN ('ACTIVE', 'PAUSED')`,
        ),
      uniqueIndex('reminders_resource_guest_active_uq')
        .on(table.resource_type, table.resource_id, table.guest_email)
        .where(
          sql`${table.guest_email} IS NOT NULL AND ${table.status} IN ('ACTIVE', 'PAUSED')`,
        ),
      index('reminders_due_idx')
        .on(table.status, table.next_run_at)
        .where(sql`${table.status} = 'ACTIVE' AND ${table.enabled} = true`),
      index('reminders_user_id_idx').on(table.user_id),
      index('reminders_resource_idx').on(
        table.resource_type,
        table.resource_id,
      ),
      check(
        'reminders_owner_chk',
        sql`(
          (${table.user_id} IS NOT NULL AND ${table.guest_email} IS NULL)
          OR
          (${table.user_id} IS NULL AND ${table.guest_email} IS NOT NULL)
        )`,
      ),
      check(
        'reminders_channels_not_empty_chk',
        sql`cardinality(${table.channels}) >= 1`,
      ),
    ],
  ),
);
