import { DomainError } from '../exceptions/domain.error';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  const previous = process.env.API_ACCESS_KEY;

  beforeAll(() => {
    process.env.API_ACCESS_KEY = 'test-api-key';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.REFRESH_JWT_SECRET = 'y'.repeat(32);
    process.env.TOKEN_ENCRYPTION_KEY = 'z'.repeat(32);
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.REFRESH_JWT_EXPIRES_IN = '7d';
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.FRONTEND_BASE_URL = 'http://localhost:5173';
    process.env.SESSION_CLEANUP_DAYS = '30';
  });

  afterAll(() => {
    process.env.API_ACCESS_KEY = previous;
  });

  function createContext(apiKey?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          header: (name: string) =>
            name.toLowerCase() === 'x-api-key' ? apiKey : undefined,
        }),
      }),
    } as never;
  }

  it('allows a matching API key', () => {
    const guard = new ApiKeyGuard();
    expect(guard.canActivate(createContext('test-api-key'))).toBe(true);
  });

  it('rejects a missing or invalid API key', () => {
    const guard = new ApiKeyGuard();
    expect(() => guard.canActivate(createContext())).toThrow(DomainError);
    expect(() => guard.canActivate(createContext('wrong'))).toThrow(
      DomainError,
    );
  });
});
