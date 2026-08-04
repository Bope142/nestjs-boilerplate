import { DateTime } from 'luxon';
import type { ReminderScheduleType } from '../../../database/schema/enums';

export type ComputeNextRunAtInput = {
  scheduleType: ReminderScheduleType;
  timezone: string;
  timeSlots: string[];
  weeklyDays?: number[] | null;
  deadlineAt?: Date | null;
  offsetDays?: number[] | null;
  from?: Date;
};

const LOCAL_TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/**
 * Stored weekday: 0=Sunday … 6=Saturday.
 * Luxon weekday: 1=Monday … 7=Sunday.
 */
export function storedWeekdayToLuxon(stored: number): number {
  return stored === 0 ? 7 : stored;
}

export function luxonWeekdayToStored(luxonWeekday: number): number {
  return luxonWeekday === 7 ? 0 : luxonWeekday;
}

function parseLocalTime(slot: string): { hour: number; minute: number } | null {
  if (!LOCAL_TIME_RE.test(slot)) {
    return null;
  }
  const [hourText, minuteText] = slot.split(':');
  return { hour: Number(hourText), minute: Number(minuteText) };
}

function normalizeAndSortSlots(timeSlots: string[]): string[] {
  const unique = [
    ...new Set(
      timeSlots
        .map((slot) => slot.trim())
        .filter((slot) => LOCAL_TIME_RE.test(slot)),
    ),
  ];
  return unique.sort((a, b) => a.localeCompare(b));
}

function atLocalSlot(day: DateTime, slot: string): DateTime | null {
  const parsed = parseLocalTime(slot);
  if (!parsed) {
    return null;
  }
  return day.set({
    hour: parsed.hour,
    minute: parsed.minute,
    second: 0,
    millisecond: 0,
  });
}

function nextDailyRun(
  from: DateTime,
  timezone: string,
  slots: string[],
): Date | null {
  if (slots.length === 0) {
    return null;
  }

  const localFrom = from.setZone(timezone);
  if (!localFrom.isValid) {
    return null;
  }

  for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
    const day = localFrom.startOf('day').plus({ days: dayOffset });
    for (const slot of slots) {
      const candidate = atLocalSlot(day, slot);
      if (candidate && candidate > localFrom) {
        return candidate.toUTC().toJSDate();
      }
    }
  }

  return null;
}

function nextWeeklyRun(
  from: DateTime,
  timezone: string,
  slots: string[],
  weeklyDays: number[],
): Date | null {
  if (slots.length === 0 || weeklyDays.length === 0) {
    return null;
  }

  const allowed = new Set(
    weeklyDays
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      .map(storedWeekdayToLuxon),
  );
  if (allowed.size === 0) {
    return null;
  }

  const localFrom = from.setZone(timezone);
  if (!localFrom.isValid) {
    return null;
  }

  for (let dayOffset = 0; dayOffset <= 14; dayOffset += 1) {
    const day = localFrom.startOf('day').plus({ days: dayOffset });
    if (!allowed.has(day.weekday)) {
      continue;
    }
    for (const slot of slots) {
      const candidate = atLocalSlot(day, slot);
      if (candidate && candidate > localFrom) {
        return candidate.toUTC().toJSDate();
      }
    }
  }

  return null;
}

function nextDeadlineOffsetRun(
  from: DateTime,
  timezone: string,
  slots: string[],
  deadlineAt: Date,
  offsetDays: number[],
): Date | null {
  if (slots.length === 0 || offsetDays.length === 0) {
    return null;
  }

  const firstSlot = slots[0];
  const deadlineLocal = DateTime.fromJSDate(deadlineAt, {
    zone: 'utc',
  }).setZone(timezone);
  if (!deadlineLocal.isValid) {
    return null;
  }

  const candidates: DateTime[] = [];
  for (const offset of offsetDays) {
    if (!Number.isInteger(offset) || offset < 0) {
      continue;
    }
    const day = deadlineLocal.startOf('day').minus({ days: offset });
    const candidate = atLocalSlot(day, firstSlot);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  const future = candidates
    .filter((candidate) => candidate > from.setZone(timezone))
    .sort((a, b) => a.toMillis() - b.toMillis());

  return future[0]?.toUTC().toJSDate() ?? null;
}

/**
 * Computes the next UTC run instant after `from` (default now).
 * Returns null when no future occurrence exists.
 */
export function computeNextRunAt(input: ComputeNextRunAtInput): Date | null {
  const from = DateTime.fromJSDate(input.from ?? new Date(), { zone: 'utc' });
  if (!from.isValid) {
    return null;
  }

  const slots = normalizeAndSortSlots(input.timeSlots);
  if (slots.length === 0) {
    return null;
  }

  switch (input.scheduleType) {
    case 'DAILY':
      return nextDailyRun(from, input.timezone, slots);
    case 'WEEKLY':
      return nextWeeklyRun(from, input.timezone, slots, input.weeklyDays ?? []);
    case 'DEADLINE_OFFSET':
      if (!input.deadlineAt) {
        return null;
      }
      return nextDeadlineOffsetRun(
        from,
        input.timezone,
        slots,
        input.deadlineAt,
        input.offsetDays ?? [],
      );
    default:
      return null;
  }
}
