import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '../../database/schema/enums';
import { DomainError } from '../exceptions/domain.error';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedActor } from '../types/authenticated-actor';
import { AuthErrorCodes } from '../../modules/identity/errors/auth.errors';

type RequestWithActor = Request & { user?: AuthenticatedActor };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const actor = request.user;

    if (!actor || !requiredRoles.includes(actor.role)) {
      throw new DomainError(
        AuthErrorCodes.INSUFFICIENT_ROLE,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
