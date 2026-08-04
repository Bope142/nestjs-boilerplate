import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { defineTable } from '../define-table';
import { userRoleEnum } from '../enums/user-role.enum';
import { userStatusEnum } from '../enums/user-status.enum';
import { userTypeEnum } from '../enums/user-type.enum';

export const users = defineTable(
  pgTable(
    'users',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      user_type: userTypeEnum('user_type').notNull(),
      role: userRoleEnum('role').notNull(),
      email: text('email').notNull(),
      first_name: text('first_name').notNull(),
      last_name: text('last_name').notNull(),
      display_name: text('display_name'),
      avatar_url: text('avatar_url'),
      phone: text('phone').unique(),
      status: userStatusEnum('status').notNull(),
      email_verified_at: timestamp('email_verified_at', { withTimezone: true }),
      last_login_at: timestamp('last_login_at', { withTimezone: true }),
      locale: text('locale').notNull().default('en'),
      timezone: text('timezone').notNull().default('UTC'),
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      updated_at: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
      deleted_at: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
      uniqueIndex('users_email_uq')
        .on(table.email)
        .where(sql`${table.deleted_at} IS NULL`),
      index('users_role_idx').on(table.role),
      index('users_user_type_idx').on(table.user_type),
      check(
        'users_type_role_chk',
        sql`(
          (${table.user_type} = 'EXTERNAL' AND ${table.role} = 'USER')
          OR
          (${table.user_type} = 'INTERNAL' AND ${table.role} <> 'USER')
        )`,
      ),
    ],
  ),
);
