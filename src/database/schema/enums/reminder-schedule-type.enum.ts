import { pgEnum } from 'drizzle-orm/pg-core';

export const REMINDER_SCHEDULE_TYPES = [
  'DAILY',
  'WEEKLY',
  'DEADLINE_OFFSET',
] as const;
export type ReminderScheduleType = (typeof REMINDER_SCHEDULE_TYPES)[number];

export const reminderScheduleTypeEnum = pgEnum(
  'reminder_schedule_type',
  REMINDER_SCHEDULE_TYPES,
);
