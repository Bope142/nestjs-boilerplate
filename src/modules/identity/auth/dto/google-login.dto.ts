import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: "Jeton d'identité Google fourni par le SDK frontend",
  })
  @IsString({ message: 'Le jeton Google est requis' })
  @MinLength(20, { message: 'Le jeton Google est invalide' })
  idToken!: string;
}
