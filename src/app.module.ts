import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './common/audit/audit.module';
import { CacheModule } from './common/cache/cache.module';
import { HttpRequestLoggingInterceptor } from './common/interceptors/http-request-logging.interceptor';
import { getThrottleConfig } from './config/throttle.config';
import { DrizzleModule } from './database/drizzle.module';
import { EmailModule } from './integrations/email/email.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { IdentityModule } from './modules/identity/identity.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const throttle = getThrottleConfig();
        return [
          {
            ttl: throttle.ttlMs,
            limit: throttle.limit,
          },
        ];
      },
    }),
    DrizzleModule,
    CacheModule,
    AuditModule,
    EmailModule,
    IdentityModule,
    CommunicationModule,
    HealthModule,
    JobsModule.register(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpRequestLoggingInterceptor,
    },
  ],
})
export class AppModule {}
