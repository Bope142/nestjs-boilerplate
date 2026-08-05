import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { AppI18nValidationPipe } from '../src/common/i18n/i18n-validation.pipe';
import { EMAIL_SENDER } from '../src/integrations/email/email-sender.port';
import { InMemoryEmailSender } from '../src/integrations/email/in-memory-email.sender';
import { validateEnvironment } from '../src/config/env.validation';
import { TokenService } from '../src/modules/identity/tokens/token.service';
import { DRIZZLE } from '../src/database/drizzle.provider';
import type { DrizzleDB } from '../src/database/types/drizzle';
import { users } from '../src/database/schema/tables/users';
import { authIdentities } from '../src/database/schema/tables/auth-identities';
import { emailVerificationTokens } from '../src/database/schema/tables/email-verification-tokens';
import { authSessions } from '../src/database/schema/tables/auth-sessions';
import { auditLogs } from '../src/database/schema/tables/audit-logs';
import { magicLinkTokens } from '../src/database/schema/tables/magic-link-tokens';
import { eq } from 'drizzle-orm';
import type {
  AuthSessionResponseDto,
  PublicUserDto,
} from '../src/modules/identity/mappers/user.mapper';

type UserResponse = { user: PublicUserDto };
type MessageResponse = { message: string };

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let mail: InMemoryEmailSender;
  let db: DrizzleDB;
  let tokenService: TokenService;
  const apiKey = process.env.API_ACCESS_KEY ?? 'change-me-api-access-key';
  const testEmail = `auth.e2e.${Date.now()}@example.com`;

  beforeAll(async () => {
    validateEnvironment();
    mail = new InMemoryEmailSender();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMAIL_SENDER)
      .useValue(mail)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new AppI18nValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    db = moduleFixture.get(DRIZZLE);
    tokenService = moduleFixture.get(TokenService);
  });

  afterAll(async () => {
    if (db) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);
      if (existing[0]) {
        await db
          .delete(authSessions)
          .where(eq(authSessions.user_id, existing[0].id));
        await db
          .delete(magicLinkTokens)
          .where(eq(magicLinkTokens.user_id, existing[0].id));
        await db
          .delete(emailVerificationTokens)
          .where(eq(emailVerificationTokens.user_id, existing[0].id));
        await db
          .delete(authIdentities)
          .where(eq(authIdentities.user_id, existing[0].id));
        await db
          .delete(auditLogs)
          .where(eq(auditLogs.actor_user_id, existing[0].id));
        await db.delete(users).where(eq(users.id, existing[0].id));
      }
    }
    await app.close();
  });

  function extractTokenFromMail(): string {
    const last = mail.sent[mail.sent.length - 1];
    expect(last).toBeDefined();
    const match = /token=([^&"'\s]+)/.exec(last.html);
    expect(match?.[1]).toBeDefined();
    return decodeURIComponent(match![1]);
  }

  function extractOtpFromMail(): string {
    const last = mail.sent[mail.sent.length - 1];
    expect(last).toBeDefined();
    const match = />\s*(\d{6})\s*</.exec(last.html);
    expect(match?.[1]).toBeDefined();
    return match![1];
  }

  it('rejects missing API key', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'x' })
      .expect(401);
  });

  it('registers with session (unverified), then verifies and logs in', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('x-api-key', apiKey)
      .send({
        email: testEmail,
        password: 'StrongPass1!',
        firstName: 'E2E',
        lastName: 'User',
      })
      .expect(201);

    const registerBody = register.body as AuthSessionResponseDto;
    expect(registerBody.user.email).toBe(testEmail);
    expect(registerBody.user.emailVerified).toBe(false);
    expect(registerBody.user).not.toHaveProperty('id');
    expect(registerBody.session.accessToken).toBeDefined();
    expect(registerBody.session.refreshToken).toBeDefined();

    const unverifiedLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-api-key', apiKey)
      .send({ email: testEmail, password: 'StrongPass1!' })
      .expect(200);

    const unverifiedLoginBody = unverifiedLogin.body as AuthSessionResponseDto;
    expect(unverifiedLoginBody.user.emailVerified).toBe(false);

    const retryWithActiveToken = await request(app.getHttpServer())
      .post('/api/auth/verify-email/retry')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${registerBody.session.accessToken}`)
      .expect(200);

    const retryWithActiveTokenBody =
      retryWithActiveToken.body as MessageResponse;
    expect(retryWithActiveTokenBody.message).toContain('déjà été envoyé');

    const meUnverified = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${registerBody.session.accessToken}`)
      .expect(403);

    expect(meUnverified.body).toMatchObject({
      code: 'AUTH_EMAIL_NOT_VERIFIED',
    });
    expect(meUnverified.headers['content-language']).toBe('fr');

    const meUnverifiedEn = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${registerBody.session.accessToken}`)
      .set('Accept-Language', 'en')
      .expect(403);

    expect(meUnverifiedEn.body).toMatchObject({
      code: 'AUTH_EMAIL_NOT_VERIFIED',
      message: 'Email address must be verified to access this resource.',
    });
    expect(meUnverifiedEn.headers['content-language']).toBe('en');

    const verificationToken = extractTokenFromMail();
    const verificationOtp = extractOtpFromMail();
    expect(verificationOtp).toMatch(/^\d{6}$/);
    expect(verificationToken).toBeDefined();

    const verified = await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${registerBody.session.accessToken}`)
      .send({ otpCode: verificationOtp })
      .expect(200);

    const verifiedBody = verified.body as UserResponse;
    expect(verifiedBody.user.emailVerified).toBe(true);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-api-key', apiKey)
      .send({ email: testEmail, password: 'StrongPass1!' })
      .expect(200);

    const loginBody = login.body as AuthSessionResponseDto;
    expect(loginBody.session.accessToken).toBeDefined();
    expect(loginBody.session.refreshToken).toBeDefined();
    expect(loginBody.user.email).toBe(testEmail);
    expect(loginBody.user.emailVerified).toBe(true);
    expect(loginBody.user).not.toHaveProperty('id');

    const me = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${loginBody.session.accessToken}`)
      .expect(200);

    const meBody = me.body as PublicUserDto;
    expect(meBody.email).toBe(testEmail);
    expect(meBody.emailVerified).toBe(true);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${loginBody.session.accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${loginBody.session.accessToken}`)
      .expect(401);
  });

  it('rejects duplicate registration safely', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('x-api-key', apiKey)
      .send({
        email: testEmail,
        password: 'StrongPass1!',
        firstName: 'Dup',
        lastName: 'User',
      })
      .expect(409);
  });

  it('does not reveal whether an email exists on magic link request', async () => {
    const known = await request(app.getHttpServer())
      .post('/api/auth/magic-link/request')
      .set('x-api-key', apiKey)
      .send({ email: testEmail })
      .expect(200);

    const unknown = await request(app.getHttpServer())
      .post('/api/auth/magic-link/request')
      .set('x-api-key', apiKey)
      .send({ email: 'nobody-exists-xyz@example.com' })
      .expect(200);

    const knownBody = known.body as MessageResponse;
    const unknownBody = unknown.body as MessageResponse;
    expect(knownBody.message).toBe(unknownBody.message);
  });

  it('rejects protected route without token', async () => {
    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('x-api-key', apiKey)
      .expect(401);
  });

  it('hashes opaque tokens consistently', () => {
    const a = tokenService.hashToken('abc');
    const b = tokenService.hashToken('abc');
    expect(a).toBe(b);
  });
});
