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
  @IsEmail({}, { message: 'L’e-mail doit être une adresse valide' })
  @MaxLength(320, { message: 'L’e-mail ne peut pas dépasser 320 caractères' })
  email!: CreateUserPayload['email'];

  @ApiProperty({ example: 'Jean' })
  @IsString({ message: 'Le prénom est requis' })
  @MinLength(1, { message: 'Le prénom est requis' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  firstName!: CreateUserPayload['firstName'];

  @ApiProperty({ example: 'Mbala' })
  @IsString({ message: 'Le nom est requis' })
  @MinLength(1, { message: 'Le nom est requis' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
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
    message: 'Le numéro de téléphone doit être valide',
  })
  phone?: CreateUserPayload['phone'];

  @ApiProperty({ enum: USER_TYPES })
  @IsIn(USER_TYPES, { message: 'Le type utilisateur est invalide' })
  userType!: CreateUserPayload['userType'];

  @ApiProperty({ enum: USER_ROLES })
  @IsIn(USER_ROLES, { message: 'Le rôle est invalide' })
  role!: CreateUserPayload['role'];

  @ApiProperty({ enum: USER_STATUSES })
  @IsIn(USER_STATUSES, { message: 'Le statut est invalide' })
  status!: CreateUserPayload['status'];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  emailVerifiedAt?: CreateUserPayload['emailVerifiedAt'];
}
