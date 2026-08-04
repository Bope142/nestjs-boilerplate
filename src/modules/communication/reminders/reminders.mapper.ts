import type { NotificationChannel } from '../../../database/schema/enums';
import { reminderTimeSlots } from '../../../database/schema/tables/reminder-time-slots';
import { reminders } from '../../../database/schema/tables/reminders';
import type { ReminderResponseDto } from './dto/reminder-response.dto';

export type ReminderRow = typeof reminders.$inferSelect;
export type ReminderTimeSlotRow = typeof reminderTimeSlots.$inferSelect;

export type ReminderWithSlots = ReminderRow & {
  time_slots: ReminderTimeSlotRow[];
};

export function toReminderResponse(
  row: ReminderRow,
  slots: ReminderTimeSlotRow[] = [],
): ReminderResponseDto {
  const sortedSlots = [...slots].sort(
    (a, b) =>
      a.sort_order - b.sort_order || a.local_time.localeCompare(b.local_time),
  );

  return {
    id: row.id,
    userId: row.user_id,
    guestEmail: row.guest_email,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    scheduleType: row.schedule_type,
    timezone: row.timezone,
    weeklyDays: row.weekly_days,
    deadlineAt: row.deadline_at?.toISOString() ?? null,
    offsetDays: row.offset_days,
    channels: row.channels as NotificationChannel[],
    status: row.status,
    enabled: row.enabled,
    title: row.title,
    templateKey: row.template_key,
    metadata: row.metadata ?? null,
    timeSlots: sortedSlots.map((slot) => slot.local_time),
    nextRunAt: row.next_run_at?.toISOString() ?? null,
    lastEnqueuedAt: row.last_enqueued_at?.toISOString() ?? null,
    consecutiveFailures: row.consecutive_failures,
    cancelledAt: row.cancelled_at?.toISOString() ?? null,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
