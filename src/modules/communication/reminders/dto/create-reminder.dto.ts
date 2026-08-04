import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  NOTIFICATION_CHANNELS,
  REMINDER_RESOURCE_TYPES,
  REMINDER_SCHEDULE_TYPES,
  type NotificationChannel,
  type ReminderResourceType,
  type ReminderScheduleType,
} from '../../../../database/schema/enums';

const LOCAL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export class CreateReminderDto {
  @ApiProperty({ enum: REMINDER_RESOURCE_TYPES })
  @IsEnum(REMINDER_RESOURCE_TYPES)
  resourceType!: ReminderResourceType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({ enum: REMINDER_SCHEDULE_TYPES })
  @IsEnum(REMINDER_SCHEDULE_TYPES)
  scheduleType!: ReminderScheduleType;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Weekdays 0=Sunday … 6=Saturday (WEEKLY)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weeklyDays?: number[];

  @ApiPropertyOptional({ description: 'ISO 8601 deadline (DEADLINE_OFFSET)' })
  @IsOptional()
  @IsDateString()
  deadlineAt?: string;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Days before deadline (DEADLINE_OFFSET)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  offsetDays?: number[];

  @ApiProperty({ enum: NOTIFICATION_CHANNELS, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsEnum(NOTIFICATION_CHANNELS, { each: true })
  channels!: NotificationChannel[];

  @ApiProperty({
    type: [String],
    example: ['09:00', '18:00'],
    description: 'Local HH:mm time slots',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(LOCAL_TIME_PATTERN, {
    each: true,
    message: 'Chaque créneau doit être au format HH:mm',
  })
  timeSlots!: string[];

  @ApiPropertyOptional({
    example: 'Africa/Kinshasa',
    default: 'Africa/Kinshasa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiProperty({ example: 'Rappel d’engagement' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'campaign_commitment_reminder' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  templateKey!: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  enabled?: boolean;
}
