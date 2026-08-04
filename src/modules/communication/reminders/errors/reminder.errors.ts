import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export function reminderNotFound(): never {
  throw new NotFoundException({
    code: 'REMINDER_NOT_FOUND',
    message: 'Rappel introuvable',
  });
}

export function reminderForbidden(): never {
  throw new ForbiddenException({
    code: 'REMINDER_FORBIDDEN',
    message: 'Accès non autorisé à ce rappel',
  });
}

export function reminderMaxActiveReached(): never {
  throw new ConflictException({
    code: 'REMINDER_MAX_ACTIVE_REACHED',
    message: 'Nombre maximum de rappels actifs atteint pour cet utilisateur',
  });
}

export function reminderMaxSlotsExceeded(): never {
  throw new BadRequestException({
    code: 'REMINDER_MAX_SLOTS_EXCEEDED',
    message: 'Nombre maximum de créneaux horaires dépassé',
  });
}

export function reminderMaxChannelsExceeded(): never {
  throw new BadRequestException({
    code: 'REMINDER_MAX_CHANNELS_EXCEEDED',
    message: 'Nombre maximum de canaux dépassé',
  });
}

export function reminderInvalidSchedule(message?: string): never {
  throw new BadRequestException({
    code: 'REMINDER_INVALID_SCHEDULE',
    message: message ?? 'Configuration de planification du rappel invalide',
  });
}

export function reminderInvalidOwner(): never {
  throw new BadRequestException({
    code: 'REMINDER_INVALID_OWNER',
    message:
      'Un rappel doit appartenir soit à un utilisateur, soit à un e-mail invité',
  });
}

export function reminderInvalidStatusTransition(): never {
  throw new ConflictException({
    code: 'REMINDER_INVALID_STATUS_TRANSITION',
    message: 'Transition de statut du rappel non autorisée',
  });
}

export function inAppNotificationNotFound(): never {
  throw new NotFoundException({
    code: 'IN_APP_NOTIFICATION_NOT_FOUND',
    message: 'Notification introuvable',
  });
}
