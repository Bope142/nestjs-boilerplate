import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { notificationChannelEnum } from '../enums/notification-channel.enum';
import { notificationDeliveryStatusEnum } from '../enums/notification-delivery-status.enum';
import { reminders } from './reminders';

export const notificationDeliveries = defineTable(
  pgTable(
    'notification_deliveries',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      reminder_id: uuid('reminder_id')
        .notNull()
        .references(() => reminders.id, { onDelete: 'restrict' }),
      channel: notificationChannelEnum('channel').notNull(),
      scheduled_for: timestamp('scheduled_for', {
        withTimezone: true,
      }).notNull(),
      status: notificationDeliveryStatusEnum('status')
        .notNull()
        .default('PENDING'),
      attempt_count: integer('attempt_count').notNull().default(0),
      provider_message_id: text('provider_message_id'),
      error_code: text('error_code'),
      error_message: text('error_message'),
      skipped_reason: text('skipped_reason'),
      sent_at: timestamp('sent_at', { withTimezone: true }),
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      updated_at: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    },
    (table) => [
      uniqueIndex('notification_deliveries_idempotency_uq').on(
        table.reminder_id,
        table.channel,
        table.scheduled_for,
      ),
      index('notification_deliveries_reminder_status_idx').on(
        table.reminder_id,
        table.status,
      ),
      index('notification_deliveries_scheduled_for_idx').on(
        table.scheduled_for,
      ),
    ],
  ),
);
