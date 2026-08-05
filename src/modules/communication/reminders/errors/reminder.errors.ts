import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../../common/exceptions/domain.error';

export const ReminderErrorCodes = {
  NOT_FOUND: 'REMINDER_NOT_FOUND',
  FORBIDDEN: 'REMINDER_FORBIDDEN',
  MAX_ACTIVE_REACHED: 'REMINDER_MAX_ACTIVE_REACHED',
  MAX_SLOTS_EXCEEDED: 'REMINDER_MAX_SLOTS_EXCEEDED',
  MAX_CHANNELS_EXCEEDED: 'REMINDER_MAX_CHANNELS_EXCEEDED',
  INVALID_SCHEDULE: 'REMINDER_INVALID_SCHEDULE',
  INVALID_OWNER: 'REMINDER_INVALID_OWNER',
  INVALID_STATUS_TRANSITION: 'REMINDER_INVALID_STATUS_TRANSITION',
} as const;

export const NotificationErrorCodes = {
  IN_APP_NOT_FOUND: 'NOTIFICATION_IN_APP_NOT_FOUND',
} as const;

export function reminderNotFound(): never {
  throw new DomainError(ReminderErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
}

export function reminderForbidden(): never {
  throw new DomainError(ReminderErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
}

export function reminderMaxActiveReached(): never {
  throw new DomainError(
    ReminderErrorCodes.MAX_ACTIVE_REACHED,
    HttpStatus.CONFLICT,
  );
}

export function reminderMaxSlotsExceeded(): never {
  throw new DomainError(
    ReminderErrorCodes.MAX_SLOTS_EXCEEDED,
    HttpStatus.BAD_REQUEST,
  );
}

export function reminderMaxChannelsExceeded(): never {
  throw new DomainError(
    ReminderErrorCodes.MAX_CHANNELS_EXCEEDED,
    HttpStatus.BAD_REQUEST,
  );
}

export function reminderInvalidSchedule(options?: {
  args?: Record<string, unknown>;
}): never {
  throw new DomainError(
    ReminderErrorCodes.INVALID_SCHEDULE,
    HttpStatus.BAD_REQUEST,
    options,
  );
}

export function reminderInvalidOwner(): never {
  throw new DomainError(
    ReminderErrorCodes.INVALID_OWNER,
    HttpStatus.BAD_REQUEST,
  );
}

export function reminderInvalidStatusTransition(): never {
  throw new DomainError(
    ReminderErrorCodes.INVALID_STATUS_TRANSITION,
    HttpStatus.CONFLICT,
  );
}

export function inAppNotificationNotFound(): never {
  throw new DomainError(
    NotificationErrorCodes.IN_APP_NOT_FOUND,
    HttpStatus.NOT_FOUND,
  );
}
