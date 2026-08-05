import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../common/exceptions/domain.error';

export const AuthErrorCodes = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  EMAIL_ALREADY_REGISTERED: 'AUTH_EMAIL_ALREADY_REGISTERED',
  INVALID_OR_EXPIRED_TOKEN: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
  INVALID_OR_EXPIRED_RESET_TOKEN: 'AUTH_INVALID_OR_EXPIRED_RESET_TOKEN',
  INVALID_MAGIC_LINK_TOKEN: 'AUTH_INVALID_MAGIC_LINK_TOKEN',
  INVALID_EMAIL_VERIFICATION_TOKEN: 'AUTH_INVALID_EMAIL_VERIFICATION_TOKEN',
  INVALID_REFRESH_TOKEN: 'AUTH_INVALID_REFRESH_TOKEN',
  INVALID_ACCESS_TOKEN: 'AUTH_INVALID_ACCESS_TOKEN',
  USER_INACTIVE: 'AUTH_USER_INACTIVE',
  SESSION_INVALID: 'AUTH_SESSION_INVALID',
  INVALID_TOKEN_ENVELOPE: 'AUTH_INVALID_TOKEN_ENVELOPE',
  INVALID_GOOGLE_TOKEN: 'AUTH_INVALID_GOOGLE_TOKEN',
  PASSWORD_CHANGE_UNAVAILABLE: 'AUTH_PASSWORD_CHANGE_UNAVAILABLE',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  INSUFFICIENT_ROLE: 'AUTH_INSUFFICIENT_ROLE',
} as const;

export type AuthErrorCode =
  (typeof AuthErrorCodes)[keyof typeof AuthErrorCodes];

export function invalidCredentials(): never {
  throw new DomainError(
    AuthErrorCodes.INVALID_CREDENTIALS,
    HttpStatus.UNAUTHORIZED,
  );
}

export function emailNotVerified(): never {
  throw new DomainError(
    AuthErrorCodes.EMAIL_NOT_VERIFIED,
    HttpStatus.FORBIDDEN,
  );
}

export function emailAlreadyRegistered(): never {
  throw new DomainError(
    AuthErrorCodes.EMAIL_ALREADY_REGISTERED,
    HttpStatus.CONFLICT,
  );
}

export function invalidOrExpiredToken(
  code: AuthErrorCode = AuthErrorCodes.INVALID_OR_EXPIRED_TOKEN,
): never {
  throw new DomainError(code, HttpStatus.UNAUTHORIZED);
}

export function invalidRefreshToken(): never {
  throw new DomainError(
    AuthErrorCodes.INVALID_REFRESH_TOKEN,
    HttpStatus.UNAUTHORIZED,
  );
}
