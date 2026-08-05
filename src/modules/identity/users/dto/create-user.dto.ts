import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import type { CreateUserPayload } from './user.payload';

/**
 * Centralized create-user DTO for POST flows.
 * Implements CreateUserPayload so repository typing stays decorator-free.
 */
export class CreateUserDto implements CreateUserPayload {
  @ApiProperty({ example: 'membre@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: CreateUserPayload['email'];

  @ApiProperty({ example: 'Jean' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: CreateUserPayload['firstName'];

  @ApiProperty({ example: 'Mbala' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: CreateUserPayload['lastName'];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: CreateUserPayload['displayName'];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: CreateUserPayload['avatarUrl'];

  @ApiPropertyOptional({ example: '+243900000000' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^\+?[0-9\s\-()]+$/, {
    message: i18nValidationMessage('validation.phoneNumber'),
  })
  phone?: CreateUserPayload['phone'];

  @ApiProperty({ enum: USER_TYPES })
  @IsIn(USER_TYPES)
  userType!: CreateUserPayload['userType'];

  @ApiProperty({ enum: USER_ROLES })
  @IsIn(USER_ROLES)
  role!: CreateUserPayload['role'];

  @ApiProperty({ enum: USER_STATUSES })
  @IsIn(USER_STATUSES)
  status!: CreateUserPayload['status'];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  emailVerifiedAt?: CreateUserPayload['emailVerifiedAt'];
}
