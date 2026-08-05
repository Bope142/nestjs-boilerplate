import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  NOTIFICATION_CHANNELS,
  type NotificationChannel,
} from '../../../../database/schema/enums';

const LOCAL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;

  @ApiPropertyOptional({ enum: NOTIFICATION_CHANNELS, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsEnum(NOTIFICATION_CHANNELS, { each: true })
  defaultChannels?: NotificationChannel[];

  @ApiPropertyOptional({ example: 'Africa/Kinshasa' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string | null;

  @ApiPropertyOptional({
    example: '22:00',
    description: 'Quiet hours start (HH:mm)',
  })
  @IsOptional()
  @Matches(LOCAL_TIME_PATTERN, {
    message: i18nValidationMessage('validation.timeSlotHhMm'),
  })
  quietHoursStart?: string | null;

  @ApiPropertyOptional({
    example: '07:00',
    description: 'Quiet hours end (HH:mm)',
  })
  @IsOptional()
  @Matches(LOCAL_TIME_PATTERN, {
    message: i18nValidationMessage('validation.timeSlotHhMm'),
  })
  quietHoursEnd?: string | null;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  remindersEnabled!: boolean;

  @ApiProperty({ enum: NOTIFICATION_CHANNELS, isArray: true })
  defaultChannels!: NotificationChannel[];

  @ApiPropertyOptional({ nullable: true })
  timezone!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '22:00' })
  quietHoursStart!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '07:00' })
  quietHoursEnd!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
