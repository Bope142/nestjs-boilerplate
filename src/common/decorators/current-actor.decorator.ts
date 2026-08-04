import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedActor } from '../types/authenticated-actor';

type RequestWithActor = Request & { user?: AuthenticatedActor };

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedActor => {
    const request = ctx.switchToHttp().getRequest<RequestWithActor>();
    if (!request.user) {
      throw new Error("L'acteur authentifié est absent de la requête");
    }
    return request.user;
  },
);
