import { CacheService } from './cache.service';

describe('CacheService', () => {
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn(),
    status: 'ready',
  };

  let service: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CACHE_ENABLED = 'true';
    process.env.REDIS_TTL = '3600';
    service = new CacheService(redis as never);
  });

  it('builds stable route keys with user and query hash', () => {
    const keyA = service.buildRouteKey({
      namespace: 'contribution-types',
      method: 'GET',
      path: '/api/finance/contribution-types',
      userId: 'user-1',
      query: { page: '1', pageSize: '20' },
      version: 2,
    });
    const keyB = service.buildRouteKey({
      namespace: 'contribution-types',
      method: 'GET',
      path: '/api/finance/contribution-types',
      userId: 'user-1',
      query: { pageSize: '20', page: '1' },
      version: 2,
    });

    expect(keyA).toBe(keyB);
    expect(keyA).toContain('v2');
    expect(keyA).toContain('user:user-1');
    expect(keyA).toContain('contribution-types');
  });

  it('fails open on get errors', async () => {
    redis.get.mockRejectedValueOnce(new Error('redis down'));
    await expect(service.get('k')).resolves.toBeUndefined();
  });

  it('bumps namespace version via INCR', async () => {
    redis.incr.mockResolvedValueOnce(3);
    await service.bumpNamespace('contribution-types');
    expect(redis.incr).toHaveBeenCalledWith('ns:contribution-types:v');
  });

  it('skips redis when cache is disabled', async () => {
    process.env.CACHE_ENABLED = 'false';
    service = new CacheService(redis as never);
    await service.set('k', { ok: true });
    expect(redis.set).not.toHaveBeenCalled();
  });
});
