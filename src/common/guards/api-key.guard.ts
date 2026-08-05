import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { getAuthConfig } from '../../config/auth.config';
import { DomainError } from '../exceptions/domain.error';

export const CommonErrorCodes = {
  INVALID_API_KEY: 'COMMON_INVALID_API_KEY',
} as const;

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header('x-api-key');
    const expected = getAuthConfig().apiAccessKey;

    if (!apiKey || apiKey !== expected) {
      throw new DomainError(
        CommonErrorCodes.INVALID_API_KEY,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
