import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'membre@example.com' })
  @IsEmail({}, { message: 'L’e-mail doit être une adresse valide' })
  @MaxLength(320, { message: 'L’e-mail ne peut pas dépasser 320 caractères' })
  email!: string;

  @ApiProperty({ minLength: 8, example: 'MotDePasse1!' })
  @IsString({ message: 'Le mot de passe est requis' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @MaxLength(128, {
    message: 'Le mot de passe ne peut pas dépasser 128 caractères',
  })
  password!: string;

  @ApiProperty({ example: 'Jean' })
  @IsString({ message: 'Le prénom est requis' })
  @MinLength(1, { message: 'Le prénom est requis' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  firstName!: string;

  @ApiProperty({ example: 'Mbala' })
  @IsString({ message: 'Le nom est requis' })
  @MinLength(1, { message: 'Le nom est requis' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  lastName!: string;

  @ApiPropertyOptional({ example: '+243900000000' })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(32, {
    message: 'Le téléphone ne peut pas dépasser 32 caractères',
  })
  @Matches(/^\+?[0-9\s\-()]+$/, {
    message: 'Le numéro de téléphone doit être valide',
  })
  phone?: string;
}
