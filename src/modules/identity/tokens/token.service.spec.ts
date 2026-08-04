import { createHash } from 'crypto';
import { TokenService } from './token.service';
import { TokenEncryptionService } from './token-encryption.service';
import { JwtService } from '@nestjs/jwt';

describe('TokenService', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'a'.repeat(48);
    process.env.REFRESH_JWT_SECRET = 'b'.repeat(48);
    process.env.TOKEN_ENCRYPTION_KEY = 'c'.repeat(48);
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.REFRESH_JWT_EXPIRES_IN = '7d';
    process.env.API_ACCESS_KEY = 'api-key';
    process.env.GOOGLE_CLIENT_ID = 'google';
    process.env.FRONTEND_BASE_URL = 'http://localhost:5173';
    process.env.SESSION_CLEANUP_DAYS = '30';
  });

  it('hashes tokens with sha256', () => {
    const service = new TokenService(
      new JwtService(),
      new TokenEncryptionService(),
    );
    const raw = 'refresh-token-value';
    expect(service.hashToken(raw)).toEqual(
      createHash('sha256').update(raw).digest('hex'),
    );
  });

  it('issues encrypted access and refresh envelopes', async () => {
    const encryption = new TokenEncryptionService();
    const service = new TokenService(new JwtService(), encryption);
    const issued = await service.issueSessionTokens({
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'user@example.com',
      role: 'USER',
      userType: 'EXTERNAL',
      sessionId: '22222222-2222-2222-2222-222222222222',
    });

    expect(issued.envelope.tokenType).toBe('Bearer');
    expect(issued.envelope.expiresIn).toBe(15 * 60);
    const rawAccess = encryption.decrypt(issued.envelope.accessToken);
    const rawRefresh = encryption.decrypt(issued.envelope.refreshToken);
    const access = await service.verifyAccessToken(rawAccess);
    const refresh = await service.verifyRefreshToken(rawRefresh);
    expect(access.typ).toBe('access');
    expect(refresh.typ).toBe('refresh');
    expect(issued.refreshTokenHash).toBe(service.hashToken(rawRefresh));
  });

  it('parses duration strings', () => {
    const service = new TokenService(
      new JwtService(),
      new TokenEncryptionService(),
    );
    expect(service.parseDurationToSeconds('15m')).toBe(900);
    expect(service.parseDurationToSeconds('7d')).toBe(604800);
  });
});
