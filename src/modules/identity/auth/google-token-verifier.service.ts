import { HttpStatus, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { DomainError } from '../../../common/exceptions/domain.error';
import { getAuthConfig } from '../../../config/auth.config';
import { AuthErrorCodes } from '../errors/auth.errors';

export type VerifiedGoogleProfile = {
  subject: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
};

@Injectable()
export class GoogleTokenVerifierService {
  private readonly client = new OAuth2Client();

  async verifyIdToken(idToken: string): Promise<VerifiedGoogleProfile> {
    const audience = getAuthConfig().googleClientId;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        throw new Error('Missing Google profile fields');
      }

      return {
        subject: payload.sub,
        email: payload.email.toLowerCase(),
        emailVerified: payload.email_verified === true,
        firstName: payload.given_name?.trim() || 'Google',
        lastName: payload.family_name?.trim() || 'User',
        displayName: payload.name?.trim() || null,
        avatarUrl: payload.picture ?? null,
      };
    } catch {
      throw new DomainError(
        AuthErrorCodes.INVALID_GOOGLE_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
