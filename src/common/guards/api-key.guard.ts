import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { getAuthConfig } from '../../config/auth.config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header('x-api-key');
    const expected = getAuthConfig().apiAccessKey;

    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException({
        code: 'INVALID_API_KEY',
        message: "Clé d'accès API invalide ou manquante",
      });
    }

    return true;
  }
}
