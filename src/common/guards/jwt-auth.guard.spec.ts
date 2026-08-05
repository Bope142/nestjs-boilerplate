import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError } from '../exceptions/domain.error';
import type { AuthenticatedActor } from '../types/authenticated-actor';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new JwtAuthGuard(reflector);

  function createContext(user?: AuthenticatedActor) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  const verifiedActor: AuthenticatedActor = {
    userId: 'u1',
    email: 'a@b.com',
    role: 'USER',
    userType: 'INTERNAL',
    status: 'ACTIVE',
    sessionId: 's1',
    emailVerified: true,
  };

  const unverifiedActor: AuthenticatedActor = {
    ...verifiedActor,
    emailVerified: false,
  };

  beforeEach(() => {
    jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockResolvedValue(true);
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows a verified authenticated user', async () => {
    await expect(guard.canActivate(createContext(verifiedActor))).resolves.toBe(
      true,
    );
  });

  it('rejects an unverified authenticated user', async () => {
    await expect(
      guard.canActivate(createContext(unverifiedActor)),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('allows unverified users on allowlisted routes', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    await expect(
      guard.canActivate(createContext(unverifiedActor)),
    ).resolves.toBe(true);
  });

  it('rejects when actor is missing after JWT activation', async () => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      DomainError,
    );
  });
});
