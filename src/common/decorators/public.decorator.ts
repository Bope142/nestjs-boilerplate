import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skip JWT authentication (API key may still be required). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
