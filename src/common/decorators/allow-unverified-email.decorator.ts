import { SetMetadata } from '@nestjs/common';

export const ALLOW_UNVERIFIED_EMAIL_KEY = 'allowUnverifiedEmail';

/** JWT routes that remain reachable before email verification (verify, retry, logout). */
export const AllowUnverifiedEmail = () =>
  SetMetadata(ALLOW_UNVERIFIED_EMAIL_KEY, true);
