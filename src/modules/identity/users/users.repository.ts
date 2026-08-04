import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type {
  UserRole,
  UserStatus,
  UserType,
} from '../../../database/schema/enums';
import { users } from '../../../database/schema/tables/users';
import type { DrizzleDB } from '../../../database/types/drizzle';
import type { CreateUserPayload, UpdateUserPayload } from './dto/user.payload';

export type UserRow = typeof users.$inferSelect;

type UserInsertValues = {
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  user_type: UserType;
  role: UserRole;
  status: UserStatus;
  email_verified_at: Date | null;
};

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private client(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }

  private toInsertValues(dto: CreateUserPayload): UserInsertValues {
    return {
      email: dto.email.trim().toLowerCase(),
      first_name: dto.firstName,
      last_name: dto.lastName,
      display_name: dto.displayName ?? null,
      avatar_url: dto.avatarUrl ?? null,
      phone: dto.phone ?? null,
      user_type: dto.userType,
      role: dto.role,
      status: dto.status,
      email_verified_at: dto.emailVerifiedAt ?? null,
    };
  }

  async findById(id: string, tx?: DrizzleDB): Promise<UserRow | null> {
    const rows = await this.client(tx)
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deleted_at)))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByEmail(email: string, tx?: DrizzleDB): Promise<UserRow | null> {
    const normalized = email.trim().toLowerCase();
    const rows = await this.client(tx)
      .select()
      .from(users)
      .where(and(eq(users.email, normalized), isNull(users.deleted_at)))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(dto: CreateUserPayload, tx?: DrizzleDB): Promise<UserRow> {
    const values = this.toInsertValues(dto);
    const rows = await this.client(tx).insert(users).values(values).returning();
    return rows[0];
  }

  async update(
    userId: string,
    dto: UpdateUserPayload,
    tx?: DrizzleDB,
  ): Promise<UserRow | null> {
    const patch: Partial<UserInsertValues> = {};

    if (dto.email !== undefined) {
      patch.email = dto.email.trim().toLowerCase();
    }
    if (dto.firstName !== undefined) {
      patch.first_name = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      patch.last_name = dto.lastName;
    }
    if (dto.displayName !== undefined) {
      patch.display_name = dto.displayName;
    }
    if (dto.avatarUrl !== undefined) {
      patch.avatar_url = dto.avatarUrl;
    }
    if (dto.phone !== undefined) {
      patch.phone = dto.phone;
    }
    if (dto.userType !== undefined) {
      patch.user_type = dto.userType;
    }
    if (dto.role !== undefined) {
      patch.role = dto.role;
    }
    if (dto.status !== undefined) {
      patch.status = dto.status;
    }
    if (dto.emailVerifiedAt !== undefined) {
      patch.email_verified_at = dto.emailVerifiedAt;
    }

    const rows = await this.client(tx)
      .update(users)
      .set(patch)
      .where(and(eq(users.id, userId), isNull(users.deleted_at)))
      .returning();
    return rows[0] ?? null;
  }

  async markEmailVerified(
    userId: string,
    verifiedAt: Date,
    tx?: DrizzleDB,
  ): Promise<UserRow | null> {
    return this.update(userId, { emailVerifiedAt: verifiedAt }, tx);
  }

  async touchLastLogin(
    userId: string,
    at: Date,
    tx?: DrizzleDB,
  ): Promise<void> {
    await this.client(tx)
      .update(users)
      .set({ last_login_at: at })
      .where(eq(users.id, userId));
  }
}
