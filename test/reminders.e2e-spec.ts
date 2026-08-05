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
import { DRIZZLE } from '../src/database/drizzle.provider';
import type { DrizzleDB } from '../src/database/types/drizzle';
import { users } from '../src/database/schema/tables/users';
import { authIdentities } from '../src/database/schema/tables/auth-identities';
import { authSessions } from '../src/database/schema/tables/auth-sessions';
import { auditLogs } from '../src/database/schema/tables/audit-logs';
import { reminders } from '../src/database/schema/tables/reminders';
import { reminderTimeSlots } from '../src/database/schema/tables/reminder-time-slots';
import { userNotificationPreferences } from '../src/database/schema/tables/user-notification-preferences';
import { eq, inArray } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import type { AuthSessionResponseDto } from '../src/modules/identity/mappers/user.mapper';
import type { ReminderResponseDto } from '../src/modules/communication/reminders/dto/reminder-response.dto';
import type { NotificationPreferencesResponseDto } from '../src/modules/communication/preferences/dto/notification-preferences.dto';
import type { PaginatedResponse } from '../src/common/types/paginated-response';

describe('Reminders (e2e)', () => {
  let app: INestApplication<App>;
  let db: DrizzleDB;
  const apiKey = process.env.API_ACCESS_KEY ?? 'change-me-api-access-key';
  const stamp = Date.now();
  const userEmail = `user.rem.e2e.${stamp}@example.com`;
  const password = 'StrongPass1!';
  let userAccessToken = '';
  const reminderIds: string[] = [];
  let userId = '';

  beforeAll(async () => {
    process.env.JOBS_ENABLED = 'false';
    validateEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMAIL_SENDER)
      .useValue(new InMemoryEmailSender())
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

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });
    const [user] = await db
      .insert(users)
      .values({
        email: userEmail,
        first_name: 'E2E',
        last_name: 'User',
        user_type: 'EXTERNAL',
        role: 'USER',
        status: 'ACTIVE',
        email_verified_at: new Date(),
      })
      .returning();
    userId = user.id;

    await db.insert(authIdentities).values({
      user_id: user.id,
      provider: 'CREDENTIALS',
      provider_email: userEmail,
      password_hash: passwordHash,
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-api-key', apiKey)
      .send({ email: userEmail, password })
      .expect(200);
    userAccessToken = (login.body as AuthSessionResponseDto).session
      .accessToken;
  });

  afterAll(async () => {
    if (db) {
      if (reminderIds.length > 0) {
        await db
          .delete(reminderTimeSlots)
          .where(inArray(reminderTimeSlots.reminder_id, reminderIds));
        await db.delete(reminders).where(inArray(reminders.id, reminderIds));
      }
      if (userId) {
        await db
          .delete(userNotificationPreferences)
          .where(eq(userNotificationPreferences.user_id, userId));
        await db.delete(auditLogs).where(eq(auditLogs.actor_user_id, userId));
        await db.delete(authSessions).where(eq(authSessions.user_id, userId));
        await db
          .delete(authIdentities)
          .where(eq(authIdentities.user_id, userId));
        await db.delete(users).where(eq(users.id, userId));
      }
    }
    await app.close();
  });

  it('gets and updates notification preferences', async () => {
    const getRes = await request(app.getHttpServer())
      .get('/api/communication/notification-preferences/me')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(200);
    const prefs = getRes.body as NotificationPreferencesResponseDto;
    expect(prefs.remindersEnabled).toBe(true);

    const patchRes = await request(app.getHttpServer())
      .patch('/api/communication/notification-preferences/me')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({ remindersEnabled: false, timezone: 'Africa/Kinshasa' })
      .expect(200);
    const updated = patchRes.body as NotificationPreferencesResponseDto;
    expect(updated.remindersEnabled).toBe(false);
  });

  it('creates a daily reminder and enforces ownership on list', async () => {
    const resourceId = randomUUID();
    const createRes = await request(app.getHttpServer())
      .post('/api/communication/reminders')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        resourceType: 'GENERIC',
        resourceId,
        scheduleType: 'DAILY',
        channels: ['EMAIL', 'IN_APP'],
        timeSlots: ['09:00'],
        title: 'Rappel test',
        templateKey: 'generic',
      })
      .expect(201);

    const created = createRes.body as ReminderResponseDto;
    reminderIds.push(created.id);
    expect(created.nextRunAt).toBeTruthy();

    const listRes = await request(app.getHttpServer())
      .get('/api/communication/reminders')
      .set('x-api-key', apiKey)
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(200);
    const listBody = listRes.body as PaginatedResponse<ReminderResponseDto>;
    expect(listBody.data.every((r) => r.userId === userId)).toBe(true);
  });
});
