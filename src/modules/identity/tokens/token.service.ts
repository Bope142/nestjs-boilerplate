import { createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getAuthConfig } from '../../../config/auth.config';
import type { UserRole, UserType } from '../../../database/schema/enums';
import { TokenEncryptionService } from './token-encryption.service';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  userType: UserType;
  sessionId: string;
  typ: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  typ: 'refresh';
};

export type SessionTokenEnvelope = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
};

export type IssuedSessionTokens = {
  envelope: SessionTokenEnvelope;
  rawRefreshToken: string;
  refreshTokenHash: string;
  accessExpiresInSeconds: number;
  refreshExpiresAt: Date;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenEncryption: TokenEncryptionService,
  ) {}

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  generateOpaqueToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
  }

  async issueSessionTokens(params: {
    userId: string;
    email: string;
    role: UserRole;
    userType: UserType;
    sessionId: string;
  }): Promise<IssuedSessionTokens> {
    const config = getAuthConfig();
    const accessExpiresInSeconds = this.parseDurationToSeconds(
      config.jwtExpiresIn,
    );
    const refreshExpiresInSeconds = this.parseDurationToSeconds(
      config.refreshJwtExpiresIn,
    );

    const accessPayload: AccessTokenPayload = {
      sub: params.userId,
      email: params.email,
      role: params.role,
      userType: params.userType,
      sessionId: params.sessionId,
      typ: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: params.userId,
      sessionId: params.sessionId,
      typ: 'refresh',
    };

    const rawAccessToken = await this.jwtService.signAsync(accessPayload, {
      secret: config.jwtSecret,
      expiresIn: accessExpiresInSeconds,
    });

    const rawRefreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: config.refreshJwtSecret,
      expiresIn: refreshExpiresInSeconds,
    });

    return {
      envelope: {
        accessToken: this.tokenEncryption.encrypt(rawAccessToken),
        refreshToken: this.tokenEncryption.encrypt(rawRefreshToken),
        expiresIn: accessExpiresInSeconds,
        tokenType: 'Bearer',
      },
      rawRefreshToken,
      refreshTokenHash: this.hashToken(rawRefreshToken),
      accessExpiresInSeconds,
      refreshExpiresAt: new Date(Date.now() + refreshExpiresInSeconds * 1000),
    };
  }

  async verifyAccessToken(rawToken: string): Promise<AccessTokenPayload> {
    const config = getAuthConfig();
    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
      rawToken,
      { secret: config.jwtSecret },
    );
    if (payload.typ !== 'access') {
      throw new Error('Invalid access token type');
    }
    return payload;
  }

  async verifyRefreshToken(rawToken: string): Promise<RefreshTokenPayload> {
    const config = getAuthConfig();
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      rawToken,
      { secret: config.refreshJwtSecret },
    );
    if (payload.typ !== 'refresh') {
      throw new Error('Invalid refresh token type');
    }
    return payload;
  }

  decryptEnvelope(encryptedToken: string): string {
    return this.tokenEncryption.decrypt(encryptedToken);
  }

  parseDurationToSeconds(duration: string): number {
    const match = /^(\d+)([smhd])$/i.exec(duration.trim());
    if (!match) {
      const asNumber = Number(duration);
      if (!Number.isFinite(asNumber) || asNumber <= 0) {
        throw new Error(`Invalid duration: ${duration}`);
      }
      return asNumber;
    }
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error(`Invalid duration unit: ${duration}`);
    }
  }
}
