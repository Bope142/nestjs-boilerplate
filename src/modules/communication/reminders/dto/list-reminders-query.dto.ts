import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  REMINDER_RESOURCE_TYPES,
  REMINDER_STATUSES,
  type ReminderResourceType,
  type ReminderStatus,
} from '../../../../database/schema/enums';

export class ListRemindersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: REMINDER_STATUSES })
  @IsOptional()
  @IsEnum(REMINDER_STATUSES)
  status?: ReminderStatus;

  @ApiPropertyOptional({ enum: REMINDER_RESOURCE_TYPES })
  @IsOptional()
  @IsEnum(REMINDER_RESOURCE_TYPES)
  resourceType?: ReminderResourceType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filter by owner user (staff use)',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
