export type JobsConfig = {
  enabled: boolean;
  queueDb: number;
  reminderMaxActivePerUser: number;
  reminderMaxSlots: number;
  reminderMaxChannels: number;
  reminderSchedulerIntervalMs: number;
  reminderSchedulerBatchSize: number;
  reminderDispatchConcurrency: number;
  notificationEmailConcurrency: number;
  notificationInAppConcurrency: number;
  notificationEmailMaxPerSecond: number;
  jobAttempts: number;
  jobBackoffMs: number;
};

function positiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getJobsConfig(): JobsConfig {
  return {
    enabled: (process.env.JOBS_ENABLED ?? 'true').toLowerCase() === 'true',
    queueDb: positiveInt(process.env.REDIS_QUEUE_DB, 1),
    reminderMaxActivePerUser: positiveInt(
      process.env.REMINDER_MAX_ACTIVE_PER_USER,
      25,
    ),
    reminderMaxSlots: positiveInt(process.env.REMINDER_MAX_SLOTS, 5),
    reminderMaxChannels: positiveInt(process.env.REMINDER_MAX_CHANNELS, 2),
    reminderSchedulerIntervalMs: positiveInt(
      process.env.REMINDER_SCHEDULER_INTERVAL_MS,
      60_000,
    ),
    reminderSchedulerBatchSize: positiveInt(
      process.env.REMINDER_SCHEDULER_BATCH_SIZE,
      100,
    ),
    reminderDispatchConcurrency: positiveInt(
      process.env.REMINDER_DISPATCH_CONCURRENCY,
      5,
    ),
    notificationEmailConcurrency: positiveInt(
      process.env.NOTIFICATION_EMAIL_CONCURRENCY,
      3,
    ),
    notificationInAppConcurrency: positiveInt(
      process.env.NOTIFICATION_IN_APP_CONCURRENCY,
      10,
    ),
    notificationEmailMaxPerSecond: positiveInt(
      process.env.NOTIFICATION_EMAIL_MAX_PER_SECOND,
      10,
    ),
    jobAttempts: positiveInt(process.env.JOB_ATTEMPTS, 5),
    jobBackoffMs: positiveInt(process.env.JOB_BACKOFF_MS, 30_000),
  };
}
