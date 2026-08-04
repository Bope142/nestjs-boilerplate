import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import { magicLinkTokens } from '../../../database/schema/tables/magic-link-tokens';
import type { DrizzleDB } from '../../../database/types/drizzle';

export type MagicLinkTokenRow = typeof magicLinkTokens.$inferSelect;

@Injectable()
export class MagicLinkTokensRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async create(
    input: { user_id: string; token_hash: string; expires_at: Date },
    tx?: DrizzleDB,
  ): Promise<MagicLinkTokenRow> {
    const rows = await this.client(tx)
      .insert(magicLinkTokens)
      .values(input)
      .returning();
    return rows[0];
  }

  async findUnusedByHash(
    tokenHash: string,
    tx?: DrizzleDB,
  ): Promise<MagicLinkTokenRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.token_hash, tokenHash),
          isNull(magicLinkTokens.used_at),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async markUsed(id: string, usedAt: Date, tx?: DrizzleDB): Promise<void> {
    await this.client(tx)
      .update(magicLinkTokens)
      .set({ used_at: usedAt })
      .where(eq(magicLinkTokens.id, id));
  }
}
