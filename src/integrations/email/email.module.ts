import { Global, Module } from '@nestjs/common';
import { EMAIL_SENDER } from './email-sender.port';
import { EmailTemplateService } from './email-template.service';
import { NodemailerEmailSender } from './nodemailer-email.sender';

@Global()
@Module({
  providers: [
    NodemailerEmailSender,
    EmailTemplateService,
    {
      provide: EMAIL_SENDER,
      useExisting: NodemailerEmailSender,
    },
  ],
  exports: [EMAIL_SENDER, EmailTemplateService],
})
export class EmailModule {}
