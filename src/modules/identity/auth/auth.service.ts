import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { AuditService } from '../../../common/audit/audit.service';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { getAuthConfig } from '../../../config/auth.config';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { DrizzleDB } from '../../../database/types/drizzle';
import {
  emailAlreadyRegistered,
  invalidCredentials,
  invalidOrExpiredToken,
  invalidRefreshToken,
} from '../errors/auth.errors';
import { AuthIdentitiesRepository } from '../identities/auth-identities.repository';
import { IdentityMailService } from '../mail/identity-mail.service';
import {
  toPublicUser,
  type AuthSessionResponseDto,
  type PublicUserDto,
} from '../mappers/user.mapper';
import { SessionsRepository } from '../sessions/sessions.repository';
import {
  EmailVerificationTokensRepository,
  type EmailVerificationTokenRow,
} from '../tokens/email-verification-tokens.repository';
import { MagicLinkTokensRepository } from '../tokens/magic-link-tokens.repository';
import { PasswordResetTokensRepository } from '../tokens/password-reset-tokens.repository';
import { PasswordService } from '../tokens/password.service';
import { TokenService } from '../tokens/token.service';
import {
  buildCreateUserPayload,
  type CreateUserPayload,
} from '../users/dto/user.payload';
import { UsersRepository, type UserRow } from '../users/users.repository';
import {
  GoogleTokenVerifierService,
  type VerifiedGoogleProfile,
} from './google-token-verifier.service';
import type { AuthMethod } from '../../../database/schema/enums';
import type { EmailVerificationDto } from './dto/email-verification.dto';

export type RequestMeta = {
  ipAddress: string;
  userAgent: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly usersRepository: UsersRepository,
    private readonly identitiesRepository: AuthIdentitiesRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly emailVerificationTokensRepository: EmailVerificationTokensRepository,
    private readonly magicLinkTokensRepository: MagicLinkTokensRepository,
    private readonly passwordResetTokensRepository: PasswordResetTokensRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly identityMailService: IdentityMailService,
    private readonly auditService: AuditService,
    private readonly googleTokenVerifier: GoogleTokenVerifierService,
  ) {}

  async register(
    input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
    meta: RequestMeta,
  ): Promise<AuthSessionResponseDto> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.register',
        targetType: 'user',
        targetId: existing.id,
        metadata: { reason: 'EMAIL_ALREADY_REGISTERED', email },
      });
      emailAlreadyRegistered();
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const rawVerificationToken = this.tokenService.generateOpaqueToken();
    const verificationOtpCode = this.generateVerificationOtpCode();
    const tokenHash = this.tokenService.hashToken(rawVerificationToken);
    const otpHash = this.tokenService.hashToken(verificationOtpCode);
    const expiresAt = new Date(
      Date.now() + getAuthConfig().emailVerificationTtlMinutes * 60 * 1000,
    );

    const { user, identityId } = await this.db.transaction(async (tx) => {
      const createPayload: CreateUserPayload = buildCreateUserPayload({
        email,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim() || null,
      });
      const created = await this.usersRepository.create(createPayload, tx);

      const identity =
        await this.identitiesRepository.createCredentialsIdentity(
          {
            user_id: created.id,
            password_hash: passwordHash,
            provider_email: email,
          },
          tx,
        );

      await this.emailVerificationTokensRepository.create(
        {
          user_id: created.id,
          token_hash: tokenHash,
          otp_hash: otpHash,
          expires_at: expiresAt,
        },
        tx,
      );

      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.register',
          actorUserId: created.id,
          targetType: 'user',
          targetId: created.id,
        },
        tx,
      );

      return { user: created, identityId: identity.id };
    });

    try {
      await this.identityMailService.sendEmailVerification({
        to: user.email,
        firstName: user.first_name,
        rawToken: rawVerificationToken,
        otpCode: verificationOtpCode,
      });
    } catch (error) {
      await this.auditService.failureSafe({
        type: 'COMMUNICATION',
        action: 'auth.register.email_send',
        actorUserId: user.id,
        targetType: 'user',
        targetId: user.id,
        metadata: { reason: 'EMAIL_SEND_FAILED' },
      });
      this.logger.error('Failed to send email verification after register');
      throw error;
    }

    return this.createAuthenticatedSession({
      user,
      authMethod: 'CREDENTIALS',
      identityId,
      meta,
      auditAction: null,
    });
  }

  async verifyEmail(
    actor: AuthenticatedActor,
    input: EmailVerificationDto,
  ): Promise<{ user: PublicUserDto }> {
    const now = new Date();
    const pending: EmailVerificationTokenRow | null =
      await this.findPendingEmailVerification(input);

    if (
      pending == null ||
      pending.user_id !== actor.userId ||
      pending.expires_at.getTime() <= now.getTime()
    ) {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.verify_email',
        actorUserId: pending?.user_id,
        targetType: 'email_verification_token',
        metadata: { reason: 'INVALID_OR_EXPIRED_TOKEN' },
      });
      invalidOrExpiredToken('INVALID_EMAIL_VERIFICATION_TOKEN');
    }

    const token: EmailVerificationTokenRow = pending;

    const user = await this.db.transaction(async (tx) => {
      await this.emailVerificationTokensRepository.markVerified(
        token.id,
        now,
        tx,
      );
      const updated = await this.usersRepository.markEmailVerified(
        token.user_id,
        now,
        tx,
      );
      if (!updated) {
        invalidOrExpiredToken('INVALID_EMAIL_VERIFICATION_TOKEN');
      }

      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.verify_email',
          actorUserId: updated.id,
          targetType: 'user',
          targetId: updated.id,
        },
        tx,
      );

      return updated;
    });

    try {
      await this.identityMailService.sendWelcome({
        to: user.email,
        firstName: user.first_name,
      });
    } catch {
      this.logger.warn('Welcome email failed after verify; continuing');
    }

    return { user: toPublicUser(user) };
  }

  async retryEmailVerification(
    actor: AuthenticatedActor,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(actor.userId);
    if (!user || user.status !== 'ACTIVE') {
      invalidCredentials();
    }

    if (user.email_verified_at) {
      return { message: "L'adresse e-mail est déjà vérifiée." };
    }

    const now = new Date();
    const existing =
      await this.emailVerificationTokensRepository.findActiveByUserId(
        user.id,
        now,
      );
    if (existing) {
      return {
        message:
          'Un code de vérification valide a déjà été envoyé. Vérifiez votre boîte e-mail.',
      };
    }

    const rawVerificationToken = this.tokenService.generateOpaqueToken();
    const verificationOtpCode = this.generateVerificationOtpCode();
    const tokenHash = this.tokenService.hashToken(rawVerificationToken);
    const otpHash = this.tokenService.hashToken(verificationOtpCode);
    const expiresAt = new Date(
      Date.now() + getAuthConfig().emailVerificationTtlMinutes * 60 * 1000,
    );

    await this.db.transaction(async (tx) => {
      await this.emailVerificationTokensRepository.create(
        {
          user_id: user.id,
          token_hash: tokenHash,
          otp_hash: otpHash,
          expires_at: expiresAt,
        },
        tx,
      );

      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.verify_email.retry',
          actorUserId: user.id,
          targetType: 'user',
          targetId: user.id,
        },
        tx,
      );
    });

    try {
      await this.identityMailService.sendEmailVerification({
        to: user.email,
        firstName: user.first_name,
        rawToken: rawVerificationToken,
        otpCode: verificationOtpCode,
      });
    } catch (error) {
      await this.auditService.failureSafe({
        type: 'COMMUNICATION',
        action: 'auth.verify_email.retry.email_send',
        actorUserId: user.id,
        targetType: 'user',
        targetId: user.id,
        metadata: { reason: 'EMAIL_SEND_FAILED' },
      });
      this.logger.error('Failed to resend email verification');
      throw error;
    }

    return {
      message: 'Un nouveau code de vérification a été envoyé.',
    };
  }

  async login(
    input: { email: string; password: string },
    meta: RequestMeta,
  ): Promise<AuthSessionResponseDto> {
    const email = input.email.trim().toLowerCase();
    const user = await this.usersRepository.findByEmail(email);

    if (!user || user.status !== 'ACTIVE') {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.login',
        ipAddress: meta.ipAddress,
        metadata: { reason: 'INVALID_CREDENTIALS', email },
      });
      invalidCredentials();
    }

    const identity = await this.identitiesRepository.findByUserAndProvider(
      user.id,
      'CREDENTIALS',
    );
    if (!identity?.password_hash) {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.login',
        actorUserId: user.id,
        ipAddress: meta.ipAddress,
        metadata: { reason: 'MISSING_CREDENTIALS_IDENTITY' },
      });
      invalidCredentials();
    }

    const passwordOk = await this.passwordService.verify(
      identity.password_hash,
      input.password,
    );
    if (!passwordOk) {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.login',
        actorUserId: user.id,
        ipAddress: meta.ipAddress,
        metadata: { reason: 'INVALID_PASSWORD' },
      });
      invalidCredentials();
    }

    return this.createAuthenticatedSession({
      user,
      authMethod: 'CREDENTIALS',
      identityId: identity.id,
      meta,
      auditAction: 'auth.login',
    });
  }

  async loginWithGoogle(
    idToken: string,
    meta: RequestMeta,
  ): Promise<AuthSessionResponseDto> {
    let profile: VerifiedGoogleProfile;
    try {
      profile = await this.googleTokenVerifier.verifyIdToken(idToken);
    } catch (error) {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.google_login',
        ipAddress: meta.ipAddress,
        metadata: { reason: 'INVALID_GOOGLE_TOKEN' },
      });
      throw error;
    }

    const now = new Date();

    try {
      const result = await this.db.transaction(async (tx) => {
        let identity = await this.identitiesRepository.findByProviderSubject(
          'GOOGLE',
          profile.subject,
          tx,
        );

        let user: UserRow | null =
          identity != null
            ? await this.usersRepository.findById(identity.user_id, tx)
            : null;

        if (!user) {
          user = await this.usersRepository.findByEmail(profile.email, tx);
        }

        if (!user) {
          const createPayload: CreateUserPayload = buildCreateUserPayload({
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            emailVerifiedAt: profile.emailVerified ? now : null,
          });
          user = await this.usersRepository.create(createPayload, tx);
          identity = await this.identitiesRepository.createGoogleIdentity(
            {
              user_id: user.id,
              provider_subject: profile.subject,
              provider_email: profile.email,
            },
            tx,
          );
        } else if (!identity) {
          identity = await this.identitiesRepository.createGoogleIdentity(
            {
              user_id: user.id,
              provider_subject: profile.subject,
              provider_email: profile.email,
            },
            tx,
          );
          if (profile.emailVerified && !user.email_verified_at) {
            user =
              (await this.usersRepository.markEmailVerified(
                user.id,
                now,
                tx,
              )) ?? user;
          }
        }

        if (!user || user.status !== 'ACTIVE' || !identity) {
          invalidCredentials();
        }

        await this.auditService.success(
          {
            type: 'AUTH',
            action: 'auth.google_login',
            actorUserId: user.id,
            targetType: 'user',
            targetId: user.id,
            ipAddress: meta.ipAddress,
          },
          tx,
        );

        return { user, identityId: identity.id };
      });

      return this.createAuthenticatedSession({
        user: result.user,
        authMethod: 'GOOGLE',
        identityId: result.identityId,
        meta,
        auditAction: null,
      });
    } catch (error) {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.google_login',
        ipAddress: meta.ipAddress,
        metadata: { reason: 'GOOGLE_LOGIN_FAILED', email: profile.email },
      });
      throw error;
    }
  }

  async requestMagicLink(email: string): Promise<{ message: string }> {
    const neutral = {
      message:
        'Si un compte existe pour cet e-mail, un lien magique a été envoyé.',
    };
    const normalized = email.trim().toLowerCase();
    const user = await this.usersRepository.findByEmail(normalized);
    if (!user || user.status !== 'ACTIVE') {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.magic_link_request',
        metadata: { reason: 'USER_NOT_FOUND_OR_INACTIVE', email: normalized },
      });
      return neutral;
    }

    const rawToken = this.tokenService.generateOpaqueToken();
    const tokenHash = this.tokenService.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + getAuthConfig().magicLinkTtlMinutes * 60 * 1000,
    );

    await this.db.transaction(async (tx) => {
      await this.magicLinkTokensRepository.create(
        {
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        },
        tx,
      );
      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.magic_link_request',
          actorUserId: user.id,
          targetType: 'user',
          targetId: user.id,
        },
        tx,
      );
    });

    try {
      await this.identityMailService.sendMagicLink({
        to: user.email,
        firstName: user.first_name,
        rawToken,
      });
    } catch (error) {
      await this.auditService.failureSafe({
        type: 'COMMUNICATION',
        action: 'auth.magic_link_request.email_send',
        actorUserId: user.id,
        targetType: 'user',
        targetId: user.id,
        metadata: { reason: 'EMAIL_SEND_FAILED' },
      });
      this.logger.error('Failed to send magic link email');
      throw error;
    }

    return neutral;
  }

  async consumeMagicLink(
    rawToken: string,
    meta: RequestMeta,
  ): Promise<AuthSessionResponseDto> {
    const tokenHash = this.tokenService.hashToken(rawToken);
    const now = new Date();
    const pending =
      await this.magicLinkTokensRepository.findUnusedByHash(tokenHash);

    if (!pending || pending.expires_at.getTime() <= now.getTime()) {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.magic_link_consume',
        actorUserId: pending?.user_id,
        ipAddress: meta.ipAddress,
        metadata: { reason: 'INVALID_OR_EXPIRED_TOKEN' },
      });
      invalidOrExpiredToken('INVALID_MAGIC_LINK_TOKEN');
    }

    const user = await this.db.transaction(async (tx) => {
      await this.magicLinkTokensRepository.markUsed(pending.id, now, tx);
      let found = await this.usersRepository.findById(pending.user_id, tx);
      if (!found || found.status !== 'ACTIVE') {
        invalidOrExpiredToken('INVALID_MAGIC_LINK_TOKEN');
      }

      if (!found.email_verified_at) {
        found =
          (await this.usersRepository.markEmailVerified(found.id, now, tx)) ??
          found;
      }

      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.magic_link_consume',
          actorUserId: found.id,
          targetType: 'user',
          targetId: found.id,
          ipAddress: meta.ipAddress,
        },
        tx,
      );

      return found;
    });

    return this.createAuthenticatedSession({
      user,
      authMethod: 'MAGIC_LINK',
      identityId: null,
      meta,
      auditAction: null,
    });
  }

  async refresh(
    encryptedRefreshToken: string,
    meta: RequestMeta,
  ): Promise<AuthSessionResponseDto> {
    let rawRefresh: string;
    try {
      rawRefresh = this.tokenService.decryptEnvelope(encryptedRefreshToken);
    } catch {
      await this.auditService.failureSafe({
        type: 'SECURITY',
        action: 'auth.refresh',
        ipAddress: meta.ipAddress,
        metadata: { reason: 'INVALID_TOKEN_ENVELOPE' },
      });
      invalidRefreshToken();
    }

    let payload: Awaited<ReturnType<TokenService['verifyRefreshToken']>>;
    try {
      payload = await this.tokenService.verifyRefreshToken(rawRefresh);
    } catch {
      await this.auditService.failureSafe({
        type: 'SECURITY',
        action: 'auth.refresh',
        ipAddress: meta.ipAddress,
        metadata: { reason: 'INVALID_REFRESH_JWT' },
      });
      invalidRefreshToken();
    }

    const presentedHash = this.tokenService.hashToken(rawRefresh);
    const existing =
      await this.sessionsRepository.findByRefreshHashIncludingRevoked(
        presentedHash,
      );

    if (!existing) {
      await this.auditService.failureSafe({
        type: 'SECURITY',
        action: 'auth.refresh',
        ipAddress: meta.ipAddress,
        metadata: { reason: 'SESSION_NOT_FOUND' },
      });
      invalidRefreshToken();
    }

    if (existing.revoked_at) {
      await this.sessionsRepository.revokeAllForUser(
        existing.user_id,
        'REFRESH_TOKEN_REUSE',
      );
      await this.auditService.failureSafe({
        type: 'SECURITY',
        action: 'auth.refresh_reuse_detected',
        actorUserId: existing.user_id,
        targetType: 'auth_session',
        targetId: existing.id,
        ipAddress: meta.ipAddress,
      });
      invalidRefreshToken();
    }

    if (
      existing.expires_at.getTime() <= Date.now() ||
      existing.id !== payload.sessionId ||
      existing.user_id !== payload.sub
    ) {
      await this.auditService.failureSafe({
        type: 'SECURITY',
        action: 'auth.refresh',
        actorUserId: existing.user_id,
        targetType: 'auth_session',
        targetId: existing.id,
        ipAddress: meta.ipAddress,
        metadata: { reason: 'SESSION_MISMATCH_OR_EXPIRED' },
      });
      invalidRefreshToken();
    }

    const user = await this.usersRepository.findById(existing.user_id);
    if (!user || user.status !== 'ACTIVE') {
      await this.auditService.failureSafe({
        type: 'AUTH',
        action: 'auth.refresh',
        actorUserId: existing.user_id,
        ipAddress: meta.ipAddress,
        metadata: { reason: 'USER_INACTIVE' },
      });
      invalidRefreshToken();
    }

    const nextTokens = await this.tokenService.issueSessionTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      userType: user.user_type,
      sessionId: existing.id,
    });

    await this.db.transaction(async (tx) => {
      const updated = await this.sessionsRepository.rotateRefreshToken(
        existing.id,
        nextTokens.refreshTokenHash,
        nextTokens.refreshExpiresAt,
        tx,
      );
      if (!updated) {
        invalidRefreshToken();
      }
      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.refresh',
          actorUserId: user.id,
          targetType: 'auth_session',
          targetId: existing.id,
          ipAddress: meta.ipAddress,
        },
        tx,
      );
    });

    return {
      session: nextTokens.envelope,
      user: toPublicUser(user),
    };
  }

  async logout(actor: AuthenticatedActor, meta: RequestMeta): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.sessionsRepository.revoke(actor.sessionId, 'LOGOUT', tx);
      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.logout',
          actorUserId: actor.userId,
          targetType: 'auth_session',
          targetId: actor.sessionId,
          ipAddress: meta.ipAddress,
        },
        tx,
      );
    });
  }

  async logoutAll(actor: AuthenticatedActor, meta: RequestMeta): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.sessionsRepository.revokeAllForUser(
        actor.userId,
        'LOGOUT_ALL',
        tx,
      );
      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.logout_all',
          actorUserId: actor.userId,
          targetType: 'user',
          targetId: actor.userId,
          ipAddress: meta.ipAddress,
        },
        tx,
      );
    });
  }

  /**
   * Always returns the same shape (no email enumeration).
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const normalized = email.trim().toLowerCase();
    const user = await this.usersRepository.findByEmail(normalized);
    const message =
      'If an account exists for this email, a reset link has been sent.';

    if (!user) {
      return { message };
    }

    const identity = await this.identitiesRepository.findByUserAndProvider(
      user.id,
      'CREDENTIALS',
    );
    if (!identity?.password_hash) {
      return { message };
    }

    const now = new Date();
    const active = await this.passwordResetTokensRepository.findActiveByUserId(
      user.id,
      now,
    );
    if (active) {
      return { message };
    }

    const rawToken = this.tokenService.generateOpaqueToken();
    const tokenHash = this.tokenService.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + getAuthConfig().passwordResetTtlMinutes * 60 * 1000,
    );

    await this.passwordResetTokensRepository.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    try {
      await this.identityMailService.sendPasswordReset({
        to: user.email,
        firstName: user.first_name,
        rawToken,
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to send password reset email for user ${user.id}`,
      );
      this.logger.debug(error instanceof Error ? error.message : String(error));
    }

    await this.auditService.success({
      type: 'AUTH',
      action: 'auth.password_reset_request',
      actorUserId: user.id,
      targetType: 'user',
      targetId: user.id,
    });

    return { message };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashToken(token);
    const row =
      await this.passwordResetTokensRepository.findUnusedByHash(tokenHash);
    if (!row || row.expires_at.getTime() <= Date.now()) {
      invalidOrExpiredToken('INVALID_OR_EXPIRED_RESET_TOKEN');
    }

    const identity = await this.identitiesRepository.findByUserAndProvider(
      row.user_id,
      'CREDENTIALS',
    );
    if (!identity) {
      invalidOrExpiredToken('INVALID_OR_EXPIRED_RESET_TOKEN');
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    const now = new Date();

    await this.db.transaction(async (tx) => {
      await this.identitiesRepository.updatePasswordHash(
        identity.id,
        passwordHash,
        tx,
      );
      await this.passwordResetTokensRepository.markUsed(row.id, now, tx);
      await this.sessionsRepository.revokeAllForUser(
        row.user_id,
        'PASSWORD_CHANGED',
        tx,
      );
      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.password_reset',
          actorUserId: row.user_id,
          targetType: 'user',
          targetId: row.user_id,
        },
        tx,
      );
    });

    return { message: 'Password has been reset. Please sign in again.' };
  }

  async changePassword(
    actor: AuthenticatedActor,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const identity = await this.identitiesRepository.findByUserAndProvider(
      actor.userId,
      'CREDENTIALS',
    );
    if (!identity?.password_hash) {
      throw new BadRequestException({
        code: 'PASSWORD_CHANGE_UNAVAILABLE',
        message: 'Password change is not available for this account',
      });
    }

    const valid = await this.passwordService.verify(
      identity.password_hash,
      currentPassword,
    );
    if (!valid) {
      invalidCredentials();
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.db.transaction(async (tx) => {
      await this.identitiesRepository.updatePasswordHash(
        identity.id,
        passwordHash,
        tx,
      );
      await this.sessionsRepository.revokeAllForUser(
        actor.userId,
        'PASSWORD_CHANGED',
        tx,
      );
      await this.auditService.success(
        {
          type: 'AUTH',
          action: 'auth.password_change',
          actorUserId: actor.userId,
          targetType: 'user',
          targetId: actor.userId,
        },
        tx,
      );
    });

    return {
      message: 'Password changed. All sessions were revoked; please sign in.',
    };
  }

  private async createAuthenticatedSession(params: {
    user: UserRow;
    authMethod: AuthMethod;
    identityId: string | null;
    meta: RequestMeta;
    auditAction: string | null;
  }): Promise<AuthSessionResponseDto> {
    const sessionId = randomUUID();
    const tokens = await this.tokenService.issueSessionTokens({
      userId: params.user.id,
      email: params.user.email,
      role: params.user.role,
      userType: params.user.user_type,
      sessionId,
    });
    const now = new Date();

    await this.db.transaction(async (tx) => {
      await this.sessionsRepository.create(
        {
          id: sessionId,
          user_id: params.user.id,
          auth_method: params.authMethod,
          refresh_token_hash: tokens.refreshTokenHash,
          ip_address: params.meta.ipAddress,
          user_agent: params.meta.userAgent,
          expires_at: tokens.refreshExpiresAt,
        },
        tx,
      );

      if (params.identityId) {
        await this.identitiesRepository.touchLastUsed(
          params.identityId,
          now,
          tx,
        );
      }

      await this.usersRepository.touchLastLogin(params.user.id, now, tx);

      if (params.auditAction) {
        await this.auditService.success(
          {
            type: 'AUTH',
            action: params.auditAction,
            actorUserId: params.user.id,
            targetType: 'auth_session',
            targetId: sessionId,
            ipAddress: params.meta.ipAddress,
          },
          tx,
        );
      }
    });

    return {
      session: tokens.envelope,
      user: toPublicUser(params.user),
    };
  }

  private generateVerificationOtpCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async findPendingEmailVerification(
    input: EmailVerificationDto,
  ): Promise<EmailVerificationTokenRow | null> {
    if (input.token) {
      return this.emailVerificationTokensRepository.findUnusedByHash(
        this.tokenService.hashToken(input.token),
      );
    }

    if (input.otpCode) {
      return this.emailVerificationTokensRepository.findUnusedByOtpHash(
        this.tokenService.hashToken(input.otpCode),
      );
    }

    return null;
  }
}
