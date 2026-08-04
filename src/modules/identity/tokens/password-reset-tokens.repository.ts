import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import { passwordResetTokens } from '../../../database/schema/tables/password-reset-tokens';
import type { DrizzleDB } from '../../../database/types/drizzle';

export type PasswordResetTokenRow = typeof passwordResetTokens.$inferSelect;

@Injectable()
export class PasswordResetTokensRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async create(
    input: {
      user_id: string;
      token_hash: string;
      expires_at: Date;
    },
    tx?: DrizzleDB,
  ): Promise<PasswordResetTokenRow> {
    const rows = await this.client(tx)
      .insert(passwordResetTokens)
      .values(input)
      .returning();
    return rows[0];
  }

  async findUnusedByHash(
    tokenHash: string,
    tx?: DrizzleDB,
  ): Promise<PasswordResetTokenRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token_hash, tokenHash),
          isNull(passwordResetTokens.used_at),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findActiveByUserId(
    userId: string,
    now: Date,
    tx?: DrizzleDB,
  ): Promise<PasswordResetTokenRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.user_id, userId),
          isNull(passwordResetTokens.used_at),
          gt(passwordResetTokens.expires_at, now),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async markUsed(id: string, usedAt: Date, tx?: DrizzleDB): Promise<void> {
    await this.client(tx)
      .update(passwordResetTokens)
      .set({ used_at: usedAt })
      .where(eq(passwordResetTokens.id, id));
  }
}
