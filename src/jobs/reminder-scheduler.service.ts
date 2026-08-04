import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { getJobsConfig } from '../config/jobs.config';
import { computeNextRunAt } from '../modules/communication/reminders/reminder-schedule';
import { RemindersRepository } from '../modules/communication/reminders/reminders.repository';
import {
  JOB_REMINDER_DISPATCH,
  JOB_REMINDER_SCHEDULER_TICK,
  QUEUE_REMINDER_DISPATCH,
  QUEUE_REMINDER_SCHEDULER,
} from './queues.constants';

@Injectable()
export class ReminderSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_REMINDER_SCHEDULER)
    private readonly schedulerQueue: Queue,
    @InjectQueue(QUEUE_REMINDER_DISPATCH)
    private readonly dispatchQueue: Queue,
    private readonly remindersRepository: RemindersRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const jobs = getJobsConfig();
    if (!jobs.enabled) {
      return;
    }

    await this.schedulerQueue.add(
      JOB_REMINDER_SCHEDULER_TICK,
      {},
      {
        jobId: 'reminder-scheduler-repeatable',
        repeat: { every: jobs.reminderSchedulerIntervalMs },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
    this.logger.log(
      `Reminder scheduler registered (every ${jobs.reminderSchedulerIntervalMs}ms)`,
    );
  }

  async tick(): Promise<{ claimed: number; enqueued: number }> {
    const jobs = getJobsConfig();
    const now = new Date();
    const dueRows = await this.remindersRepository.findDueForUpdate(
      jobs.reminderSchedulerBatchSize,
      now,
    );

    let enqueued = 0;
    for (const due of dueRows) {
      const reminder = await this.remindersRepository.findByIdWithSlots(due.id);
      if (!reminder) {
        continue;
      }

      const scheduledFor = reminder.next_run_at ?? now;
      const scheduledForIso = scheduledFor.toISOString();
      const jobId = `dispatch:${reminder.id}:${scheduledForIso}`;

      await this.dispatchQueue.add(
        JOB_REMINDER_DISPATCH,
        {
          reminderId: reminder.id,
          scheduledFor: scheduledForIso,
        },
        {
          jobId,
          attempts: jobs.jobAttempts,
          backoff: { type: 'exponential', delay: jobs.jobBackoffMs },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      );
      enqueued += 1;

      const slotTimes = reminder.time_slots.map((s) => s.local_time);
      const next = computeNextRunAt({
        scheduleType: reminder.schedule_type,
        timezone: reminder.timezone,
        timeSlots: slotTimes,
        weeklyDays: reminder.weekly_days,
        deadlineAt: reminder.deadline_at,
        offsetDays: reminder.offset_days,
        from: new Date(scheduledFor.getTime() + 1000),
      });

      if (next) {
        await this.remindersRepository.update(reminder.id, {
          next_run_at: next,
          last_enqueued_at: now,
        });
      } else {
        await this.remindersRepository.update(reminder.id, {
          next_run_at: null,
          last_enqueued_at: now,
          status: 'COMPLETED',
        });
      }
    }

    if (dueRows.length > 0) {
      this.logger.debug(
        `Scheduler tick claimed=${dueRows.length} enqueued=${enqueued}`,
      );
    }

    return { claimed: dueRows.length, enqueued };
  }
}
