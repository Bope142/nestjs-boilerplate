import { pgEnum } from 'drizzle-orm/pg-core';

export const SESSION_REVOCATION_REASONS = [
  'LOGOUT',
  'LOGOUT_ALL',
  'PASSWORD_CHANGED',
  'ADMIN_REVOKED',
  'SECURITY_RISK',
  'REFRESH_TOKEN_REUSE',
] as const;

export type SessionRevocationReason =
  (typeof SESSION_REVOCATION_REASONS)[number];

export const sessionRevocationReasonEnum = pgEnum(
  'session_revocation_reason',
  SESSION_REVOCATION_REASONS,
);
