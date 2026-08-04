import { Injectable } from '@nestjs/common';
import type { EmailSender, SendEmailInput } from './email-sender.port';

@Injectable()
export class InMemoryEmailSender implements EmailSender {
  readonly sent: SendEmailInput[] = [];

  send(input: SendEmailInput): Promise<void> {
    this.sent.push(input);
    return Promise.resolve();
  }
}
