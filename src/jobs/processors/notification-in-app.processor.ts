import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DeliveriesRepository } from '../../modules/communication/deliveries/deliveries.repository';
import { NotificationsRepository } from '../../modules/communication/notifications/notifications.repository';
import { RemindersRepository } from '../../modules/communication/reminders/reminders.repository';
import {
  JOB_NOTIFICATION_IN_APP,
  QUEUE_NOTIFICATION_IN_APP,
} from '../queues.constants';

type InAppPayload = { deliveryId: string };

@Processor(QUEUE_NOTIFICATION_IN_APP, {
  concurrency: Number(process.env.NOTIFICATION_IN_APP_CONCURRENCY ?? '10'),
})
export class NotificationInAppProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationInAppProcessor.name);

  constructor(
    private readonly deliveriesRepository: DeliveriesRepository,
    private readonly remindersRepository: RemindersRepository,
    private readonly notificationsRepository: NotificationsRepository,
  ) {
    super();
  }

  async process(job: Job<InAppPayload>): Promise<void> {
    if (job.name !== JOB_NOTIFICATION_IN_APP) {
      return;
    }

    const delivery = await this.deliveriesRepository.findById(
      job.data.deliveryId,
    );
    if (!delivery) {
      return;
    }
    if (delivery.status === 'SENT' || delivery.status === 'SKIPPED') {
      return;
    }

    const reminder = await this.remindersRepository.findById(
      delivery.reminder_id,
    );
    if (!reminder?.user_id) {
      await this.deliveriesRepository.markSkipped(
        delivery.id,
        'NO_USER_FOR_IN_APP',
      );
      return;
    }

    const body =
      typeof reminder.metadata?.['body'] === 'string'
        ? reminder.metadata['body']
        : 'Ceci est un rappel concernant votre engagement.';

    await this.notificationsRepository.create({
      user_id: reminder.user_id,
      title: reminder.title,
      body,
      resource_type: reminder.resource_type,
      resource_id: reminder.resource_id,
    });

    await this.deliveriesRepository.markSent(delivery.id);
    await this.remindersRepository.update(reminder.id, {
      consecutive_failures: 0,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.warn(
      `In-app notification failed job=${job?.id}: ${error.message}`,
    );
  }
}
