import { pgEnum } from 'drizzle-orm/pg-core';

export const USER_TYPES = ['INTERNAL', 'EXTERNAL'] as const;

export type UserType = (typeof USER_TYPES)[number];

export const userTypeEnum = pgEnum('user_type', USER_TYPES);
