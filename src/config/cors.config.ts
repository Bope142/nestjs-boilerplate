export type CorsConfig = {
  enabled: boolean;
  origins: string[];
  credentials: boolean;
  maxAge: number;
};

export function getCorsConfig(): CorsConfig {
  return {
    enabled: process.env.CORS_ENABLED?.toLowerCase() === 'true',
    origins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    credentials: process.env.CORS_CREDENTIALS?.toLowerCase() === 'true',
    maxAge: Number(process.env.CORS_MAX_AGE),
  };
}
