import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, lte, type SQL } from 'drizzle-orm';
import { toOffset } from '../../../common/utils/pagination';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type {
  NotificationChannel,
  ReminderResourceType,
  ReminderScheduleType,
  ReminderStatus,
} from '../../../database/schema/enums';
import { reminderTimeSlots } from '../../../database/schema/tables/reminder-time-slots';
import { reminders } from '../../../database/schema/tables/reminders';
import type { DrizzleDB } from '../../../database/types/drizzle';
import type { ListRemindersQueryDto } from './dto/list-reminders-query.dto';
import type {
  ReminderRow,
  ReminderTimeSlotRow,
  ReminderWithSlots,
} from './reminders.mapper';

export type CreateReminderRecordInput = {
  user_id: string | null;
  guest_email: string | null;
  resource_type: ReminderResourceType;
  resource_id: string;
  schedule_type: ReminderScheduleType;
  timezone: string;
  weekly_days: number[] | null;
  deadline_at: Date | null;
  offset_days: number[] | null;
  channels: NotificationChannel[];
  status: ReminderStatus;
  enabled: boolean;
  title: string;
  template_key: string;
  metadata: Record<string, unknown> | null;
  next_run_at: Date | null;
  time_slots: string[];
};

export type UpdateReminderRecordInput = {
  schedule_type?: ReminderScheduleType;
  timezone?: string;
  weekly_days?: number[] | null;
  deadline_at?: Date | null;
  offset_days?: number[] | null;
  channels?: NotificationChannel[];
  status?: ReminderStatus;
  enabled?: boolean;
  title?: string;
  template_key?: string;
  metadata?: Record<string, unknown> | null;
  next_run_at?: Date | null;
  consecutive_failures?: number;
  cancelled_at?: Date | null;
  cancel_reason?: string | null;
  last_enqueued_at?: Date | null;
  time_slots?: string[];
};

@Injectable()
export class RemindersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async findById(id: string, tx?: DrizzleDB): Promise<ReminderRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByIdWithSlots(
    id: string,
    tx?: DrizzleDB,
  ): Promise<ReminderWithSlots | null> {
    const row = await this.findById(id, tx);
    if (!row) {
      return null;
    }
    const slots = await this.findSlotsByReminderId(id, tx);
    return { ...row, time_slots: slots };
  }

  async findSlotsByReminderId(
    reminderId: string,
    tx?: DrizzleDB,
  ): Promise<ReminderTimeSlotRow[]> {
    return this.client(tx)
      .select()
      .from(reminderTimeSlots)
      .where(eq(reminderTimeSlots.reminder_id, reminderId))
      .orderBy(
        asc(reminderTimeSlots.sort_order),
        asc(reminderTimeSlots.local_time),
      );
  }

  async findActiveByResourceOwner(
    input: {
      resourceType: ReminderResourceType;
      resourceId: string;
      userId?: string | null;
      guestEmail?: string | null;
    },
    tx?: DrizzleDB,
  ): Promise<ReminderRow | null> {
    const ownerCondition = input.userId
      ? eq(reminders.user_id, input.userId)
      : input.guestEmail
        ? eq(reminders.guest_email, input.guestEmail)
        : undefined;

    if (!ownerCondition) {
      return null;
    }

    const rows = await this.client(tx)
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.resource_type, input.resourceType),
          eq(reminders.resource_id, input.resourceId),
          ownerCondition,
          inArray(reminders.status, ['ACTIVE', 'PAUSED']),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async countActiveByUserId(userId: string, tx?: DrizzleDB): Promise<number> {
    const rows = await this.client(tx)
      .select({ value: count() })
      .from(reminders)
      .where(
        and(
          eq(reminders.user_id, userId),
          inArray(reminders.status, ['ACTIVE', 'PAUSED']),
        ),
      );
    return Number(rows[0]?.value ?? 0);
  }

  async create(
    input: CreateReminderRecordInput,
    tx?: DrizzleDB,
  ): Promise<ReminderWithSlots> {
    const client = this.client(tx);

    const run = async (db: DrizzleDB): Promise<ReminderWithSlots> => {
      const inserted = await db
        .insert(reminders)
        .values({
          user_id: input.user_id,
          guest_email: input.guest_email,
          resource_type: input.resource_type,
          resource_id: input.resource_id,
          schedule_type: input.schedule_type,
          timezone: input.timezone,
          weekly_days: input.weekly_days,
          deadline_at: input.deadline_at,
          offset_days: input.offset_days,
          channels: input.channels,
          status: input.status,
          enabled: input.enabled,
          title: input.title,
          template_key: input.template_key,
          metadata: input.metadata,
          next_run_at: input.next_run_at,
        })
        .returning();

      const reminder = inserted[0];
      const slots = await this.replaceTimeSlots(
        reminder.id,
        input.time_slots,
        db,
      );
      return { ...reminder, time_slots: slots };
    };

    if (tx) {
      return run(client);
    }
    return this.db.transaction((inner) => run(inner));
  }

  async update(
    id: string,
    input: UpdateReminderRecordInput,
    tx?: DrizzleDB,
  ): Promise<ReminderWithSlots | null> {
    const client = this.client(tx);

    const run = async (db: DrizzleDB): Promise<ReminderWithSlots | null> => {
      const patch: Partial<typeof reminders.$inferInsert> = {};

      if (input.schedule_type !== undefined) {
        patch.schedule_type = input.schedule_type;
      }
      if (input.timezone !== undefined) {
        patch.timezone = input.timezone;
      }
      if (input.weekly_days !== undefined) {
        patch.weekly_days = input.weekly_days;
      }
      if (input.deadline_at !== undefined) {
        patch.deadline_at = input.deadline_at;
      }
      if (input.offset_days !== undefined) {
        patch.offset_days = input.offset_days;
      }
      if (input.channels !== undefined) {
        patch.channels = input.channels;
      }
      if (input.status !== undefined) {
        patch.status = input.status;
      }
      if (input.enabled !== undefined) {
        patch.enabled = input.enabled;
      }
      if (input.title !== undefined) {
        patch.title = input.title;
      }
      if (input.template_key !== undefined) {
        patch.template_key = input.template_key;
      }
      if (input.metadata !== undefined) {
        patch.metadata = input.metadata;
      }
      if (input.next_run_at !== undefined) {
        patch.next_run_at = input.next_run_at;
      }
      if (input.consecutive_failures !== undefined) {
        patch.consecutive_failures = input.consecutive_failures;
      }
      if (input.cancelled_at !== undefined) {
        patch.cancelled_at = input.cancelled_at;
      }
      if (input.cancel_reason !== undefined) {
        patch.cancel_reason = input.cancel_reason;
      }
      if (input.last_enqueued_at !== undefined) {
        patch.last_enqueued_at = input.last_enqueued_at;
      }

      let reminder: ReminderRow | null = null;
      if (Object.keys(patch).length > 0) {
        const rows = await db
          .update(reminders)
          .set(patch)
          .where(eq(reminders.id, id))
          .returning();
        reminder = rows[0] ?? null;
      } else {
        reminder = await this.findById(id, db);
      }

      if (!reminder) {
        return null;
      }

      const slots =
        input.time_slots !== undefined
          ? await this.replaceTimeSlots(id, input.time_slots, db)
          : await this.findSlotsByReminderId(id, db);

      return { ...reminder, time_slots: slots };
    };

    if (tx) {
      return run(client);
    }
    return this.db.transaction((inner) => run(inner));
  }

  async replaceTimeSlots(
    reminderId: string,
    timeSlots: string[],
    tx?: DrizzleDB,
  ): Promise<ReminderTimeSlotRow[]> {
    const client = this.client(tx);
    await client
      .delete(reminderTimeSlots)
      .where(eq(reminderTimeSlots.reminder_id, reminderId));

    if (timeSlots.length === 0) {
      return [];
    }

    const uniqueSorted = [
      ...new Set(timeSlots.map((slot) => slot.trim())),
    ].sort((a, b) => a.localeCompare(b));

    return client
      .insert(reminderTimeSlots)
      .values(
        uniqueSorted.map((local_time, index) => ({
          reminder_id: reminderId,
          local_time,
          sort_order: index,
        })),
      )
      .returning();
  }

  async list(
    query: ListRemindersQueryDto,
    tx?: DrizzleDB,
  ): Promise<{ rows: ReminderWithSlots[]; total: number }> {
    const where = this.buildWhere(query);
    const client = this.client(tx);
    const limit = query.pageSize;
    const offset = toOffset(query.page, query.pageSize);

    const [rows, totalRows] = await Promise.all([
      client
        .select()
        .from(reminders)
        .where(where)
        .orderBy(desc(reminders.created_at), asc(reminders.id))
        .limit(limit)
        .offset(offset),
      client.select({ value: count() }).from(reminders).where(where),
    ]);

    const withSlots = await this.attachSlots(rows, client);
    return { rows: withSlots, total: Number(totalRows[0]?.value ?? 0) };
  }

  async findDueForUpdate(
    batchSize: number,
    now: Date,
    tx?: DrizzleDB,
  ): Promise<ReminderRow[]> {
    return this.client(tx)
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.status, 'ACTIVE'),
          eq(reminders.enabled, true),
          lte(reminders.next_run_at, now),
        ),
      )
      .orderBy(asc(reminders.next_run_at), asc(reminders.id))
      .limit(batchSize)
      .for('update', { skipLocked: true });
  }

  async advanceNextRunAt(
    id: string,
    nextRunAt: Date | null,
    options?: {
      lastEnqueuedAt?: Date;
      status?: ReminderStatus;
      consecutiveFailures?: number;
    },
    tx?: DrizzleDB,
  ): Promise<ReminderRow | null> {
    const patch: Partial<typeof reminders.$inferInsert> = {
      next_run_at: nextRunAt,
    };
    if (options?.lastEnqueuedAt !== undefined) {
      patch.last_enqueued_at = options.lastEnqueuedAt;
    }
    if (options?.status !== undefined) {
      patch.status = options.status;
    }
    if (options?.consecutiveFailures !== undefined) {
      patch.consecutive_failures = options.consecutiveFailures;
    }

    const rows = await this.client(tx)
      .update(reminders)
      .set(patch)
      .where(eq(reminders.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async cancelByResource(
    resourceType: string,
    resourceId: string,
    reason: string,
    tx?: DrizzleDB,
  ): Promise<number> {
    const rows = await this.client(tx)
      .update(reminders)
      .set({
        status: 'CANCELLED',
        enabled: false,
        cancelled_at: new Date(),
        cancel_reason: reason,
        next_run_at: null,
      })
      .where(
        and(
          eq(reminders.resource_type, resourceType as ReminderResourceType),
          eq(reminders.resource_id, resourceId),
          inArray(reminders.status, ['ACTIVE', 'PAUSED']),
        ),
      )
      .returning({ id: reminders.id });

    return rows.length;
  }

  private async attachSlots(
    rows: ReminderRow[],
    client: DrizzleDB,
  ): Promise<ReminderWithSlots[]> {
    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map((row) => row.id);
    const slots = await client
      .select()
      .from(reminderTimeSlots)
      .where(inArray(reminderTimeSlots.reminder_id, ids))
      .orderBy(
        asc(reminderTimeSlots.sort_order),
        asc(reminderTimeSlots.local_time),
      );

    const byReminder = new Map<string, ReminderTimeSlotRow[]>();
    for (const slot of slots) {
      const list = byReminder.get(slot.reminder_id) ?? [];
      list.push(slot);
      byReminder.set(slot.reminder_id, list);
    }

    return rows.map((row) => ({
      ...row,
      time_slots: byReminder.get(row.id) ?? [],
    }));
  }

  private buildWhere(query: ListRemindersQueryDto): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.status) {
      conditions.push(eq(reminders.status, query.status));
    }
    if (query.resourceType) {
      conditions.push(eq(reminders.resource_type, query.resourceType));
    }
    if (query.resourceId) {
      conditions.push(eq(reminders.resource_id, query.resourceId));
    }
    if (query.userId) {
      conditions.push(eq(reminders.user_id, query.userId));
    }

    if (conditions.length === 0) {
      return undefined;
    }
    if (conditions.length === 1) {
      return conditions[0];
    }
    return and(...conditions);
  }

  /** Soft-cancel a single reminder (used by HTTP cancel / sync disable). */
  async cancelOne(
    id: string,
    reason: string,
    tx?: DrizzleDB,
  ): Promise<ReminderRow | null> {
    const rows = await this.client(tx)
      .update(reminders)
      .set({
        status: 'CANCELLED',
        enabled: false,
        cancelled_at: new Date(),
        cancel_reason: reason,
        next_run_at: null,
      })
      .where(
        and(
          eq(reminders.id, id),
          inArray(reminders.status, ['ACTIVE', 'PAUSED']),
        ),
      )
      .returning();
    return rows[0] ?? null;
  }
}
