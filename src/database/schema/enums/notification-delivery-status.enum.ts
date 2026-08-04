import { pgEnum } from 'drizzle-orm/pg-core';

export const NOTIFICATION_DELIVERY_STATUSES = [
  'PENDING',
  'SENT',
  'FAILED',
  'SKIPPED',
  'CANCELLED',
] as const;
export type NotificationDeliveryStatus =
  (typeof NOTIFICATION_DELIVERY_STATUSES)[number];

export const notificationDeliveryStatusEnum = pgEnum(
  'notification_delivery_status',
  NOTIFICATION_DELIVERY_STATUSES,
);
