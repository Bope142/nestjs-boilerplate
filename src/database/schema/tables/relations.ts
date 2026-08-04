import { relations } from 'drizzle-orm';
import { defineRelations, type PortableRelations } from '../define-relations';
import { auditLogs } from './audit-logs';
import { authIdentities } from './auth-identities';
import { authSessions } from './auth-sessions';
import { emailVerificationTokens } from './email-verification-tokens';
import { magicLinkTokens } from './magic-link-tokens';
import { passwordResetTokens } from './password-reset-tokens';
import { users } from './users';

export const usersRelations: PortableRelations = defineRelations(
  relations(users, ({ many }) => ({
    authIdentities: many(authIdentities),
    authSessions: many(authSessions),
    emailVerificationTokens: many(emailVerificationTokens),
    passwordResetTokens: many(passwordResetTokens),
    magicLinkTokens: many(magicLinkTokens),
    auditLogs: many(auditLogs),
  })),
);

export const authIdentitiesRelations: PortableRelations = defineRelations(
  relations(authIdentities, ({ one }) => ({
    user: one(users, {
      fields: [authIdentities.user_id],
      references: [users.id],
    }),
  })),
);

export const authSessionsRelations: PortableRelations = defineRelations(
  relations(authSessions, ({ one }) => ({
    user: one(users, {
      fields: [authSessions.user_id],
      references: [users.id],
    }),
  })),
);

export const emailVerificationTokensRelations: PortableRelations =
  defineRelations(
    relations(emailVerificationTokens, ({ one }) => ({
      user: one(users, {
        fields: [emailVerificationTokens.user_id],
        references: [users.id],
      }),
    })),
  );

export const passwordResetTokensRelations: PortableRelations = defineRelations(
  relations(passwordResetTokens, ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.user_id],
      references: [users.id],
    }),
  })),
);

export const magicLinkTokensRelations: PortableRelations = defineRelations(
  relations(magicLinkTokens, ({ one }) => ({
    user: one(users, {
      fields: [magicLinkTokens.user_id],
      references: [users.id],
    }),
  })),
);

export const auditLogsRelations: PortableRelations = defineRelations(
  relations(auditLogs, ({ one }) => ({
    actor: one(users, {
      fields: [auditLogs.actor_user_id],
      references: [users.id],
    }),
  })),
);
