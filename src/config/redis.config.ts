export type RedisConfig = {
  host: string;
  port: number;
  password: string | undefined;
  db: number;
  keyPrefix: string;
  defaultTtlSeconds: number;
  cacheEnabled: boolean;
};

export function getRedisConfig(): RedisConfig {
  const password = process.env.REDIS_PASSWORD?.trim();
  return {
    host: process.env.REDIS_HOST!,
    port: Number(process.env.REDIS_PORT),
    password: password && password.length > 0 ? password : undefined,
    db: Number(process.env.REDIS_DB ?? '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX?.trim() || 'app:',
    defaultTtlSeconds: Number(process.env.REDIS_TTL),
    cacheEnabled:
      (process.env.CACHE_ENABLED ?? 'true').toLowerCase() === 'true',
  };
}
