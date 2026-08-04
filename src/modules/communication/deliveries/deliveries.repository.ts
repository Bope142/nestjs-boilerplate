import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type {
  NotificationChannel,
  NotificationDeliveryStatus,
} from '../../../database/schema/enums';
import { notificationDeliveries } from '../../../database/schema/tables/notification-deliveries';
import type { DrizzleDB } from '../../../database/types/drizzle';

export type NotificationDeliveryRow =
  typeof notificationDeliveries.$inferSelect;

export type CreatePendingDeliveryInput = {
  reminder_id: string;
  channel: NotificationChannel;
  scheduled_for: Date;
};

@Injectable()
export class DeliveriesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async findById(
    id: string,
    tx?: DrizzleDB,
  ): Promise<NotificationDeliveryRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByIdempotency(
    reminderId: string,
    channel: NotificationChannel,
    scheduledFor: Date,
    tx?: DrizzleDB,
  ): Promise<NotificationDeliveryRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(notificationDeliveries)
      .where(
        and(
          eq(notificationDeliveries.reminder_id, reminderId),
          eq(notificationDeliveries.channel, channel),
          eq(notificationDeliveries.scheduled_for, scheduledFor),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async createPending(
    input: CreatePendingDeliveryInput,
    tx?: DrizzleDB,
  ): Promise<NotificationDeliveryRow> {
    const existing = await this.findByIdempotency(
      input.reminder_id,
      input.channel,
      input.scheduled_for,
      tx,
    );
    if (existing) {
      return existing;
    }

    const rows = await this.client(tx)
      .insert(notificationDeliveries)
      .values({
        reminder_id: input.reminder_id,
        channel: input.channel,
        scheduled_for: input.scheduled_for,
        status: 'PENDING',
        attempt_count: 0,
      })
      .onConflictDoNothing()
      .returning();

    if (rows[0]) {
      return rows[0];
    }

    const afterConflict = await this.findByIdempotency(
      input.reminder_id,
      input.channel,
      input.scheduled_for,
      tx,
    );
    if (!afterConflict) {
      throw new Error('Failed to create notification delivery');
    }
    return afterConflict;
  }

  async markSent(
    id: string,
    options?: { providerMessageId?: string | null },
    tx?: DrizzleDB,
  ): Promise<NotificationDeliveryRow | null> {
    return this.updateStatus(
      id,
      'SENT',
      {
        sent_at: new Date(),
        provider_message_id: options?.providerMessageId ?? null,
        error_code: null,
        error_message: null,
        skipped_reason: null,
      },
      tx,
    );
  }

  async markFailed(
    id: string,
    errorCode: string,
    errorMessage: string,
    tx?: DrizzleDB,
  ): Promise<NotificationDeliveryRow | null> {
    const existing = await this.findById(id, tx);
    if (!existing) {
      return null;
    }

    const rows = await this.client(tx)
      .update(notificationDeliveries)
      .set({
        status: 'FAILED',
        error_code: errorCode.slice(0, 120),
        error_message: errorMessage.slice(0, 500),
        attempt_count: existing.attempt_count + 1,
      })
      .where(eq(notificationDeliveries.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async markSkipped(
    id: string,
    reason: string,
    tx?: DrizzleDB,
  ): Promise<NotificationDeliveryRow | null> {
    return this.updateStatus(
      id,
      'SKIPPED',
      {
        skipped_reason: reason.slice(0, 200),
        error_code: null,
        error_message: null,
      },
      tx,
    );
  }

  private async updateStatus(
    id: string,
    status: NotificationDeliveryStatus,
    patch: Partial<typeof notificationDeliveries.$inferInsert>,
    tx?: DrizzleDB,
  ): Promise<NotificationDeliveryRow | null> {
    const rows = await this.client(tx)
      .update(notificationDeliveries)
      .set({ status, ...patch })
      .where(eq(notificationDeliveries.id, id))
      .returning();
    return rows[0] ?? null;
  }
}
