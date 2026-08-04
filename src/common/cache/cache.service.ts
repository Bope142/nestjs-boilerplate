import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'crypto';
import type Redis from 'ioredis';
import { getRedisConfig } from '../../config/redis.config';
import { REDIS_CLIENT } from './redis.constants';

export type BuildRouteCacheKeyInput = {
  namespace: string;
  method: string;
  path: string;
  userId?: string | null;
  query?: Record<string, unknown>;
  version: number;
};

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtlSeconds: number;
  private readonly cacheEnabled: boolean;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    const config = getRedisConfig();
    this.defaultTtlSeconds = config.defaultTtlSeconds;
    this.cacheEnabled = config.cacheEnabled;
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.redis.status !== 'end') {
        await this.redis.quit();
      }
    } catch {
      this.redis.disconnect();
    }
  }

  isEnabled(): boolean {
    return this.cacheEnabled;
  }

  buildRouteKey(input: BuildRouteCacheKeyInput): string {
    const queryHash = this.hashQuery(input.query);
    const userSegment = input.userId ? `user:${input.userId}` : 'user:anon';
    return [
      'route',
      `v${input.version}`,
      input.namespace,
      input.method.toUpperCase(),
      input.path,
      userSegment,
      `q:${queryHash}`,
    ].join(':');
  }

  async getNamespaceVersion(namespace: string): Promise<number> {
    if (!this.cacheEnabled) {
      return 0;
    }

    try {
      const raw = await this.redis.get(this.namespaceVersionKey(namespace));
      const parsed = raw == null ? 0 : Number(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (error) {
      this.warn('getNamespaceVersion', error);
      return 0;
    }
  }

  async bumpNamespace(namespace: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }

    try {
      await this.redis.incr(this.namespaceVersionKey(namespace));
    } catch (error) {
      this.warn('bumpNamespace', error);
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.cacheEnabled) {
      return undefined;
    }

    try {
      const raw = await this.redis.get(key);
      if (raw == null) {
        return undefined;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      this.warn('get', error);
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }

    const ttl =
      ttlSeconds != null && ttlSeconds > 0
        ? ttlSeconds
        : this.defaultTtlSeconds;

    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      this.warn('set', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      this.warn('del', error);
    }
  }

  private namespaceVersionKey(namespace: string): string {
    return `ns:${namespace}:v`;
  }

  private hashQuery(query?: Record<string, unknown>): string {
    if (!query || Object.keys(query).length === 0) {
      return 'empty';
    }

    const normalized: Record<string, string> = {};
    for (const key of Object.keys(query).sort()) {
      const value = query[key];
      if (value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        const parts = value
          .map((item) => this.stringifyQueryValue(item))
          .sort();
        normalized[key] = JSON.stringify(parts);
        continue;
      }
      normalized[key] = this.stringifyQueryValue(value);
    }

    return createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .slice(0, 16);
  }

  private stringifyQueryValue(value: unknown): string {
    if (value == null) {
      return '';
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value);
    }
    return JSON.stringify(value);
  }

  private warn(operation: string, error: unknown): void {
    this.logger.warn(
      `Cache ${operation} failed (fail-open): ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    );
  }
}
