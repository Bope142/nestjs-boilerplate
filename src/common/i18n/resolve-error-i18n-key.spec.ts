import {
  resolveErrorI18nKey,
  resolveErrorModule,
} from './resolve-error-i18n-key';

describe('resolveErrorModule', () => {
  it('maps known prefixes to feature modules', () => {
    expect(resolveErrorModule('AUTH_INVALID_CREDENTIALS')).toBe('auth');
    expect(resolveErrorModule('USER_NOT_FOUND')).toBe('users');
    expect(resolveErrorModule('REMINDER_NOT_FOUND')).toBe('reminders');
    expect(resolveErrorModule('NOTIFICATION_IN_APP_NOT_FOUND')).toBe(
      'notifications',
    );
    expect(resolveErrorModule('COMMON_INVALID_API_KEY')).toBe('common');
  });

  it('falls back to common for unknown prefixes', () => {
    expect(resolveErrorModule('SOMETHING_ELSE')).toBe('common');
    expect(resolveErrorModule('VALIDATION_ERROR')).toBe('common');
  });
});

describe('resolveErrorI18nKey', () => {
  it('builds nestjs-i18n nested keys', () => {
    expect(resolveErrorI18nKey('AUTH_INVALID_CREDENTIALS')).toBe(
      'errors.auth.AUTH_INVALID_CREDENTIALS',
    );
    expect(resolveErrorI18nKey('REMINDER_FORBIDDEN')).toBe(
      'errors.reminders.REMINDER_FORBIDDEN',
    );
    expect(resolveErrorI18nKey('COMMON_INVALID_API_KEY')).toBe(
      'errors.common.COMMON_INVALID_API_KEY',
    );
  });
});
