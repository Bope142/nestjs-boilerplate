import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getAuthConfig } from '../../../config/auth.config';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import type { AccessTokenPayload } from '../tokens/token.service';
import { SessionsRepository } from '../sessions/sessions.repository';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sessionsRepository: SessionsRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getAuthConfig().jwtSecret,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedActor> {
    if (payload.typ !== 'access' || !payload.sub || !payload.sessionId) {
      throw new UnauthorizedException({
        code: 'INVALID_ACCESS_TOKEN',
        message: "Jeton d'accès invalide",
      });
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'USER_INACTIVE',
        message: "Le compte utilisateur n'est pas actif",
      });
    }

    const session = await this.sessionsRepository.findById(payload.sessionId);
    if (
      !session ||
      session.user_id !== user.id ||
      session.revoked_at ||
      session.expires_at.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException({
        code: 'SESSION_INVALID',
        message: 'Session invalide ou expirée',
      });
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      userType: user.user_type,
      status: user.status,
      sessionId: session.id,
      emailVerified: user.email_verified_at != null,
    };
  }
}
