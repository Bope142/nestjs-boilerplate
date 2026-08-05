import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { AuditService } from '../../common/audit/audit.service';
import { getJobsConfig } from '../../config/jobs.config';
import type { NotificationChannel } from '../../database/schema/enums';
import { IMPLEMENTED_NOTIFICATION_CHANNELS } from '../../database/schema/enums/notification-channel.enum';
import { DeliveriesRepository } from '../../modules/communication/deliveries/deliveries.repository';
import { ReminderEligibilityRegistry } from '../../modules/communication/ports/reminder-eligibility.port';
import { PreferencesRepository } from '../../modules/communication/preferences/preferences.repository';
import { RemindersRepository } from '../../modules/communication/reminders/reminders.repository';
import { notificationEmailJobId, notificationInAppJobId } from '../job-id.util';
import {
  JOB_NOTIFICATION_EMAIL,
  JOB_NOTIFICATION_IN_APP,
  JOB_REMINDER_DISPATCH,
  QUEUE_NOTIFICATION_EMAIL,
  QUEUE_NOTIFICATION_IN_APP,
  QUEUE_REMINDER_DISPATCH,
} from '../queues.constants';

type DispatchPayload = {
  reminderId: string;
  scheduledFor: string;
};

@Processor(QUEUE_REMINDER_DISPATCH, {
  concurrency: Number(process.env.REMINDER_DISPATCH_CONCURRENCY ?? '5'),
})
export class ReminderDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderDispatchProcessor.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly deliveriesRepository: DeliveriesRepository,
    private readonly preferencesRepository: PreferencesRepository,
    private readonly eligibility: ReminderEligibilityRegistry,
    private readonly audit: AuditService,
    @InjectQueue(QUEUE_NOTIFICATION_EMAIL)
    private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NOTIFICATION_IN_APP)
    private readonly inAppQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<DispatchPayload>): Promise<void> {
    if (job.name !== JOB_REMINDER_DISPATCH) {
      return;
    }

    const { reminderId, scheduledFor } = job.data;
    const scheduledForDate = new Date(scheduledFor);
    const jobs = getJobsConfig();

    const reminder =
      await this.remindersRepository.findByIdWithSlots(reminderId);
    if (!reminder || reminder.status !== 'ACTIVE' || !reminder.enabled) {
      return;
    }

    const eligibility = await this.eligibility.check(
      reminder.resource_type,
      reminder.resource_id,
    );
    if (!eligibility.eligible) {
      for (const channel of reminder.channels as NotificationChannel[]) {
        const delivery = await this.deliveriesRepository.createPending({
          reminder_id: reminderId,
          channel,
          scheduled_for: scheduledForDate,
        });
        await this.deliveriesRepository.markSkipped(
          delivery.id,
          eligibility.reason ?? 'RESOURCE_INELIGIBLE',
        );
      }
      if (eligibility.complete) {
        await this.remindersRepository.update(reminderId, {
          status: 'COMPLETED',
          next_run_at: null,
          cancel_reason: eligibility.reason ?? 'RESOURCE_INELIGIBLE',
        });
      }
      return;
    }

    if (reminder.user_id) {
      const prefs = await this.preferencesRepository.findByUserId(
        reminder.user_id,
      );
      if (prefs && !prefs.reminders_enabled) {
        for (const channel of reminder.channels as NotificationChannel[]) {
          const delivery = await this.deliveriesRepository.createPending({
            reminder_id: reminderId,
            channel,
            scheduled_for: scheduledForDate,
          });
          await this.deliveriesRepository.markSkipped(
            delivery.id,
            'PREFERENCES_DISABLED',
          );
        }
        return;
      }
    }

    for (const channel of reminder.channels as NotificationChannel[]) {
      const delivery = await this.deliveriesRepository.createPending({
        reminder_id: reminderId,
        channel,
        scheduled_for: scheduledForDate,
      });

      if (delivery.status === 'SENT' || delivery.status === 'SKIPPED') {
        continue;
      }

      if (
        !(IMPLEMENTED_NOTIFICATION_CHANNELS as readonly string[]).includes(
          channel,
        )
      ) {
        await this.deliveriesRepository.markSkipped(
          delivery.id,
          'CHANNEL_NOT_IMPLEMENTED',
        );
        continue;
      }

      if (channel === 'EMAIL') {
        await this.emailQueue.add(
          JOB_NOTIFICATION_EMAIL,
          { deliveryId: delivery.id },
          {
            jobId: notificationEmailJobId(delivery.id),
            attempts: jobs.jobAttempts,
            backoff: { type: 'exponential', delay: jobs.jobBackoffMs },
            removeOnComplete: 1000,
            removeOnFail: 5000,
          },
        );
      } else if (channel === 'IN_APP') {
        if (!reminder.user_id) {
          await this.deliveriesRepository.markSkipped(
            delivery.id,
            'NO_USER_FOR_IN_APP',
          );
          continue;
        }
        await this.inAppQueue.add(
          JOB_NOTIFICATION_IN_APP,
          { deliveryId: delivery.id },
          {
            jobId: notificationInAppJobId(delivery.id),
            attempts: jobs.jobAttempts,
            backoff: { type: 'exponential', delay: jobs.jobBackoffMs },
            removeOnComplete: 1000,
            removeOnFail: 5000,
          },
        );
      }
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error): Promise<void> {
    this.logger.warn(`Dispatch failed job=${job?.id}: ${error.message}`);
    const reminderId = (job?.data as DispatchPayload | undefined)?.reminderId;
    if (!reminderId) {
      return;
    }
    const reminder = await this.remindersRepository.findById(reminderId);
    if (!reminder) {
      return;
    }
    const failures = (reminder.consecutive_failures ?? 0) + 1;
    const patch: {
      consecutive_failures: number;
      status?: 'PAUSED';
    } = {
      consecutive_failures: failures,
    };
    if (failures >= getJobsConfig().jobAttempts) {
      patch.status = 'PAUSED';
      await this.audit.failureSafe({
        type: 'COMMUNICATION',
        action: 'reminder.dispatch_paused',
        targetType: 'reminder',
        targetId: reminderId,
        metadata: { failures },
      });
    }
    await this.remindersRepository.update(reminderId, patch);
  }
}
