import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getMailConfig } from '../../config/mail.config';
import type { EmailSender, SendEmailInput } from './email-sender.port';

@Injectable()
export class NodemailerEmailSender implements EmailSender {
  private readonly logger = new Logger(NodemailerEmailSender.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor() {
    const config = getMailConfig();
    this.from = `"${config.fromName}" <${config.from}>`;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
      connectionTimeout: config.timeoutMs,
      socketTimeout: config.timeoutMs,
    });
  }

  async send(input: SendEmailInput): Promise<void> {
    const config = getMailConfig();
    let lastError: unknown;

    for (let attempt = 1; attempt <= config.retryAttempts; attempt += 1) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
        });
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Email send attempt ${attempt}/${config.retryAttempts} failed`,
        );
        if (attempt < config.retryAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, config.retryDelayMs),
          );
        }
      }
    }

    this.logger.error('Email delivery failed after retries');
    throw lastError;
  }
}
