import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import { users } from '../../database/schema/tables/users';
import type { DrizzleDB } from '../../database/types/drizzle';
import {
  EMAIL_SENDER,
  type EmailSender,
} from '../../integrations/email/email-sender.port';
import { EmailTemplateService } from '../../integrations/email/email-template.service';
import { DeliveriesRepository } from '../../modules/communication/deliveries/deliveries.repository';
import { RemindersRepository } from '../../modules/communication/reminders/reminders.repository';
import {
  JOB_NOTIFICATION_EMAIL,
  QUEUE_NOTIFICATION_EMAIL,
} from '../queues.constants';

type EmailPayload = { deliveryId: string };

@Processor(QUEUE_NOTIFICATION_EMAIL, {
  concurrency: Number(process.env.NOTIFICATION_EMAIL_CONCURRENCY ?? '3'),
  limiter: {
    max: Number(process.env.NOTIFICATION_EMAIL_MAX_PER_SECOND ?? '10'),
    duration: 1000,
  },
})
export class NotificationEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationEmailProcessor.name);

  constructor(
    private readonly deliveriesRepository: DeliveriesRepository,
    private readonly remindersRepository: RemindersRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    private readonly templates: EmailTemplateService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {
    super();
  }

  async process(job: Job<EmailPayload>): Promise<void> {
    if (job.name !== JOB_NOTIFICATION_EMAIL) {
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
    if (!reminder) {
      await this.deliveriesRepository.markSkipped(
        delivery.id,
        'REMINDER_NOT_FOUND',
      );
      return;
    }

    let to = reminder.guest_email;
    let firstName = 'ami(e)';
    if (reminder.user_id) {
      const rows = await this.db
        .select({
          email: users.email,
          first_name: users.first_name,
        })
        .from(users)
        .where(eq(users.id, reminder.user_id))
        .limit(1);
      const user = rows[0];
      if (!user?.email) {
        await this.deliveriesRepository.markSkipped(
          delivery.id,
          'USER_EMAIL_MISSING',
        );
        return;
      }
      to = user.email;
      firstName = user.first_name;
    }

    if (!to) {
      await this.deliveriesRepository.markSkipped(
        delivery.id,
        'RECIPIENT_MISSING',
      );
      return;
    }

    try {
      const rendered = await this.templates.renderReminderTemplate(
        reminder.title,
        {
          firstName,
          title: reminder.title,
          body:
            typeof reminder.metadata?.['body'] === 'string'
              ? reminder.metadata['body']
              : 'Ceci est un rappel concernant votre engagement.',
        },
      );

      await this.emailSender.send({
        to,
        subject: reminder.title,
        html: rendered.html,
        text: rendered.text,
      });

      await this.deliveriesRepository.markSent(delivery.id);
      await this.remindersRepository.update(reminder.id, {
        consecutive_failures: 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.deliveriesRepository.markFailed(
        delivery.id,
        'EMAIL_SEND_FAILED',
        message,
      );
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.warn(
      `Email notification failed job=${job?.id}: ${error.message}`,
    );
  }
}
