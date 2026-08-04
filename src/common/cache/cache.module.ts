import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheService } from './cache.service';
import { CacheRouteInterceptor } from './interceptors/cache-route.interceptor';
import { InvalidateCacheInterceptor } from './interceptors/invalidate-cache.interceptor';
import { REDIS_CLIENT } from './redis.constants';
import { redisProvider } from './redis.provider';

@Global()
@Module({
  providers: [
    redisProvider,
    CacheService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheRouteInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: InvalidateCacheInterceptor,
    },
  ],
  exports: [CacheService, REDIS_CLIENT],
})
export class CacheModule {}
