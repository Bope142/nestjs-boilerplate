import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';
import { DomainError } from '../exceptions/domain.error';
import { resolveErrorI18nKey } from '../i18n/resolve-error-i18n-key';
import { translateCommon, translateError } from '../i18n/translate.helpers';

type ErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path?: string;
};

const FALLBACK_LANGUAGE = 'fr';

function flattenValidationMessages(
  errors: I18nValidationException['errors'],
): string {
  const messages: string[] = [];

  const walk = (list: I18nValidationException['errors']): void => {
    for (const error of list) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }
      if (error.children?.length) {
        walk(error.children);
      }
    }
  };

  walk(errors);
  return messages.join(', ');
}

function resolveLang(request: Request): string {
  const fromContext = I18nContext.current()?.lang;
  if (fromContext) {
    return fromContext;
  }

  const accept = request.headers['accept-language'];
  if (typeof accept === 'string' && accept.length > 0) {
    const primary = accept.split(',')[0]?.trim().toLowerCase() ?? '';
    if (primary.startsWith('en')) {
      return 'en';
    }
    if (primary.startsWith('fr')) {
      return 'fr';
    }
  }

  return FALLBACK_LANGUAGE;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const lang = resolveLang(request);

    response.setHeader('Content-Language', lang);

    if (exception instanceof DomainError) {
      const message = translateError(exception.code, exception.args, lang);
      this.send(response, request, {
        statusCode: exception.getStatus(),
        code: exception.code,
        message,
      });
      return;
    }

    if (exception instanceof I18nValidationException) {
      const flattened = flattenValidationMessages(exception.errors);
      this.send(response, request, {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message:
          flattened || translateCommon('VALIDATION_ERROR', undefined, lang),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let code = 'INTERNAL_SERVER_ERROR';
      let message = translateCommon('INTERNAL_SERVER_ERROR', undefined, lang);

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        !Array.isArray(exceptionResponse)
      ) {
        const body = exceptionResponse as Record<string, unknown>;
        if (typeof body.code === 'string') {
          code = body.code;
          const translated = translateError(code, undefined, lang);
          const i18nKey = resolveErrorI18nKey(code);
          message =
            translated !== i18nKey
              ? translated
              : typeof body.message === 'string'
                ? body.message
                : translated;
        } else if (typeof body.message === 'string') {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          code = 'VALIDATION_ERROR';
          message = body.message.join(', ');
        }
      }

      if (status >= 500) {
        this.logger.error(
          exception instanceof Error ? exception.stack : String(exception),
        );
      }

      this.send(response, request, { statusCode: status, code, message });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );

    this.send(response, request, {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: translateCommon('INTERNAL_SERVER_ERROR', undefined, lang),
    });
  }

  private send(
    response: Response,
    request: Request,
    partial: Pick<ErrorBody, 'statusCode' | 'code' | 'message'>,
  ): void {
    const payload: ErrorBody = {
      statusCode: partial.statusCode,
      code: partial.code,
      message: partial.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    response.status(partial.statusCode).json(payload);
  }
}
