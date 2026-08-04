import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env', quiet: true });

export function resolveDatabaseUrl(): string {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProd = nodeEnv === 'production';
  const envKey = isProd ? 'DATABASE_URL_PROD' : 'DATABASE_URL_DEV';
  const url = process.env[envKey];

  if (!url) {
    throw new Error(
      `Missing ${envKey} for NODE_ENV=${nodeEnv}. Set it in .env (see .env.example).`,
    );
  }

  return url;
}
