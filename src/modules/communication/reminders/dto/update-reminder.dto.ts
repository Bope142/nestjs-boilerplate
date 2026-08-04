import { ApiPropertyOptional } from '@nestjs/swagger';
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
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  NOTIFICATION_CHANNELS,
  REMINDER_SCHEDULE_TYPES,
  type NotificationChannel,
  type ReminderScheduleType,
} from '../../../../database/schema/enums';

const LOCAL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export class UpdateReminderDto {
  @ApiPropertyOptional({ enum: REMINDER_SCHEDULE_TYPES })
  @IsOptional()
  @IsEnum(REMINDER_SCHEDULE_TYPES)
  scheduleType?: ReminderScheduleType;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weeklyDays?: number[] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deadlineAt?: string | null;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  offsetDays?: number[] | null;

  @ApiPropertyOptional({ enum: NOTIFICATION_CHANNELS, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsEnum(NOTIFICATION_CHANNELS, { each: true })
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ type: [String], example: ['09:00'] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(LOCAL_TIME_PATTERN, {
    each: true,
    message: 'Chaque créneau doit être au format HH:mm',
  })
  timeSlots?: string[];

  @ApiPropertyOptional({ example: 'Africa/Kinshasa' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  templateKey?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  enabled?: boolean;
}
