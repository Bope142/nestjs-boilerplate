# Email integration

Port d’envoi + templates EJS.

```text
src/integrations/email/
  email.module.ts
  email-sender.port.ts
  nodemailer-email.sender.ts
  in-memory-email.sender.ts
  email-template.service.ts
  templates/
    layouts/
      base.ejs
    auth/
      email-verification.ejs
      magic-link.ejs
      welcome.ejs
      password-reset.ejs
```

Utilisation : injecter `EmailTemplateService` + `EMAIL_SENDER`.
