import { TokenEncryptionService } from './token-encryption.service';

describe('TokenEncryptionService', () => {
  const previousKey = process.env.TOKEN_ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY =
      'unit-test-token-encryption-key-32chars-min';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.REFRESH_JWT_SECRET = 'b'.repeat(32);
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.REFRESH_JWT_EXPIRES_IN = '7d';
    process.env.API_ACCESS_KEY = 'api-key';
    process.env.GOOGLE_CLIENT_ID = 'google';
    process.env.FRONTEND_BASE_URL = 'http://localhost:5173';
    process.env.SESSION_CLEANUP_DAYS = '30';
  });

  afterAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = previousKey;
  });

  it('encrypts and decrypts a JWT-like string', () => {
    const service = new TokenEncryptionService();
    const plaintext = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig';
    const envelope = service.encrypt(plaintext);
    expect(envelope).not.toEqual(plaintext);
    expect(service.decrypt(envelope)).toEqual(plaintext);
  });

  it('rejects a corrupted envelope', () => {
    const service = new TokenEncryptionService();
    expect(() => service.decrypt('not-a-valid-envelope')).toThrow();
  });
});
