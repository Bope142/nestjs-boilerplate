import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { AuthenticatedActor } from '../../types/authenticated-actor';
import { CacheService } from '../cache.service';
import {
  CACHE_ROUTE_KEY,
  type CacheRouteOptions,
} from '../decorators/cache-route.decorator';

type RequestWithActor = Request & { user?: AuthenticatedActor };

@Injectable()
export class CacheRouteInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const options = this.reflector.getAllAndOverride<CacheRouteOptions>(
      CACHE_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options || context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithActor>();
    if (request.method.toUpperCase() !== 'GET') {
      return next.handle();
    }

    const version = await this.cache.getNamespaceVersion(options.namespace);
    const key = this.cache.buildRouteKey({
      namespace: options.namespace,
      method: request.method,
      path: request.path,
      userId: request.user?.userId,
      query: request.query,
      version,
    });

    const cached = await this.cache.get<unknown>(key);
    if (cached !== undefined) {
      return of(cached);
    }

    return next.handle().pipe(
      tap((body) => {
        void this.cache.set(key, body, options.ttl);
      }),
    );
  }
}
