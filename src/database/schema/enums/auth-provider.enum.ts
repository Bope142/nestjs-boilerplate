import { pgEnum } from 'drizzle-orm/pg-core';

export const AUTH_PROVIDERS = ['CREDENTIALS', 'GOOGLE'] as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const authProviderEnum = pgEnum('auth_provider', AUTH_PROVIDERS);
