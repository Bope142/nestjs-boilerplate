import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  JOB_REMINDER_SCHEDULER_TICK,
  QUEUE_REMINDER_SCHEDULER,
} from '../queues.constants';
import { ReminderSchedulerService } from '../reminder-scheduler.service';

@Processor(QUEUE_REMINDER_SCHEDULER)
export class ReminderSchedulerProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderSchedulerProcessor.name);

  constructor(private readonly scheduler: ReminderSchedulerService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== JOB_REMINDER_SCHEDULER_TICK) {
      return;
    }
    try {
      await this.scheduler.tick();
    } catch (error) {
      this.logger.error(
        `Reminder scheduler tick failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
