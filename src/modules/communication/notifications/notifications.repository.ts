import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, type SQL } from 'drizzle-orm';
import { toOffset } from '../../../common/utils/pagination';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { ReminderResourceType } from '../../../database/schema/enums';
import { inAppNotifications } from '../../../database/schema/tables/in-app-notifications';
import type { DrizzleDB } from '../../../database/types/drizzle';
import type { ListInAppNotificationsQueryDto } from './dto/list-in-app-notifications-query.dto';

export type InAppNotificationRow = typeof inAppNotifications.$inferSelect;

export type CreateInAppNotificationInput = {
  user_id: string;
  title: string;
  body: string;
  resource_type?: ReminderResourceType | null;
  resource_id?: string | null;
};

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async findByIdForUser(
    id: string,
    userId: string,
    tx?: DrizzleDB,
  ): Promise<InAppNotificationRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(inAppNotifications)
      .where(
        and(
          eq(inAppNotifications.id, id),
          eq(inAppNotifications.user_id, userId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async create(
    input: CreateInAppNotificationInput,
    tx?: DrizzleDB,
  ): Promise<InAppNotificationRow> {
    const rows = await this.client(tx)
      .insert(inAppNotifications)
      .values({
        user_id: input.user_id,
        title: input.title,
        body: input.body,
        resource_type: input.resource_type ?? null,
        resource_id: input.resource_id ?? null,
      })
      .returning();
    return rows[0];
  }

  async listForUser(
    userId: string,
    query: ListInAppNotificationsQueryDto,
    tx?: DrizzleDB,
  ): Promise<{ rows: InAppNotificationRow[]; total: number }> {
    const conditions: SQL[] = [eq(inAppNotifications.user_id, userId)];
    if (query.unreadOnly === true) {
      conditions.push(isNull(inAppNotifications.read_at));
    }
    const where = and(...conditions);
    const client = this.client(tx);
    const limit = query.pageSize;
    const offset = toOffset(query.page, query.pageSize);

    const [rows, totalRows] = await Promise.all([
      client
        .select()
        .from(inAppNotifications)
        .where(where)
        .orderBy(
          desc(inAppNotifications.created_at),
          asc(inAppNotifications.id),
        )
        .limit(limit)
        .offset(offset),
      client.select({ value: count() }).from(inAppNotifications).where(where),
    ]);

    return { rows, total: Number(totalRows[0]?.value ?? 0) };
  }

  async markRead(
    id: string,
    userId: string,
    tx?: DrizzleDB,
  ): Promise<InAppNotificationRow | null> {
    const existing = await this.findByIdForUser(id, userId, tx);
    if (!existing) {
      return null;
    }
    if (existing.read_at) {
      return existing;
    }

    const rows = await this.client(tx)
      .update(inAppNotifications)
      .set({ read_at: new Date() })
      .where(
        and(
          eq(inAppNotifications.id, id),
          eq(inAppNotifications.user_id, userId),
        ),
      )
      .returning();
    return rows[0] ?? null;
  }
}
