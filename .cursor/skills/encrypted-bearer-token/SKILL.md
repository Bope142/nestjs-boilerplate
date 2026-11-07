---
name: encrypted-bearer-token
description: >-
  Wire EncryptedBearerTokenMiddleware forRoutes when adding JWT controllers.
  Use when creating/moving Nest controllers with JwtAuthGuard, debugging 401
  Unauthorized with a valid login token while /users/me works, or reviewing
  module NestModule.configure middleware lists.
---

# Encrypted Bearer Token Middleware

## Why

Session access tokens returned by auth are **encrypted envelopes** (`TokenEncryptionService`), not raw JWTs. Passport JWT verification requires a three-segment JWT. Without middleware decryption, guards fail with a bare Nest/Passport `401 Unauthorized` (`code: INTERNAL_SERVER_ERROR` in the filter — no `AUTH_*` code).

## When to use

- New JWT-authenticated controller
- Controller moved between modules
- New Nest module that exposes JWT routes
- Symptom: same `staff_access_token` / client token works on `/users/me` but 401 on the new path; HTTP log line missing for the failing route

## Procedure

1. Open the owning module’s `configure(consumer: MiddlewareConsumer)` (implements `NestModule`).
2. Ensure:

```ts
consumer
  .apply(EncryptedBearerTokenMiddleware)
  .forRoutes(
    // existing controllers…
    NewJwtController, // ← add every JwtAuthGuard controller
  );
```

3. Import the middleware from `src/common/middleware/encrypted-bearer-token.middleware.ts`.
4. Mirror **every** entry in `controllers: […]` that uses JWT — if it is JWT and not in `forRoutes`, it will 401 with login tokens.
5. Public-only controllers (no JWT) may omit `forRoutes` (e.g. pure public catalog). Prefer omitting only when there is no Bearer auth on that controller.

## Existing module owners

| Module | File |
|---|---|
| Identity | `src/modules/identity/identity.module.ts` |
| Marketplace | `src/modules/marketplace/marketplace.module.ts` |
| Communication | `src/modules/communication/communication.module.ts` |
| Tracking | `src/modules/marketplace/tracking/tracking.module.ts` |
| Merchant settlements | `src/modules/marketplace/merchant-settlements/merchant-settlements.module.ts` |

## Verify

1. Login via Postman (encrypted `session.accessToken`).
2. Call the new route with that Bearer + `x-api-key` + `X-Wapigo-Platform`.
3. Expect 2xx / business 4xx — not bare Passport `Unauthorized`.
4. Confirm an HTTP log line appears for the route (guards passed far enough for the interceptor).

## Related

- Rule: `.cursor/rules/encrypted-bearer-token.mdc`
- Skill: `create-secure-endpoint` (auth stack checklist)
- Middleware: `src/common/middleware/encrypted-bearer-token.middleware.ts`
