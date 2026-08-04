import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class EmailVerificationDto {
  @ApiProperty({
    description: 'Jeton opaque reçu par e-mail',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le jeton est requis' })
  @MinLength(20, { message: 'Le jeton est invalide' })
  token?: string;

  @ApiProperty({
    description: 'Code OTP numérique reçu par e-mail',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le code OTP est requis' })
  @Matches(/^\d{6}$/, {
    message: 'Le code OTP doit contenir exactement 6 chiffres',
  })
  otpCode?: string;
}
