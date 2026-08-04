import { pgEnum } from 'drizzle-orm/pg-core';

export const REMINDER_STATUSES = [
  'ACTIVE',
  'PAUSED',
  'CANCELLED',
  'COMPLETED',
] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export const reminderStatusEnum = pgEnum('reminder_status', REMINDER_STATUSES);
