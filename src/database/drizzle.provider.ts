import { Injectable, OnModuleDestroy, Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { resolveDatabaseUrl } from './database-url';
import * as schema from './schema/schema';
import type { DrizzleDB } from './types/drizzle';

export const DRIZZLE = Symbol('DRIZZLE');

@Injectable()
export class DrizzleClient implements OnModuleDestroy {
  readonly db: DrizzleDB;
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: resolveDatabaseUrl(),
    });
    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  useFactory: (client: DrizzleClient): DrizzleDB => client.db,
  inject: [DrizzleClient],
};
