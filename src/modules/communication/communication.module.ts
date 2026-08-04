import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { EncryptedBearerTokenMiddleware } from '../../common/middleware/encrypted-bearer-token.middleware';
import { IdentityModule } from '../identity/identity.module';
import { DeliveriesRepository } from './deliveries/deliveries.repository';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsRepository } from './notifications/notifications.repository';
import { NotificationsService } from './notifications/notifications.service';
import { REMINDER_PORT } from './ports/reminder.port';
import { ReminderEligibilityRegistry } from './ports/reminder-eligibility.port';
import { PreferencesController } from './preferences/preferences.controller';
import { PreferencesRepository } from './preferences/preferences.repository';
import { PreferencesService } from './preferences/preferences.service';
import { RemindersController } from './reminders/reminders.controller';
import { RemindersRepository } from './reminders/reminders.repository';
import { RemindersService } from './reminders/reminders.service';

@Module({
  imports: [IdentityModule],
  controllers: [
    PreferencesController,
    RemindersController,
    NotificationsController,
  ],
  providers: [
    RemindersRepository,
    RemindersService,
    PreferencesRepository,
    PreferencesService,
    NotificationsRepository,
    NotificationsService,
    DeliveriesRepository,
    {
      provide: REMINDER_PORT,
      useExisting: RemindersService,
    },
    ReminderEligibilityRegistry,
  ],
  exports: [
    REMINDER_PORT,
    ReminderEligibilityRegistry,
    RemindersService,
    PreferencesService,
    PreferencesRepository,
    NotificationsService,
    NotificationsRepository,
    DeliveriesRepository,
    RemindersRepository,
  ],
})
export class CommunicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(EncryptedBearerTokenMiddleware)
      .forRoutes(
        PreferencesController,
        RemindersController,
        NotificationsController,
      );
  }
}
