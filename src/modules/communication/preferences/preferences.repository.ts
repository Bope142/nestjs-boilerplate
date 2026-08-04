import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { NotificationChannel } from '../../../database/schema/enums';
import { userNotificationPreferences } from '../../../database/schema/tables/user-notification-preferences';
import type { DrizzleDB } from '../../../database/types/drizzle';

export type UserNotificationPreferencesRow =
  typeof userNotificationPreferences.$inferSelect;

export type UpsertNotificationPreferencesInput = {
  reminders_enabled?: boolean;
  default_channels?: NotificationChannel[];
  timezone?: string | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
};

@Injectable()
export class PreferencesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async findByUserId(
    userId: string,
    tx?: DrizzleDB,
  ): Promise<UserNotificationPreferencesRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.user_id, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async getOrCreate(
    userId: string,
    tx?: DrizzleDB,
  ): Promise<UserNotificationPreferencesRow> {
    const existing = await this.findByUserId(userId, tx);
    if (existing) {
      return existing;
    }

    const rows = await this.client(tx)
      .insert(userNotificationPreferences)
      .values({
        user_id: userId,
        reminders_enabled: true,
        default_channels: ['IN_APP', 'EMAIL'],
      })
      .onConflictDoNothing()
      .returning();

    if (rows[0]) {
      return rows[0];
    }

    const afterConflict = await this.findByUserId(userId, tx);
    if (!afterConflict) {
      throw new Error('Failed to create notification preferences');
    }
    return afterConflict;
  }

  async update(
    userId: string,
    input: UpsertNotificationPreferencesInput,
    tx?: DrizzleDB,
  ): Promise<UserNotificationPreferencesRow> {
    await this.getOrCreate(userId, tx);

    const patch: Partial<typeof userNotificationPreferences.$inferInsert> = {};
    if (input.reminders_enabled !== undefined) {
      patch.reminders_enabled = input.reminders_enabled;
    }
    if (input.default_channels !== undefined) {
      patch.default_channels = input.default_channels;
    }
    if (input.timezone !== undefined) {
      patch.timezone = input.timezone;
    }
    if (input.quiet_hours_start !== undefined) {
      patch.quiet_hours_start = input.quiet_hours_start;
    }
    if (input.quiet_hours_end !== undefined) {
      patch.quiet_hours_end = input.quiet_hours_end;
    }

    const rows = await this.client(tx)
      .update(userNotificationPreferences)
      .set(patch)
      .where(eq(userNotificationPreferences.user_id, userId))
      .returning();

    return rows[0];
  }
}
