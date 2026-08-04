import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  REMINDER_RESOURCE_TYPES,
  type ReminderResourceType,
} from '../../../../database/schema/enums';

export class InAppNotificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional({ enum: REMINDER_RESOURCE_TYPES, nullable: true })
  resourceType!: ReminderResourceType | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  resourceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}
