import { Injectable } from '@nestjs/common';
import type { NotificationChannel } from '../../../database/schema/enums';
import {
  NotificationPreferencesResponseDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification-preferences.dto';
import {
  PreferencesRepository,
  type UserNotificationPreferencesRow,
} from './preferences.repository';

@Injectable()
export class PreferencesService {
  constructor(private readonly repository: PreferencesRepository) {}

  async getForUser(
    userId: string,
  ): Promise<NotificationPreferencesResponseDto> {
    const row = await this.repository.getOrCreate(userId);
    return this.toResponse(row);
  }

  async updateForUser(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    const row = await this.repository.update(userId, {
      reminders_enabled: dto.remindersEnabled,
      default_channels: dto.defaultChannels,
      timezone:
        dto.timezone === undefined
          ? undefined
          : dto.timezone === null
            ? null
            : dto.timezone.trim() || null,
      quiet_hours_start:
        dto.quietHoursStart === undefined
          ? undefined
          : this.toDbTime(dto.quietHoursStart),
      quiet_hours_end:
        dto.quietHoursEnd === undefined
          ? undefined
          : this.toDbTime(dto.quietHoursEnd),
    });
    return this.toResponse(row);
  }

  private toResponse(
    row: UserNotificationPreferencesRow,
  ): NotificationPreferencesResponseDto {
    return {
      userId: row.user_id,
      remindersEnabled: row.reminders_enabled,
      defaultChannels: row.default_channels as NotificationChannel[],
      timezone: row.timezone,
      quietHoursStart: this.toApiTime(row.quiet_hours_start),
      quietHoursEnd: this.toApiTime(row.quiet_hours_end),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  /** Persist HH:mm as HH:mm:00 for PostgreSQL time. */
  private toDbTime(value: string | null): string | null {
    if (value === null) {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
  }

  private toApiTime(value: string | null): string | null {
    if (!value) {
      return null;
    }
    // pg time often comes as HH:mm:ss
    return value.slice(0, 5);
  }
}
