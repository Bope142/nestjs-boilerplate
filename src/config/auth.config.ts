export type AuthConfig = {
  jwtSecret: string;
  refreshJwtSecret: string;
  tokenEncryptionKey: string;
  jwtExpiresIn: string;
  refreshJwtExpiresIn: string;
  apiAccessKey: string;
  googleClientId: string;
  frontendBaseUrl: string;
  sessionCleanupDays: number;
  emailVerificationTtlMinutes: number;
  magicLinkTtlMinutes: number;
  passwordResetTtlMinutes: number;
};

export function getAuthConfig(): AuthConfig {
  return {
    jwtSecret: process.env.JWT_SECRET!,
    refreshJwtSecret: process.env.REFRESH_JWT_SECRET!,
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN!,
    refreshJwtExpiresIn: process.env.REFRESH_JWT_EXPIRES_IN!,
    apiAccessKey: process.env.API_ACCESS_KEY!,
    googleClientId: process.env.GOOGLE_CLIENT_ID!,
    frontendBaseUrl: process.env.FRONTEND_BASE_URL!.replace(/\/$/, ''),
    sessionCleanupDays: Number(process.env.SESSION_CLEANUP_DAYS),
    emailVerificationTtlMinutes: 10,
    magicLinkTtlMinutes: 15,
    passwordResetTtlMinutes: 60,
  };
}
