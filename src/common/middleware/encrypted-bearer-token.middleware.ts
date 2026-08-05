import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { DomainError } from '../exceptions/domain.error';
import { AuthErrorCodes } from '../../modules/identity/errors/auth.errors';
import { TokenEncryptionService } from '../../modules/identity/tokens/token-encryption.service';

export const RAW_ACCESS_TOKEN_KEY = 'rawAccessToken';

type RequestWithRawToken = Request & {
  [RAW_ACCESS_TOKEN_KEY]?: string;
};

@Injectable()
export class EncryptedBearerTokenMiddleware implements NestMiddleware {
  constructor(private readonly tokenEncryption: TokenEncryptionService) {}

  use(req: RequestWithRawToken, _res: Response, next: NextFunction): void {
    const authorization = req.header('authorization');
    if (!authorization) {
      next();
      return;
    }

    const [scheme, encryptedToken] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !encryptedToken) {
      next();
      return;
    }

    try {
      const rawJwt = this.tokenEncryption.decrypt(encryptedToken);
      req[RAW_ACCESS_TOKEN_KEY] = rawJwt;
      req.headers.authorization = `Bearer ${rawJwt}`;
      next();
    } catch {
      throw new DomainError(
        AuthErrorCodes.INVALID_TOKEN_ENVELOPE,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
