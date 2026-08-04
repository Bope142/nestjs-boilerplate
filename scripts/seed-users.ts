import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq, isNull } from 'drizzle-orm';
import { Pool } from 'pg';
import * as argon2 from 'argon2';
import { resolveDatabaseUrl } from '../src/database/database-url';
import * as schema from '../src/database/schema/schema';
import { users } from '../src/database/schema/tables/users';
import { authIdentities } from '../src/database/schema/tables/auth-identities';

loadEnv({ path: '.env', quiet: true });

type SeedUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'INTERNAL' | 'EXTERNAL';
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  emailVerified: boolean;
};

async function upsertUser(
  db: ReturnType<typeof drizzle<typeof schema>>,
  seed: SeedUser,
): Promise<void> {
  const email = seed.email.trim().toLowerCase();
  const passwordHash = await argon2.hash(seed.password, {
    type: argon2.argon2id,
  });

  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deleted_at)))
    .limit(1);

  let userId: string;

  if (existing[0]) {
    userId = existing[0].id;
    await db
      .update(users)
      .set({
        first_name: seed.firstName,
        last_name: seed.lastName,
        user_type: seed.userType,
        role: seed.role,
        status: 'ACTIVE',
        email_verified_at: seed.emailVerified
          ? (existing[0].email_verified_at ?? new Date())
          : existing[0].email_verified_at,
      })
      .where(eq(users.id, userId));
  } else {
    const created = await db
      .insert(users)
      .values({
        email,
        first_name: seed.firstName,
        last_name: seed.lastName,
        user_type: seed.userType,
        role: seed.role,
        status: 'ACTIVE',
        email_verified_at: seed.emailVerified ? new Date() : null,
      })
      .returning();
    userId = created[0].id;
  }

  const identity = await db
    .select()
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.user_id, userId),
        eq(authIdentities.provider, 'CREDENTIALS'),
      ),
    )
    .limit(1);

  if (identity[0]) {
    await db
      .update(authIdentities)
      .set({
        password_hash: passwordHash,
        provider_email: email,
      })
      .where(eq(authIdentities.id, identity[0].id));
  } else {
    await db.insert(authIdentities).values({
      user_id: userId,
      provider: 'CREDENTIALS',
      provider_email: email,
      password_hash: passwordHash,
    });
  }

  console.log(`Seeded user: ${email} (${seed.role})`);
}

function buildSeeds(): SeedUser[] {
  const seeds: SeedUser[] = [
    {
      email: process.env.SUPER_ADMIN_EMAIL!,
      password: process.env.SUPER_ADMIN_PASSWORD!,
      firstName: process.env.SUPER_ADMIN_FIRST_NAME!,
      lastName: process.env.SUPER_ADMIN_LAST_NAME!,
      userType: 'INTERNAL',
      role: 'SUPER_ADMIN',
      emailVerified: true,
    },
  ];

  const demoEmail = process.env.DEMO_USER_EMAIL?.trim();
  if (demoEmail) {
    seeds.push({
      email: demoEmail,
      password: process.env.DEMO_USER_PASSWORD ?? 'DemoUserPass1!',
      firstName: process.env.DEMO_USER_FIRST_NAME ?? 'Demo',
      lastName: process.env.DEMO_USER_LAST_NAME ?? 'User',
      userType: 'EXTERNAL',
      role: 'USER',
      emailVerified: true,
    });
  }

  return seeds;
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: resolveDatabaseUrl() });
  const db = drizzle(pool, { schema });

  try {
    for (const seed of buildSeeds()) {
      await upsertUser(db, seed);
    }
    console.log('Seed completed successfully (passwords not printed).');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed');
  console.error(error);
  process.exit(1);
});
