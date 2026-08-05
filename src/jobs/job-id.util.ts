/**
 * BullMQ rejects custom job IDs that contain ":" (except legacy 3-segment repeatable ids).
 * Use hyphen-separated segments for idempotent enqueue keys.
 */
export function buildJobId(...segments: Array<string | number>): string {
  return segments.join('-');
}

export function reminderDispatchJobId(
  reminderId: string,
  scheduledFor: Date,
): string {
  return buildJobId('dispatch', reminderId, scheduledFor.getTime());
}

export function notificationEmailJobId(deliveryId: string): string {
  return buildJobId('email', deliveryId);
}

export function notificationInAppJobId(deliveryId: string): string {
  return buildJobId('inapp', deliveryId);
}
