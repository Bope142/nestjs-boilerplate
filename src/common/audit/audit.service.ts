import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE } from '../../database/drizzle.provider';
import { auditLogs } from '../../database/schema/tables/audit-logs';
import type { DrizzleDB } from '../../database/types/drizzle';
import type { WriteAuditLogInput } from './audit.types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async write(input: WriteAuditLogInput, tx?: DrizzleDB): Promise<void> {
    await this.client(tx)
      .insert(auditLogs)
      .values({
        type: input.type,
        status: input.status,
        action: input.action,
        actor_user_id: input.actorUserId ?? null,
        target_type: input.targetType ?? null,
        target_id: input.targetId ?? null,
        request_id: input.requestId ?? null,
        ip_address: input.ipAddress ?? null,
        metadata: input.metadata ?? null,
      });
  }

  async success(
    input: Omit<WriteAuditLogInput, 'status'>,
    tx?: DrizzleDB,
  ): Promise<void> {
    await this.write({ ...input, status: 'SUCCESS' }, tx);
  }

  async failure(
    input: Omit<WriteAuditLogInput, 'status'>,
    tx?: DrizzleDB,
  ): Promise<void> {
    await this.write({ ...input, status: 'FAILURE' }, tx);
  }

  /**
   * Best-effort failure audit that never masks the original business error.
   */
  async failureSafe(input: Omit<WriteAuditLogInput, 'status'>): Promise<void> {
    try {
      await this.failure(input);
    } catch (error) {
      this.logger.warn(
        `Impossible d'écrire le journal d'audit pour l'action ${input.action}`,
      );
      this.logger.debug(
        error instanceof Error ? error.message : 'unknown audit error',
      );
    }
  }
}
