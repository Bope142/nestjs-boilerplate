import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { DomainError } from '../exceptions/domain.error';
import type { AuthenticatedActor } from '../types/authenticated-actor';
import { AuthErrorCodes } from '../../modules/identity/errors/auth.errors';

type RequestWithActor = Request & { user?: AuthenticatedActor };

/**
 * Attempts JWT auth when a Bearer token is present.
 * Continues as anonymous when no Authorization header is sent.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ') || header.length <= 'Bearer '.length) {
      return true;
    }

    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) {
      return false;
    }

    const actor = request.user;
    if (actor && !actor.emailVerified) {
      throw new DomainError(
        AuthErrorCodes.EMAIL_NOT_VERIFIED,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err) {
      throw err;
    }
    return user;
  }
}
