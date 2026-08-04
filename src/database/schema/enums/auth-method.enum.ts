import { pgEnum } from 'drizzle-orm/pg-core';

export const AUTH_METHODS = ['CREDENTIALS', 'GOOGLE', 'MAGIC_LINK'] as const;

export type AuthMethod = (typeof AUTH_METHODS)[number];

export const authMethodEnum = pgEnum('auth_method', AUTH_METHODS);
