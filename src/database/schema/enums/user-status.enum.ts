import { pgEnum } from 'drizzle-orm/pg-core';

export const USER_STATUSES = [
  'ACTIVE',
  'INVITED',
  'SUSPENDED',
  'DISABLED',
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const userStatusEnum = pgEnum('user_status', USER_STATUSES);
