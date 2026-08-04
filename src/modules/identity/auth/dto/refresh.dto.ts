import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'Enveloppe chiffrée du jeton de rafraîchissement',
  })
  @IsString({ message: 'Le jeton de rafraîchissement est requis' })
  @MinLength(20, { message: 'Le jeton de rafraîchissement est invalide' })
  refreshToken!: string;
}
