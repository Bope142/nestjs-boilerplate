import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class MagicLinkRequestDto {
  @ApiProperty({ example: 'membre@example.com' })
  @IsEmail({}, { message: 'L’e-mail doit être une adresse valide' })
  @MaxLength(320, { message: 'L’e-mail ne peut pas dépasser 320 caractères' })
  email!: string;
}
