import { jest } from '@jest/globals';
import { DomainError } from '../../../common/exceptions/domain.error';
import { AuthErrorCodes } from '../errors/auth.errors';

const verifyIdToken = jest.fn();

jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdToken;
  },
}));

const { GoogleTokenVerifierService } =
  await import('./google-token-verifier.service');

describe('GoogleTokenVerifierService', () => {
  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.REFRESH_JWT_SECRET = 'b'.repeat(32);
    process.env.TOKEN_ENCRYPTION_KEY = 'c'.repeat(32);
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.REFRESH_JWT_EXPIRES_IN = '7d';
    process.env.API_ACCESS_KEY = 'api';
    process.env.FRONTEND_BASE_URL = 'http://localhost:5173';
    process.env.SESSION_CLEANUP_DAYS = '30';
  });

  beforeEach(() => {
    verifyIdToken.mockReset();
    verifyIdToken.mockRejectedValue(new Error('invalid token'));
  });

  it('rejects an invalid Google ID token', async () => {
    const service = new GoogleTokenVerifierService();
    await expect(
      service.verifyIdToken('not-a-real-token'),
    ).rejects.toBeInstanceOf(DomainError);
    await expect(
      service.verifyIdToken('not-a-real-token'),
    ).rejects.toMatchObject({
      code: AuthErrorCodes.INVALID_GOOGLE_TOKEN,
    });
  });
});
