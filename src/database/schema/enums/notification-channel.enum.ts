import { pgEnum } from 'drizzle-orm/pg-core';

export const NOTIFICATION_CHANNELS = [
  'IN_APP',
  'EMAIL',
  'SMS',
  'WHATSAPP',
] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const IMPLEMENTED_NOTIFICATION_CHANNELS = ['IN_APP', 'EMAIL'] as const;

export const notificationChannelEnum = pgEnum(
  'notification_channel',
  NOTIFICATION_CHANNELS,
);
