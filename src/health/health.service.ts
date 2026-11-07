import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/types/drizzle';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

export type HealthStatus = 'ok' | 'degraded' | 'error';

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  checks: {
    postgres: { status: 'up' | 'down'; latencyMs?: number; error?: string };
    redis: {
      status: 'up' | 'down' | 'skipped';
      latencyMs?: number;
      error?: string;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const postgres = await this.checkPostgres();
    const redis = await this.checkRedis();

    let status: HealthStatus = 'ok';
    if (postgres.status === 'down') status = 'error';
    else if (redis.status === 'down') status = 'degraded';

    return { status, timestamp, checks: { postgres, redis } };
  }

  private async checkPostgres(): Promise<
    HealthCheckResult['checks']['postgres']
  > {
    const started = Date.now();
    try {
      await this.db.execute(sql`select 1`);
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Postgres health check failed: ${message}`);
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        error: message,
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult['checks']['redis']> {
    if (!this.redis) {
      return { status: 'skipped' };
    }
    const started = Date.now();
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        return {
          status: 'down',
          latencyMs: Date.now() - started,
          error: `Unexpected PING response: ${String(pong)}`,
        };
      }
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis health check failed: ${message}`);
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        error: message,
      };
    }
  }
}
