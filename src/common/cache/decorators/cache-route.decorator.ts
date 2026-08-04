import { SetMetadata } from '@nestjs/common';

export const CACHE_ROUTE_KEY = 'cache_route';

export type CacheRouteOptions = {
  namespace: string;
  ttl?: number;
};

export const CacheRoute = (options: CacheRouteOptions) =>
  SetMetadata(CACHE_ROUTE_KEY, options);
