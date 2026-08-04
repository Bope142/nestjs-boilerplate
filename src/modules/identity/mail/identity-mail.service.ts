import { Inject, Injectable } from '@nestjs/common';
import { getAuthConfig } from '../../../config/auth.config';
import {
  EMAIL_SENDER,
  type EmailSender,
} from '../../../integrations/email/email-sender.port';
import { EmailTemplateService } from '../../../integrations/email/email-template.service';

@Injectable()
export class IdentityMailService {
  constructor(
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async sendEmailVerification(params: {
    to: string;
    firstName: string;
    rawToken: string;
    otpCode: string;
  }): Promise<void> {
    const verifyUrl = `${getAuthConfig().frontendBaseUrl}/auth/verify-email?token=${encodeURIComponent(params.rawToken)}`;
    const rendered = await this.emailTemplateService.renderAuthTemplate(
      'email-verification',
      'Vérifiez votre e-mail',
      {
        firstName: params.firstName,
        verifyUrl,
        otpCode: params.otpCode,
        expiresInMinutes: getAuthConfig().emailVerificationTtlMinutes,
      },
    );

    await this.emailSender.send({
      to: params.to,
      subject: 'Verify your email',
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendMagicLink(params: {
    to: string;
    firstName: string;
    rawToken: string;
  }): Promise<void> {
    const magicUrl = `${getAuthConfig().frontendBaseUrl}/auth/magic-link?token=${encodeURIComponent(params.rawToken)}`;
    const rendered = await this.emailTemplateService.renderAuthTemplate(
      'magic-link',
      'Your magic sign-in link',
      {
        firstName: params.firstName,
        magicUrl,
        expiresInMinutes: getAuthConfig().magicLinkTtlMinutes,
      },
    );

    await this.emailSender.send({
      to: params.to,
      subject: 'Your magic sign-in link',
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendWelcome(params: { to: string; firstName: string }): Promise<void> {
    const rendered = await this.emailTemplateService.renderAuthTemplate(
      'welcome',
      'Welcome',
      { firstName: params.firstName },
    );

    await this.emailSender.send({
      to: params.to,
      subject: 'Welcome',
      html: rendered.html,
      text: rendered.text,
    });
  }

  async sendPasswordReset(params: {
    to: string;
    firstName: string;
    rawToken: string;
  }): Promise<void> {
    const resetUrl = `${getAuthConfig().frontendBaseUrl}/auth/reset-password?token=${encodeURIComponent(params.rawToken)}`;
    const rendered = await this.emailTemplateService.renderAuthTemplate(
      'password-reset',
      'Reset your password',
      {
        firstName: params.firstName,
        resetUrl,
        expiresInMinutes: getAuthConfig().passwordResetTtlMinutes,
      },
    );

    await this.emailSender.send({
      to: params.to,
      subject: 'Reset your password',
      html: rendered.html,
      text: rendered.text,
    });
  }
}
