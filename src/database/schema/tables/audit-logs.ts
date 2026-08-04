import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { auditLogStatusEnum } from '../enums/audit-log-status.enum';
import { auditLogTypeEnum } from '../enums/audit-log-type.enum';
import { users } from './users';

export const auditLogs = defineTable(
  pgTable(
    'audit_logs',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      actor_user_id: uuid('actor_user_id').references(() => users.id, {
        onDelete: 'set null',
      }),
      type: auditLogTypeEnum('type').notNull(),
      status: auditLogStatusEnum('status').notNull(),
      action: text('action').notNull(),
      target_type: text('target_type'),
      target_id: text('target_id'),
      request_id: text('request_id'),
      ip_address: text('ip_address'),
      metadata: jsonb('metadata').$type<Record<string, unknown>>(),
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index('audit_logs_created_at_idx').on(table.created_at),
      index('audit_logs_actor_created_at_idx').on(
        table.actor_user_id,
        table.created_at,
      ),
      index('audit_logs_type_created_at_idx').on(table.type, table.created_at),
      index('audit_logs_status_created_at_idx').on(
        table.status,
        table.created_at,
      ),
    ],
  ),
);
