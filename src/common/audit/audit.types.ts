import type { AuditLogStatus, AuditLogType } from '../../database/schema/enums';

export type { AuditLogStatus, AuditLogType };

export type WriteAuditLogInput = {
  type: AuditLogType;
  status: AuditLogStatus;
  action: string;
  actorUserId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
};
