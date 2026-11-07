# Security

## Defaults

- Helmet HTTP headers
- CORS allowlist (`CORS_*`)
- Global throttling (`THROTTLE_*`) + stricter auth routes
- ValidationPipe: `whitelist`, `forbidNonWhitelisted`, `transform`
- Argon2id password hashing
- Encrypted bearer access tokens (`TOKEN_ENCRYPTION_KEY`)
- Refresh tokens hashed in `auth_sessions`
- Fail-fast env validation at boot
- Sanitized API errors (no stacks in client responses)

## Auth stack

`ApiKeyGuard` → `JwtAuthGuard` → `RolesGuard` (when roles apply)

Wire `EncryptedBearerTokenMiddleware` for every JWT controller.

## Dependency audit

See [`dependency-audit.md`](./dependency-audit.md). CI runs `pnpm audit --prod`.
