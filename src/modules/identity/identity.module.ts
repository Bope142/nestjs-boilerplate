import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EncryptedBearerTokenMiddleware } from '../../common/middleware/encrypted-bearer-token.middleware';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { GoogleTokenVerifierService } from './auth/google-token-verifier.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { AuthIdentitiesRepository } from './identities/auth-identities.repository';
import { IdentityMailService } from './mail/identity-mail.service';
import { SessionsRepository } from './sessions/sessions.repository';
import { EmailVerificationTokensRepository } from './tokens/email-verification-tokens.repository';
import { MagicLinkTokensRepository } from './tokens/magic-link-tokens.repository';
import { PasswordResetTokensRepository } from './tokens/password-reset-tokens.repository';
import { PasswordService } from './tokens/password.service';
import { TokenEncryptionService } from './tokens/token-encryption.service';
import { TokenService } from './tokens/token.service';
import { UsersController } from './users/users.controller';
import { UsersRepository } from './users/users.repository';
import { UsersService } from './users/users.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    AuthService,
    UsersService,
    UsersRepository,
    AuthIdentitiesRepository,
    SessionsRepository,
    EmailVerificationTokensRepository,
    MagicLinkTokensRepository,
    PasswordResetTokensRepository,
    PasswordService,
    TokenEncryptionService,
    TokenService,
    IdentityMailService,
    GoogleTokenVerifierService,
    JwtStrategy,
  ],
  exports: [UsersRepository, TokenEncryptionService, TokenService],
})
export class IdentityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(EncryptedBearerTokenMiddleware)
      .forRoutes(UsersController, AuthController);
  }
}
