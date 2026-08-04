import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { INVALIDATE_CACHE_KEY } from '../decorators/invalidate-cache.decorator';

@Injectable()
export class InvalidateCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const namespaces = this.reflector.getAllAndOverride<string[]>(
      INVALIDATE_CACHE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!namespaces || namespaces.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          for (const namespace of namespaces) {
            void this.cache.bumpNamespace(namespace);
          }
        },
      }),
    );
  }
}
