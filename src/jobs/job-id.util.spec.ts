import {
  notificationEmailJobId,
  notificationInAppJobId,
  reminderDispatchJobId,
} from './job-id.util';

describe('job-id.util', () => {
  it('builds dispatch job ids without colons', () => {
    const scheduledFor = new Date('2026-08-05T09:55:00.000Z');
    const jobId = reminderDispatchJobId(
      '550e8400-e29b-41d4-a716-446655440000',
      scheduledFor,
    );

    expect(jobId).toBe(
      `dispatch-550e8400-e29b-41d4-a716-446655440000-${scheduledFor.getTime()}`,
    );
    expect(jobId).not.toContain(':');
  });

  it('builds notification job ids without colons', () => {
    const deliveryId = '660e8400-e29b-41d4-a716-446655440001';

    expect(notificationEmailJobId(deliveryId)).toBe(`email-${deliveryId}`);
    expect(notificationInAppJobId(deliveryId)).toBe(`inapp-${deliveryId}`);
    expect(notificationEmailJobId(deliveryId)).not.toContain(':');
    expect(notificationInAppJobId(deliveryId)).not.toContain(':');
  });
});
