import { SetMetadata } from '@nestjs/common';

export const INVALIDATE_CACHE_KEY = 'invalidate_cache';

export const InvalidateCache = (...namespaces: string[]) =>
  SetMetadata(INVALIDATE_CACHE_KEY, namespaces);
