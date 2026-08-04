export type ThrottleConfig = {
  ttlMs: number;
  limit: number;
};

export function getThrottleConfig(): ThrottleConfig {
  return {
    ttlMs: Number(process.env.THROTTLE_TTL_MS ?? '60000'),
    limit: Number(process.env.THROTTLE_LIMIT ?? '100'),
  };
}
