import type { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisConfig } from '../../config/redis.config';
import { REDIS_CLIENT } from './redis.constants';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (): Redis => {
    const config = getRedisConfig();
    const client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });

    client.on('error', () => {
      // Fail-open: connection errors must never crash the process.
    });

    void client.connect().catch(() => {
      // Fail-open on startup if Redis is unavailable.
    });

    return client;
  },
};
