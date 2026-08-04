import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../common/audit/audit.service';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import type { PaginatedResponse } from '../../../common/types/paginated-response';
import { toPaginatedResponse } from '../../../common/utils/pagination';
import { getJobsConfig } from '../../../config/jobs.config';
import type {
  NotificationChannel,
  ReminderScheduleType,
} from '../../../database/schema/enums';
import type {
  ReminderPort,
  SyncResourceReminderInput,
} from '../ports/reminder.port';
import { CancelReminderDto } from './dto/cancel-reminder.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ListRemindersQueryDto } from './dto/list-reminders-query.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import {
  reminderForbidden,
  reminderInvalidOwner,
  reminderInvalidSchedule,
  reminderInvalidStatusTransition,
  reminderMaxActiveReached,
  reminderMaxChannelsExceeded,
  reminderMaxSlotsExceeded,
  reminderNotFound,
} from './errors/reminder.errors';
import { computeNextRunAt } from './reminder-schedule';
import { toReminderResponse } from './reminders.mapper';
import { RemindersRepository } from './reminders.repository';

const DEFAULT_TIMEZONE = 'Africa/Kinshasa';

@Injectable()
export class RemindersService implements ReminderPort {
  constructor(
    private readonly repository: RemindersRepository,
    private readonly audit: AuditService,
  ) {}

  async list(
    query: ListRemindersQueryDto,
  ): Promise<PaginatedResponse<ReminderResponseDto>> {
    const { rows, total } = await this.repository.list(query);
    return toPaginatedResponse(
      rows.map((row) => toReminderResponse(row, row.time_slots)),
      query.page,
      query.pageSize,
      total,
    );
  }

  async getById(
    id: string,
    actor?: AuthenticatedActor,
  ): Promise<ReminderResponseDto> {
    const row = await this.repository.findByIdWithSlots(id);
    if (!row) {
      reminderNotFound();
    }
    if (actor) {
      this.assertCanAccess(row.user_id, actor);
    }
    return toReminderResponse(row, row.time_slots);
  }

  async create(
    dto: CreateReminderDto,
    actor: AuthenticatedActor,
  ): Promise<ReminderResponseDto> {
    const jobs = getJobsConfig();
    this.assertLimits(dto.channels, dto.timeSlots, jobs);

    const activeCount = await this.repository.countActiveByUserId(actor.userId);
    if (activeCount >= jobs.reminderMaxActivePerUser) {
      reminderMaxActiveReached();
    }

    const schedule = this.normalizeSchedule({
      scheduleType: dto.scheduleType,
      weeklyDays: dto.weeklyDays ?? null,
      deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
      offsetDays: dto.offsetDays ?? null,
      timeSlots: dto.timeSlots,
      timezone: dto.timezone?.trim() || DEFAULT_TIMEZONE,
      channels: dto.channels,
    });

    const nextRunAt = computeNextRunAt({
      scheduleType: schedule.scheduleType,
      timezone: schedule.timezone,
      timeSlots: schedule.timeSlots,
      weeklyDays: schedule.weeklyDays,
      deadlineAt: schedule.deadlineAt,
      offsetDays: schedule.offsetDays,
    });

    const row = await this.repository.create({
      user_id: actor.userId,
      guest_email: null,
      resource_type: dto.resourceType,
      resource_id: dto.resourceId,
      schedule_type: schedule.scheduleType,
      timezone: schedule.timezone,
      weekly_days: schedule.weeklyDays,
      deadline_at: schedule.deadlineAt,
      offset_days: schedule.offsetDays,
      channels: schedule.channels,
      status: 'ACTIVE',
      enabled: dto.enabled ?? true,
      title: dto.title.trim(),
      template_key: dto.templateKey.trim(),
      metadata: dto.metadata ?? null,
      next_run_at: nextRunAt,
      time_slots: schedule.timeSlots,
    });

    await this.audit.success({
      type: 'COMMUNICATION',
      action: 'reminder.create',
      actorUserId: actor.userId,
      targetType: 'reminder',
      targetId: row.id,
      metadata: {
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        scheduleType: row.schedule_type,
      },
    });

    return toReminderResponse(row, row.time_slots);
  }

  async update(
    id: string,
    dto: UpdateReminderDto,
    actor: AuthenticatedActor,
  ): Promise<ReminderResponseDto> {
    const existing = await this.repository.findByIdWithSlots(id);
    if (!existing) {
      reminderNotFound();
    }
    this.assertCanAccess(existing.user_id, actor);
    if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED') {
      reminderInvalidStatusTransition();
    }

    const jobs = getJobsConfig();
    const channels =
      dto.channels ?? (existing.channels as NotificationChannel[]);
    const timeSlots =
      dto.timeSlots ?? existing.time_slots.map((slot) => slot.local_time);
    this.assertLimits(channels, timeSlots, jobs);

    const schedule = this.normalizeSchedule({
      scheduleType: dto.scheduleType ?? existing.schedule_type,
      weeklyDays:
        dto.weeklyDays !== undefined ? dto.weeklyDays : existing.weekly_days,
      deadlineAt:
        dto.deadlineAt !== undefined
          ? dto.deadlineAt
            ? new Date(dto.deadlineAt)
            : null
          : existing.deadline_at,
      offsetDays:
        dto.offsetDays !== undefined ? dto.offsetDays : existing.offset_days,
      timeSlots,
      timezone: dto.timezone?.trim() || existing.timezone,
      channels,
    });

    const nextRunAt = computeNextRunAt({
      scheduleType: schedule.scheduleType,
      timezone: schedule.timezone,
      timeSlots: schedule.timeSlots,
      weeklyDays: schedule.weeklyDays,
      deadlineAt: schedule.deadlineAt,
      offsetDays: schedule.offsetDays,
    });

    const row = await this.repository.update(id, {
      schedule_type: schedule.scheduleType,
      timezone: schedule.timezone,
      weekly_days: schedule.weeklyDays,
      deadline_at: schedule.deadlineAt,
      offset_days: schedule.offsetDays,
      channels: schedule.channels,
      enabled: dto.enabled,
      title: dto.title?.trim(),
      template_key: dto.templateKey?.trim(),
      metadata: dto.metadata,
      next_run_at: nextRunAt,
      time_slots: schedule.timeSlots,
    });
    if (!row) {
      reminderNotFound();
    }

    await this.audit.success({
      type: 'COMMUNICATION',
      action: 'reminder.update',
      actorUserId: actor.userId,
      targetType: 'reminder',
      targetId: row.id,
    });

    return toReminderResponse(row, row.time_slots);
  }

  async pause(
    id: string,
    actor: AuthenticatedActor,
  ): Promise<ReminderResponseDto> {
    const existing = await this.repository.findByIdWithSlots(id);
    if (!existing) {
      reminderNotFound();
    }
    this.assertCanAccess(existing.user_id, actor);
    if (existing.status !== 'ACTIVE') {
      reminderInvalidStatusTransition();
    }

    const row = await this.repository.update(id, {
      status: 'PAUSED',
      enabled: false,
      next_run_at: null,
    });
    if (!row) {
      reminderNotFound();
    }

    await this.audit.success({
      type: 'COMMUNICATION',
      action: 'reminder.pause',
      actorUserId: actor.userId,
      targetType: 'reminder',
      targetId: row.id,
    });

    return toReminderResponse(row, row.time_slots);
  }

  async resume(
    id: string,
    actor: AuthenticatedActor,
  ): Promise<ReminderResponseDto> {
    const existing = await this.repository.findByIdWithSlots(id);
    if (!existing) {
      reminderNotFound();
    }
    this.assertCanAccess(existing.user_id, actor);
    if (existing.status !== 'PAUSED') {
      reminderInvalidStatusTransition();
    }

    const timeSlots = existing.time_slots.map((slot) => slot.local_time);
    const nextRunAt = computeNextRunAt({
      scheduleType: existing.schedule_type,
      timezone: existing.timezone,
      timeSlots,
      weeklyDays: existing.weekly_days,
      deadlineAt: existing.deadline_at,
      offsetDays: existing.offset_days,
    });

    const row = await this.repository.update(id, {
      status: 'ACTIVE',
      enabled: true,
      next_run_at: nextRunAt,
      consecutive_failures: 0,
    });
    if (!row) {
      reminderNotFound();
    }

    await this.audit.success({
      type: 'COMMUNICATION',
      action: 'reminder.resume',
      actorUserId: actor.userId,
      targetType: 'reminder',
      targetId: row.id,
    });

    return toReminderResponse(row, row.time_slots);
  }

  async cancel(
    id: string,
    dto: CancelReminderDto,
    actor: AuthenticatedActor,
  ): Promise<ReminderResponseDto> {
    const existing = await this.repository.findByIdWithSlots(id);
    if (!existing) {
      reminderNotFound();
    }
    this.assertCanAccess(existing.user_id, actor);
    if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED') {
      return toReminderResponse(existing, existing.time_slots);
    }

    const reason = dto.reason?.trim() || 'Annulé par l’utilisateur';
    const cancelled = await this.repository.cancelOne(id, reason);
    if (!cancelled) {
      reminderNotFound();
    }

    const slots = await this.repository.findSlotsByReminderId(id);

    await this.audit.success({
      type: 'COMMUNICATION',
      action: 'reminder.cancel',
      actorUserId: actor.userId,
      targetType: 'reminder',
      targetId: cancelled.id,
      metadata: { reason },
    });

    return toReminderResponse(cancelled, slots);
  }

  async syncResourceReminder(
    input: SyncResourceReminderInput,
  ): Promise<{ reminderId: string | null }> {
    const hasUser = Boolean(input.userId);
    const hasGuest = Boolean(input.guestEmail?.trim());
    if (hasUser === hasGuest) {
      reminderInvalidOwner();
    }

    if (!input.enabled) {
      const existing = await this.repository.findActiveByResourceOwner({
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        userId: input.userId,
        guestEmail: input.guestEmail,
      });
      if (existing) {
        await this.repository.cancelOne(
          existing.id,
          'Désactivé via synchronisation ressource',
        );
        await this.audit.success({
          type: 'COMMUNICATION',
          action: 'reminder.cancel',
          actorUserId: input.userId ?? null,
          targetType: 'reminder',
          targetId: existing.id,
          metadata: {
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            via: 'syncResourceReminder',
          },
        });
      }
      return { reminderId: null };
    }

    const jobs = getJobsConfig();
    let channels = [...input.channels] as NotificationChannel[];
    if (!hasUser) {
      channels = channels.filter((channel) => channel !== 'IN_APP');
    }
    if (channels.length === 0) {
      reminderInvalidSchedule('Au moins un canal de notification est requis');
    }

    this.assertLimits(channels, input.timeSlots, jobs);

    if (hasUser && input.userId) {
      const existingForUser = await this.repository.findActiveByResourceOwner({
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        userId: input.userId,
      });
      if (!existingForUser) {
        const activeCount = await this.repository.countActiveByUserId(
          input.userId,
        );
        if (activeCount >= jobs.reminderMaxActivePerUser) {
          reminderMaxActiveReached();
        }
      }
    }

    const schedule = this.normalizeSchedule({
      scheduleType: input.scheduleType,
      weeklyDays: input.weeklyDays ?? null,
      deadlineAt: input.deadlineAt ?? null,
      offsetDays: input.offsetDays ?? null,
      timeSlots: input.timeSlots,
      timezone: input.timezone?.trim() || DEFAULT_TIMEZONE,
      channels,
    });

    const nextRunAt = computeNextRunAt({
      scheduleType: schedule.scheduleType,
      timezone: schedule.timezone,
      timeSlots: schedule.timeSlots,
      weeklyDays: schedule.weeklyDays,
      deadlineAt: schedule.deadlineAt,
      offsetDays: schedule.offsetDays,
    });

    const existing = await this.repository.findActiveByResourceOwner({
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      userId: input.userId,
      guestEmail: input.guestEmail,
    });

    if (existing) {
      const updated = await this.repository.update(existing.id, {
        schedule_type: schedule.scheduleType,
        timezone: schedule.timezone,
        weekly_days: schedule.weeklyDays,
        deadline_at: schedule.deadlineAt,
        offset_days: schedule.offsetDays,
        channels: schedule.channels,
        status: 'ACTIVE',
        enabled: true,
        title: input.title.trim(),
        template_key: input.templateKey.trim(),
        metadata: input.metadata ?? null,
        next_run_at: nextRunAt,
        cancelled_at: null,
        cancel_reason: null,
        time_slots: schedule.timeSlots,
      });
      return { reminderId: updated?.id ?? existing.id };
    }

    const created = await this.repository.create({
      user_id: input.userId ?? null,
      guest_email: input.guestEmail?.trim().toLowerCase() || null,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      schedule_type: schedule.scheduleType,
      timezone: schedule.timezone,
      weekly_days: schedule.weeklyDays,
      deadline_at: schedule.deadlineAt,
      offset_days: schedule.offsetDays,
      channels: schedule.channels,
      status: 'ACTIVE',
      enabled: true,
      title: input.title.trim(),
      template_key: input.templateKey.trim(),
      metadata: input.metadata ?? null,
      next_run_at: nextRunAt,
      time_slots: schedule.timeSlots,
    });

    await this.audit.success({
      type: 'COMMUNICATION',
      action: 'reminder.create',
      actorUserId: input.userId ?? null,
      targetType: 'reminder',
      targetId: created.id,
      metadata: {
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        via: 'syncResourceReminder',
      },
    });

    return { reminderId: created.id };
  }

  async cancelResourceReminders(
    resourceType: string,
    resourceId: string,
    reason: string,
  ): Promise<void> {
    const cancelledCount = await this.repository.cancelByResource(
      resourceType,
      resourceId,
      reason,
    );

    if (cancelledCount > 0) {
      await this.audit.success({
        type: 'COMMUNICATION',
        action: 'reminder.cancel_by_resource',
        targetType: resourceType,
        targetId: resourceId,
        metadata: { reason, cancelledCount },
      });
    }
  }

  private assertLimits(
    channels: NotificationChannel[],
    timeSlots: string[],
    jobs: ReturnType<typeof getJobsConfig>,
  ): void {
    if (channels.length > jobs.reminderMaxChannels) {
      reminderMaxChannelsExceeded();
    }
    if (timeSlots.length > jobs.reminderMaxSlots) {
      reminderMaxSlotsExceeded();
    }
  }

  private normalizeSchedule(input: {
    scheduleType: ReminderScheduleType;
    weeklyDays: number[] | null;
    deadlineAt: Date | null;
    offsetDays: number[] | null;
    timeSlots: string[];
    timezone: string;
    channels: NotificationChannel[];
  }): {
    scheduleType: ReminderScheduleType;
    weeklyDays: number[] | null;
    deadlineAt: Date | null;
    offsetDays: number[] | null;
    timeSlots: string[];
    timezone: string;
    channels: NotificationChannel[];
  } {
    const timeSlots = [
      ...new Set(input.timeSlots.map((slot) => slot.trim())),
    ].sort((a, b) => a.localeCompare(b));

    if (timeSlots.length === 0) {
      reminderInvalidSchedule('Au moins un créneau horaire est requis');
    }

    if (input.channels.length === 0) {
      reminderInvalidSchedule('Au moins un canal de notification est requis');
    }

    switch (input.scheduleType) {
      case 'DAILY':
        return {
          ...input,
          weeklyDays: null,
          deadlineAt: null,
          offsetDays: null,
          timeSlots,
        };
      case 'WEEKLY': {
        const weeklyDays = [
          ...new Set(
            (input.weeklyDays ?? []).filter(
              (day) => Number.isInteger(day) && day >= 0 && day <= 6,
            ),
          ),
        ].sort((a, b) => a - b);
        if (weeklyDays.length === 0) {
          reminderInvalidSchedule(
            'Les jours de la semaine sont requis pour un rappel hebdomadaire',
          );
        }
        return {
          ...input,
          weeklyDays,
          deadlineAt: null,
          offsetDays: null,
          timeSlots,
        };
      }
      case 'DEADLINE_OFFSET': {
        if (!input.deadlineAt || Number.isNaN(input.deadlineAt.getTime())) {
          reminderInvalidSchedule(
            'Une date limite est requise pour un rappel à échéance',
          );
        }
        const offsetDays = [
          ...new Set(
            (input.offsetDays ?? []).filter(
              (day) => Number.isInteger(day) && day >= 0,
            ),
          ),
        ].sort((a, b) => b - a);
        if (offsetDays.length === 0) {
          reminderInvalidSchedule(
            'Les décalages (offsetDays) sont requis pour un rappel à échéance',
          );
        }
        return {
          ...input,
          weeklyDays: null,
          deadlineAt: input.deadlineAt,
          offsetDays,
          timeSlots,
        };
      }
      default:
        reminderInvalidSchedule();
    }
  }

  private assertCanAccess(
    ownerUserId: string | null,
    actor: AuthenticatedActor,
  ): void {
    const staffRoles = new Set(['SUPER_ADMIN', 'ADMIN']);
    if (staffRoles.has(actor.role)) {
      return;
    }
    if (!ownerUserId || ownerUserId !== actor.userId) {
      reminderForbidden();
    }
  }
}
