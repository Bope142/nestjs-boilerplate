import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelReminderDto {
  @ApiPropertyOptional({ example: 'Annulé par l’utilisateur' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
