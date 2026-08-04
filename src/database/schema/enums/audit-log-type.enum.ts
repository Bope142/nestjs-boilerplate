import { pgEnum } from 'drizzle-orm/pg-core';

export const AUDIT_LOG_TYPES = [
  'AUTH',
  'SECURITY',
  'USER',
  'SYSTEM',
  'COMMUNICATION',
] as const;

export type AuditLogType = (typeof AUDIT_LOG_TYPES)[number];

export const auditLogTypeEnum = pgEnum('audit_log_type', AUDIT_LOG_TYPES);
