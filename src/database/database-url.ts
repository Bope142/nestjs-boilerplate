import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env', quiet: true });

/**
 * Resolve the Postgres URL for the current NODE_ENV.
 * - production → DATABASE_URL_PROD
 * - test → DATABASE_URL_TEST
 * - otherwise → DATABASE_URL_DEV
 */
export function resolveDatabaseUrl(): string {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  let envKey: 'DATABASE_URL_PROD' | 'DATABASE_URL_TEST' | 'DATABASE_URL_DEV';
  if (nodeEnv === 'production') {
    envKey = 'DATABASE_URL_PROD';
  } else if (nodeEnv === 'test') {
    envKey = 'DATABASE_URL_TEST';
  } else {
    envKey = 'DATABASE_URL_DEV';
  }

  const url = process.env[envKey];

  if (!url) {
    throw new Error(
      `Missing ${envKey} for NODE_ENV=${nodeEnv}. Set it in .env (see .env.example).`,
    );
  }

  return url;
}
