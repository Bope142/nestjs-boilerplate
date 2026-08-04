export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  fromName: string;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
};

export function getMailConfig(): MailConfig {
  return {
    host: process.env.MAIL_HOST!,
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE?.toLowerCase() === 'true',
    user: process.env.MAIL_USER!,
    password: process.env.MAIL_PASSWORD!,
    from: process.env.MAIL_FROM!,
    fromName: process.env.MAIL_FROM_NAME!,
    retryAttempts: Number(process.env.EMAIL_RETRY_ATTEMPTS),
    retryDelayMs: Number(process.env.EMAIL_RETRY_DELAY),
    timeoutMs: Number(process.env.EMAIL_TIMEOUT),
  };
}
