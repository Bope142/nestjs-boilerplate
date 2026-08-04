import { DateTime } from 'luxon';
import {
  computeNextRunAt,
  luxonWeekdayToStored,
  storedWeekdayToLuxon,
} from './reminder-schedule';

describe('reminder-schedule', () => {
  describe('weekday mapping', () => {
    it('maps stored Sunday(0) to Luxon Sunday(7)', () => {
      expect(storedWeekdayToLuxon(0)).toBe(7);
      expect(luxonWeekdayToStored(7)).toBe(0);
    });

    it('maps Monday–Saturday 1–6 both ways', () => {
      for (let day = 1; day <= 6; day += 1) {
        expect(storedWeekdayToLuxon(day)).toBe(day);
        expect(luxonWeekdayToStored(day)).toBe(day);
      }
    });
  });

  describe('computeNextRunAt DAILY', () => {
    it('returns the next slot later the same day', () => {
      const from = DateTime.fromISO('2026-07-26T08:00:00', {
        zone: 'Africa/Kinshasa',
      }).toUTC();

      const next = computeNextRunAt({
        scheduleType: 'DAILY',
        timezone: 'Africa/Kinshasa',
        timeSlots: ['09:00', '18:00'],
        from: from.toJSDate(),
      });

      expect(next).not.toBeNull();
      expect(
        DateTime.fromJSDate(next!).setZone('Africa/Kinshasa').toISO(),
      ).toBe('2026-07-26T09:00:00.000+01:00');
    });

    it('rolls to the next day when all slots passed', () => {
      const from = DateTime.fromISO('2026-07-26T19:00:00', {
        zone: 'Africa/Kinshasa',
      }).toUTC();

      const next = computeNextRunAt({
        scheduleType: 'DAILY',
        timezone: 'Africa/Kinshasa',
        timeSlots: ['09:00', '18:00'],
        from: from.toJSDate(),
      });

      expect(
        DateTime.fromJSDate(next!).setZone('Africa/Kinshasa').toISO(),
      ).toBe('2026-07-27T09:00:00.000+01:00');
    });
  });

  describe('computeNextRunAt WEEKLY', () => {
    it('skips to the next matching weekday (Sunday=0)', () => {
      // 2026-07-26 is Sunday in Kinshasa
      const from = DateTime.fromISO('2026-07-26T10:00:00', {
        zone: 'Africa/Kinshasa',
      }).toUTC();

      const next = computeNextRunAt({
        scheduleType: 'WEEKLY',
        timezone: 'Africa/Kinshasa',
        timeSlots: ['08:00'],
        weeklyDays: [1], // Monday
        from: from.toJSDate(),
      });

      expect(
        DateTime.fromJSDate(next!).setZone('Africa/Kinshasa').toISO(),
      ).toBe('2026-07-27T08:00:00.000+01:00');
    });

    it('uses a later slot on the same matching weekday', () => {
      const from = DateTime.fromISO('2026-07-27T07:00:00', {
        zone: 'Africa/Kinshasa',
      }).toUTC();

      const next = computeNextRunAt({
        scheduleType: 'WEEKLY',
        timezone: 'Africa/Kinshasa',
        timeSlots: ['08:00', '17:00'],
        weeklyDays: [1],
        from: from.toJSDate(),
      });

      expect(
        DateTime.fromJSDate(next!).setZone('Africa/Kinshasa').toISO(),
      ).toBe('2026-07-27T08:00:00.000+01:00');
    });
  });

  describe('computeNextRunAt DEADLINE_OFFSET', () => {
    it('returns the earliest future offset fire at the first slot', () => {
      const deadline = DateTime.fromISO('2026-08-10T23:59:00', {
        zone: 'Africa/Kinshasa',
      }).toJSDate();
      const from = DateTime.fromISO('2026-07-20T12:00:00', {
        zone: 'Africa/Kinshasa',
      }).toUTC();

      const next = computeNextRunAt({
        scheduleType: 'DEADLINE_OFFSET',
        timezone: 'Africa/Kinshasa',
        timeSlots: ['09:00', '18:00'],
        deadlineAt: deadline,
        offsetDays: [14, 7],
        from: from.toJSDate(),
      });

      // 14 days before Aug 10 = Jul 27 at first slot 09:00
      expect(
        DateTime.fromJSDate(next!).setZone('Africa/Kinshasa').toISO(),
      ).toBe('2026-07-27T09:00:00.000+01:00');
    });

    it('returns null when all offset fires are in the past', () => {
      const deadline = DateTime.fromISO('2026-08-10T23:59:00', {
        zone: 'Africa/Kinshasa',
      }).toJSDate();
      const from = DateTime.fromISO('2026-08-11T00:00:00', {
        zone: 'Africa/Kinshasa',
      }).toUTC();

      const next = computeNextRunAt({
        scheduleType: 'DEADLINE_OFFSET',
        timezone: 'Africa/Kinshasa',
        timeSlots: ['09:00'],
        deadlineAt: deadline,
        offsetDays: [14, 7],
        from: from.toJSDate(),
      });

      expect(next).toBeNull();
    });
  });
});
