import { pgEnum } from 'drizzle-orm/pg-core';

/** Extensible resource types for reminders. Add domain values as needed. */
export const REMINDER_RESOURCE_TYPES = ['GENERIC'] as const;
export type ReminderResourceType = (typeof REMINDER_RESOURCE_TYPES)[number];

export const reminderResourceTypeEnum = pgEnum(
  'reminder_resource_type',
  REMINDER_RESOURCE_TYPES,
);
