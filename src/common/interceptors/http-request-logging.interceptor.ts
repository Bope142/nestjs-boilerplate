import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class HttpRequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const method = request.method;
    const url = request.originalUrl || request.url;
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.log(method, url, handler, response.statusCode, startedAt);
        },
        error: (error: unknown) => {
          const status =
            error instanceof HttpException ? error.getStatus() : 500;
          this.log(method, url, handler, status, startedAt, true);
        },
      }),
    );
  }

  private log(
    method: string,
    url: string,
    handler: string,
    statusCode: number,
    startedAt: number,
    failed = false,
  ): void {
    const durationMs = Date.now() - startedAt;
    const message = `${method} ${url} -> ${handler} ${statusCode} +${durationMs}ms`;

    if (failed || statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }
}
