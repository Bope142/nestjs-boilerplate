import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type {
  AuthMethod,
  SessionRevocationReason,
} from '../../../database/schema/enums';
import { authSessions } from '../../../database/schema/tables/auth-sessions';
import type { DrizzleDB } from '../../../database/types/drizzle';

export type AuthSessionRow = typeof authSessions.$inferSelect;

/** Persistence create payload — fields aligned with auth_sessions insert. */
export type CreateAuthSessionInput = {
  id?: string;
  user_id: string;
  auth_method: AuthMethod;
  refresh_token_hash: string;
  ip_address: string;
  user_agent: string;
  expires_at: Date;
};

@Injectable()
export class SessionsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async create(
    input: CreateAuthSessionInput,
    tx?: DrizzleDB,
  ): Promise<AuthSessionRow> {
    const rows = await this.client(tx)
      .insert(authSessions)
      .values({
        ...(input.id ? { id: input.id } : {}),
        user_id: input.user_id,
        auth_method: input.auth_method,
        refresh_token_hash: input.refresh_token_hash,
        ip_address: input.ip_address,
        user_agent: input.user_agent,
        expires_at: input.expires_at,
      })
      .returning();
    return rows[0];
  }

  async findActiveByRefreshHash(
    refreshTokenHash: string,
    tx?: DrizzleDB,
  ): Promise<AuthSessionRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.refresh_token_hash, refreshTokenHash),
          isNull(authSessions.revoked_at),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findById(id: string, tx?: DrizzleDB): Promise<AuthSessionRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(authSessions)
      .where(eq(authSessions.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByRefreshHashIncludingRevoked(
    refreshTokenHash: string,
    tx?: DrizzleDB,
  ): Promise<AuthSessionRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(authSessions)
      .where(eq(authSessions.refresh_token_hash, refreshTokenHash))
      .limit(1);
    return rows[0] ?? null;
  }

  async rotateRefreshToken(
    sessionId: string,
    newHash: string,
    expiresAt: Date,
    tx?: DrizzleDB,
  ): Promise<AuthSessionRow | null> {
    const rows = await this.client(tx)
      .update(authSessions)
      .set({
        refresh_token_hash: newHash,
        expires_at: expiresAt,
        last_activity_at: new Date(),
      })
      .where(
        and(eq(authSessions.id, sessionId), isNull(authSessions.revoked_at)),
      )
      .returning();
    return rows[0] ?? null;
  }

  async revoke(
    sessionId: string,
    reason: SessionRevocationReason,
    tx?: DrizzleDB,
  ): Promise<void> {
    await this.client(tx)
      .update(authSessions)
      .set({
        revoked_at: new Date(),
        revoked_reason: reason,
      })
      .where(
        and(eq(authSessions.id, sessionId), isNull(authSessions.revoked_at)),
      );
  }

  async revokeAllForUser(
    userId: string,
    reason: SessionRevocationReason,
    tx?: DrizzleDB,
  ): Promise<number> {
    const rows = await this.client(tx)
      .update(authSessions)
      .set({
        revoked_at: new Date(),
        revoked_reason: reason,
      })
      .where(
        and(eq(authSessions.user_id, userId), isNull(authSessions.revoked_at)),
      )
      .returning({ id: authSessions.id });
    return rows.length;
  }
}
