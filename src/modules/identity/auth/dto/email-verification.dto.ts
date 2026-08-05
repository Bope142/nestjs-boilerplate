import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class EmailVerificationDto {
  @ApiProperty({
    description: 'Opaque token received by email',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  token?: string;

  @ApiProperty({
    description: 'Numeric OTP received by email',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, {
    message: i18nValidationMessage('validation.otpCode'),
  })
  otpCode?: string;
}
