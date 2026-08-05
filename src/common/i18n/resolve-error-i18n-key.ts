const PREFIX_TO_MODULE: Array<{ prefix: string; module: string }> = [
  { prefix: 'AUTH_', module: 'auth' },
  { prefix: 'USER_', module: 'users' },
  { prefix: 'REMINDER_', module: 'reminders' },
  { prefix: 'NOTIFICATION_', module: 'notifications' },
  { prefix: 'COMMON_', module: 'common' },
];

/**
 * Maps a stable error code prefix to the nestjs-i18n errors subfolder name.
 */
export function resolveErrorModule(code: string): string {
  for (const entry of PREFIX_TO_MODULE) {
    if (code.startsWith(entry.prefix)) {
      return entry.module;
    }
  }
  return 'common';
}

/**
 * Builds the nestjs-i18n key for a domain error code.
 * Example: AUTH_INVALID_CREDENTIALS → errors.auth.AUTH_INVALID_CREDENTIALS
 */
export function resolveErrorI18nKey(code: string): string {
  return `errors.${resolveErrorModule(code)}.${code}`;
}
