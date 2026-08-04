import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class TokenDto {
  @ApiProperty({ description: 'Jeton opaque reçu par e-mail' })
  @IsString({ message: 'Le jeton est requis' })
  @MinLength(20, { message: 'Le jeton est invalide' })
  token!: string;
}
