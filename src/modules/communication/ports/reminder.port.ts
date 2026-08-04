export const REMINDER_PORT = Symbol('REMINDER_PORT');

export type SyncResourceReminderInput = {
  resourceType: 'GENERIC';
  resourceId: string;
  userId?: string | null;
  guestEmail?: string | null;
  enabled: boolean;
  scheduleType: 'DAILY' | 'WEEKLY' | 'DEADLINE_OFFSET';
  weeklyDays?: number[] | null;
  deadlineAt?: Date | null;
  offsetDays?: number[] | null;
  channels: Array<'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP'>;
  timeSlots: string[];
  timezone?: string;
  title: string;
  templateKey: string;
  metadata?: Record<string, unknown>;
};

export interface ReminderPort {
  syncResourceReminder(
    input: SyncResourceReminderInput,
  ): Promise<{ reminderId: string | null }>;
  cancelResourceReminders(
    resourceType: string,
    resourceId: string,
    reason: string,
  ): Promise<void>;
}
