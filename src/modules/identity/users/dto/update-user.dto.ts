import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  USER_ROLES,
  USER_STATUSES,
  USER_TYPES,
} from '../../../../database/schema/enums';
import type { UpdateUserPayload } from './user.payload';

/**
 * Centralized update-user DTO for PUT/PATCH.
 * Implements UpdateUserPayload so repository typing stays decorator-free.
 */
export class UpdateUserDto implements UpdateUserPayload {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: UpdateUserPayload['email'];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: UpdateUserPayload['firstName'];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: UpdateUserPayload['lastName'];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: UpdateUserPayload['displayName'];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: UpdateUserPayload['avatarUrl'];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^\+?[0-9\s\-()]+$/, {
    message: i18nValidationMessage('validation.phoneNumber'),
  })
  phone?: UpdateUserPayload['phone'];

  @ApiPropertyOptional({ enum: USER_TYPES })
  @IsOptional()
  @IsIn(USER_TYPES)
  userType?: UpdateUserPayload['userType'];

  @ApiPropertyOptional({ enum: USER_ROLES })
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UpdateUserPayload['role'];

  @ApiPropertyOptional({ enum: USER_STATUSES })
  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: UpdateUserPayload['status'];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  emailVerifiedAt?: UpdateUserPayload['emailVerifiedAt'];
}
