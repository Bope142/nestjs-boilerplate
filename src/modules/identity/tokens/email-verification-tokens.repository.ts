import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import { emailVerificationTokens } from '../../../database/schema/tables/email-verification-tokens';
import type { DrizzleDB } from '../../../database/types/drizzle';

export type EmailVerificationTokenRow =
  typeof emailVerificationTokens.$inferSelect;

@Injectable()
export class EmailVerificationTokensRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async create(
    input: {
      user_id: string;
      token_hash: string;
      otp_hash: string;
      expires_at: Date;
    },
    tx?: DrizzleDB,
  ): Promise<EmailVerificationTokenRow> {
    const rows = await this.client(tx)
      .insert(emailVerificationTokens)
      .values(input)
      .returning();
    return rows[0];
  }

  async findUnusedByHash(
    tokenHash: string,
    tx?: DrizzleDB,
  ): Promise<EmailVerificationTokenRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token_hash, tokenHash),
          isNull(emailVerificationTokens.verified_at),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findUnusedByOtpHash(
    otpHash: string,
    tx?: DrizzleDB,
  ): Promise<EmailVerificationTokenRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.otp_hash, otpHash),
          isNull(emailVerificationTokens.verified_at),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findActiveByUserId(
    userId: string,
    now: Date,
    tx?: DrizzleDB,
  ): Promise<EmailVerificationTokenRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.user_id, userId),
          isNull(emailVerificationTokens.verified_at),
          gt(emailVerificationTokens.expires_at, now),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async markVerified(
    id: string,
    verifiedAt: Date,
    tx?: DrizzleDB,
  ): Promise<void> {
    await this.client(tx)
      .update(emailVerificationTokens)
      .set({ verified_at: verifiedAt })
      .where(eq(emailVerificationTokens.id, id));
  }
}
