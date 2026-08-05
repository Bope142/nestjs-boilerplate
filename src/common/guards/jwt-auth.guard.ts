import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthErrorCodes } from '../../modules/identity/errors/auth.errors';
import { DomainError } from '../exceptions/domain.error';
import { ALLOW_UNVERIFIED_EMAIL_KEY } from '../decorators/allow-unverified-email.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedActor } from '../types/authenticated-actor';

type RequestWithActor = Request & { user?: AuthenticatedActor };

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) {
      return false;
    }

    const allowUnverified = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNVERIFIED_EMAIL_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowUnverified) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const actor = request.user;
    if (!actor) {
      throw new DomainError(
        AuthErrorCodes.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!actor.emailVerified) {
      throw new DomainError(
        AuthErrorCodes.EMAIL_NOT_VERIFIED,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
