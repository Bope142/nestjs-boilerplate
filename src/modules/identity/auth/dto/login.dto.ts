import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'membre@example.com' })
  @IsEmail({}, { message: 'L’e-mail doit être une adresse valide' })
  @MaxLength(320, { message: 'L’e-mail ne peut pas dépasser 320 caractères' })
  email!: string;

  @ApiProperty({ example: 'MotDePasse1!' })
  @IsString({ message: 'Le mot de passe est requis' })
  @MinLength(1, { message: 'Le mot de passe est requis' })
  @MaxLength(128, {
    message: 'Le mot de passe ne peut pas dépasser 128 caractères',
  })
  password!: string;
}
