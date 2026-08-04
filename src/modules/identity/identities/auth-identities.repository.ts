import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { AuthProvider } from '../../../database/schema/enums';
import { authIdentities } from '../../../database/schema/tables/auth-identities';
import type { DrizzleDB } from '../../../database/types/drizzle';

export type AuthIdentityRow = typeof authIdentities.$inferSelect;

@Injectable()
export class AuthIdentitiesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  async findByUserAndProvider(
    userId: string,
    provider: AuthProvider,
    tx?: DrizzleDB,
  ): Promise<AuthIdentityRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.user_id, userId),
          eq(authIdentities.provider, provider),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findByProviderSubject(
    provider: AuthProvider,
    providerSubject: string,
    tx?: DrizzleDB,
  ): Promise<AuthIdentityRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.provider_subject, providerSubject),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async createCredentialsIdentity(
    input: {
      user_id: string;
      password_hash: string;
      provider_email: string;
    },
    tx?: DrizzleDB,
  ): Promise<AuthIdentityRow> {
    const rows = await this.client(tx)
      .insert(authIdentities)
      .values({
        user_id: input.user_id,
        provider: 'CREDENTIALS',
        provider_email: input.provider_email,
        password_hash: input.password_hash,
        provider_subject: null,
      })
      .returning();
    return rows[0];
  }

  async createGoogleIdentity(
    input: {
      user_id: string;
      provider_subject: string;
      provider_email: string;
    },
    tx?: DrizzleDB,
  ): Promise<AuthIdentityRow> {
    const rows = await this.client(tx)
      .insert(authIdentities)
      .values({
        user_id: input.user_id,
        provider: 'GOOGLE',
        provider_subject: input.provider_subject,
        provider_email: input.provider_email,
        password_hash: null,
      })
      .returning();
    return rows[0];
  }

  async touchLastUsed(
    identityId: string,
    at: Date,
    tx?: DrizzleDB,
  ): Promise<void> {
    await this.client(tx)
      .update(authIdentities)
      .set({ last_used_at: at })
      .where(eq(authIdentities.id, identityId));
  }

  async updatePasswordHash(
    identityId: string,
    passwordHash: string,
    tx?: DrizzleDB,
  ): Promise<void> {
    await this.client(tx)
      .update(authIdentities)
      .set({ password_hash: passwordHash })
      .where(eq(authIdentities.id, identityId));
  }
}
