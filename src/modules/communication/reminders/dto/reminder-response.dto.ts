import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NOTIFICATION_CHANNELS,
  REMINDER_RESOURCE_TYPES,
  REMINDER_SCHEDULE_TYPES,
  REMINDER_STATUSES,
  type NotificationChannel,
  type ReminderResourceType,
  type ReminderScheduleType,
  type ReminderStatus,
} from '../../../../database/schema/enums';

export class ReminderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  guestEmail!: string | null;

  @ApiProperty({ enum: REMINDER_RESOURCE_TYPES })
  resourceType!: ReminderResourceType;

  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  @ApiProperty({ enum: REMINDER_SCHEDULE_TYPES })
  scheduleType!: ReminderScheduleType;

  @ApiProperty()
  timezone!: string;

  @ApiPropertyOptional({ type: [Number], nullable: true })
  weeklyDays!: number[] | null;

  @ApiPropertyOptional({ nullable: true })
  deadlineAt!: string | null;

  @ApiPropertyOptional({ type: [Number], nullable: true })
  offsetDays!: number[] | null;

  @ApiProperty({ enum: NOTIFICATION_CHANNELS, isArray: true })
  channels!: NotificationChannel[];

  @ApiProperty({ enum: REMINDER_STATUSES })
  status!: ReminderStatus;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  templateKey!: string;

  @ApiPropertyOptional({
    type: 'object',
    nullable: true,
    additionalProperties: true,
  })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ type: [String] })
  timeSlots!: string[];

  @ApiPropertyOptional({ nullable: true })
  nextRunAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastEnqueuedAt!: string | null;

  @ApiProperty()
  consecutiveFailures!: number;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancelReason!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
