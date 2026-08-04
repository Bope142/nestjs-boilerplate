import { existsSync } from 'fs';
import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { renderFile } from 'ejs';
import { getMailConfig } from '../../config/mail.config';

export type RenderedEmail = {
  html: string;
  text: string;
};

type TemplateLocals = Record<string, unknown>;

@Injectable()
export class EmailTemplateService {
  private readonly templatesRoot: string;

  constructor() {
    this.templatesRoot = this.resolveTemplatesRoot();
  }

  async renderAuthTemplate(
    templateName:
      'email-verification' | 'magic-link' | 'welcome' | 'password-reset',
    title: string,
    data: TemplateLocals,
  ): Promise<RenderedEmail> {
    const body = await this.renderTemplateFile(
      join(this.templatesRoot, 'auth', `${templateName}.ejs`),
      data,
    );

    const html = await this.renderTemplateFile(
      join(this.templatesRoot, 'layouts', 'base.ejs'),
      {
        title,
        brandName: getMailConfig().fromName,
        body,
      },
    );

    const text = this.htmlToText(html);
    return { html, text };
  }

  async renderReminderTemplate(
    title: string,
    data: TemplateLocals,
  ): Promise<RenderedEmail> {
    const body = await this.renderTemplateFile(
      join(this.templatesRoot, 'reminders', 'generic.ejs'),
      data,
    );

    const html = await this.renderTemplateFile(
      join(this.templatesRoot, 'layouts', 'base.ejs'),
      {
        title,
        brandName: getMailConfig().fromName,
        body,
      },
    );

    const text = this.htmlToText(html);
    return { html, text };
  }

  private async renderTemplateFile(
    path: string,
    data: TemplateLocals,
  ): Promise<string> {
    const rendered: unknown = await renderFile(path, data);
    if (typeof rendered !== 'string') {
      throw new Error(`Template e-mail invalide: ${path}`);
    }
    return rendered;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private resolveTemplatesRoot(): string {
    const candidates = [
      join(__dirname, 'templates'),
      join(process.cwd(), 'src', 'integrations', 'email', 'templates'),
      join(process.cwd(), 'dist', 'integrations', 'email', 'templates'),
    ];
    const found = candidates.find((candidate) => existsSync(candidate));
    if (!found) {
      throw new Error(
        'Dossier des templates e-mail introuvable (integrations/email/templates)',
      );
    }
    return found;
  }
}
