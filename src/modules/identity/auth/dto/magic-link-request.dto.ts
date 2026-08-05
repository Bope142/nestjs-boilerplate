import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class MagicLinkRequestDto {
  @ApiProperty({ example: 'membre@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
