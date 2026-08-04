# Authentication

All auth routes live under `/api/auth` and require the `x-api-key` header unless you change `ApiKeyGuard` policy.

## Flows

### Registration and email verification

1. `POST /api/auth/register` — create account (external user, credentials provider).
2. `POST /api/auth/verify-email` — confirm email with token/OTP from mail.
3. `POST /api/auth/verify-email/retry` — resend verification (rate limited).

### Login

- `POST /api/auth/login` — email + password → access + refresh tokens.
- `POST /api/auth/google` — Google ID token login.
- `POST /api/auth/magic-link/request` — send magic link email.
- `POST /api/auth/magic-link/consume` — exchange magic link token for session.

### Session management

- `POST /api/auth/refresh` — rotate refresh token.
- `POST /api/auth/logout` — revoke current session (Bearer token).
- `POST /api/auth/logout-all` — revoke all sessions for the user.

### Password

- `POST /api/auth/forgot-password` — send reset email (no account enumeration in responses).
- `POST /api/auth/reset-password` — set new password with one-time token.
- `POST /api/auth/change-password` — authenticated user changes password; revokes other sessions per policy.

## Tokens

- **Access token:** short-lived JWT (`JWT_EXPIRES_IN`, default 15m).
- **Refresh token:** stored hashed in `auth_sessions`; rotated on refresh.
- Secrets: `JWT_SECRET`, `REFRESH_JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`.

## Roles

Database enum `user_role`: `SUPER_ADMIN`, `ADMIN`, `USER`.

- `INTERNAL` users: staff roles (`SUPER_ADMIN`, `ADMIN`).
- `EXTERNAL` users: `USER` only (enforced by DB check constraint).

Extend roles by updating `src/database/schema/enums/user-role.enum.ts`, generating a migration, and wiring guards/permissions.

## Extension points

| Area | Where to extend |
|------|-----------------|
| New OAuth provider | Add enum value in `auth_provider`, implement verifier + `AuthService` branch |
| Permissions / RBAC | Add permission tables or metadata; extend `JwtAuthGuard` / decorators |
| User profile fields | `users` table + DTOs + `UsersRepository` |
| Email templates | `src/integrations/email/templates/` |
| Audit | `AuditService` + `audit_logs` table |
| Rate limits | `@Throttle()` on controller or route |

## Security notes

- Passwords hashed with Argon2; never log credentials or token values.
- Reset, magic-link, and verification tokens stored as hashes only.
- Use `@AllowUnverifiedEmail()` sparingly for routes that must work before verification.

See also [security practices](../.cursor/rules/security.mdc) in Cursor rules.
