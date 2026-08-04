import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { getJobsConfig } from '../config/jobs.config';
import { getRedisConfig } from '../config/redis.config';
import { CommunicationModule } from '../modules/communication/communication.module';
import { NotificationEmailProcessor } from './processors/notification-email.processor';
import { NotificationInAppProcessor } from './processors/notification-in-app.processor';
import { ReminderDispatchProcessor } from './processors/reminder-dispatch.processor';
import { ReminderSchedulerProcessor } from './processors/reminder-scheduler.processor';
import {
  QUEUE_NOTIFICATION_EMAIL,
  QUEUE_NOTIFICATION_IN_APP,
  QUEUE_REMINDER_DISPATCH,
  QUEUE_REMINDER_SCHEDULER,
} from './queues.constants';
import { ReminderSchedulerService } from './reminder-scheduler.service';

@Module({})
export class JobsModule {
  static register(): DynamicModule {
    const jobs = getJobsConfig();
    if (!jobs.enabled) {
      return {
        module: JobsModule,
        providers: [],
        exports: [],
      };
    }

    const redis = getRedisConfig();

    return {
      module: JobsModule,
      imports: [
        CommunicationModule,
        BullModule.forRoot({
          connection: {
            host: redis.host,
            port: redis.port,
            password: redis.password,
            db: jobs.queueDb,
            maxRetriesPerRequest: null,
          },
        }),
        BullModule.registerQueue(
          { name: QUEUE_REMINDER_SCHEDULER },
          { name: QUEUE_REMINDER_DISPATCH },
          {
            name: QUEUE_NOTIFICATION_EMAIL,
            defaultJobOptions: {
              attempts: jobs.jobAttempts,
              backoff: { type: 'exponential', delay: jobs.jobBackoffMs },
            },
          },
          { name: QUEUE_NOTIFICATION_IN_APP },
        ),
      ],
      providers: [
        ReminderSchedulerService,
        ReminderSchedulerProcessor,
        ReminderDispatchProcessor,
        NotificationEmailProcessor,
        NotificationInAppProcessor,
      ],
      exports: [ReminderSchedulerService],
    };
  }
}
