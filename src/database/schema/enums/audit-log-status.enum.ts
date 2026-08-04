import { pgEnum } from 'drizzle-orm/pg-core';

export const AUDIT_LOG_STATUSES = ['SUCCESS', 'FAILURE'] as const;

export type AuditLogStatus = (typeof AUDIT_LOG_STATUSES)[number];

export const auditLogStatusEnum = pgEnum(
  'audit_log_status',
  AUDIT_LOG_STATUSES,
);
