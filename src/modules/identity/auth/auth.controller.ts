import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AllowUnverifiedEmail } from '../../../common/decorators/allow-unverified-email.decorator';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailVerificationDto } from './dto/email-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TokenDto } from './dto/token.dto';

@ApiTags('Auth')
@ApiHeader({ name: 'x-api-key', required: true })
@UseGuards(ApiKeyGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Inscription e-mail / mot de passe — session créée, e-mail non vérifié',
  })
  @ApiOkResponse({
    description:
      'Utilisateur créé avec session (comme login) ; emailVerified=false jusqu’à vérification',
  })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
      this.meta(req),
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @AllowUnverifiedEmail()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Vérifier l’e-mail avec le jeton reçu' })
  verifyEmail(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: EmailVerificationDto,
  ) {
    return this.authService.verifyEmail(actor, dto);
  }

  @Post('verify-email/retry')
  @HttpCode(HttpStatus.OK)
  @AllowUnverifiedEmail()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Renvoyer le code de vérification e-mail si aucun code actif',
  })
  retryEmailVerification(@CurrentActor() actor: AuthenticatedActor) {
    return this.authService.retryEmailVerification(actor);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Connexion par identifiants — session créée même si e-mail non vérifié',
  })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(
      { email: dto.email, password: dto.password },
      this.meta(req),
    );
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion / inscription via Google ID token' })
  google(@Body() dto: GoogleLoginDto, @Req() req: Request) {
    return this.authService.loginWithGoogle(dto.idToken, this.meta(req));
  }

  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Demander un lien magique (sans révélation d’existence)',
  })
  requestMagicLink(@Body() dto: MagicLinkRequestDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Post('magic-link/consume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consommer un jeton de lien magique' })
  consumeMagicLink(@Body() dto: TokenDto, @Req() req: Request) {
    return this.authService.consumeMagicLink(dto.token, this.meta(req));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotation du refresh token et nouvelle session',
  })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, this.meta(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowUnverifiedEmail()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Révoquer la session courante' })
  async logout(
    @CurrentActor() actor: AuthenticatedActor,
    @Req() req: Request,
  ): Promise<void> {
    await this.authService.logout(actor, this.meta(req));
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowUnverifiedEmail()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke all sessions for the current user' })
  async logoutAll(
    @CurrentActor() actor: AuthenticatedActor,
    @Req() req: Request,
  ): Promise<void> {
    await this.authService.logoutAll(actor, this.meta(req));
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset email (no email enumeration)',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with a one-time token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Change password (revokes all sessions)',
  })
  changePassword(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      actor,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  private meta(req: Request): { ipAddress: string; userAgent: string } {
    const forwarded = req.headers['x-forwarded-for'];
    const forwardedIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : undefined;
    return {
      ipAddress: forwardedIp || req.ip || '0.0.0.0',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
  }
}
