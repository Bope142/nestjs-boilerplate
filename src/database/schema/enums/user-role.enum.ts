import { pgEnum } from 'drizzle-orm/pg-core';

export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const userRoleEnum = pgEnum('user_role', USER_ROLES);
