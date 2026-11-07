---
name: create-secure-endpoint
description: Implement a secure, documented NestJS REST endpoint with auth, RBAC, validation, and data integrity for this boilerplate.
---

# Create Secure Endpoint

Use this skill for any new or changed HTTP endpoint.

## Procedure

1. Define actor, permission, resource, and business outcome.
2. Define request DTO and response DTO.
3. Identify abuse, enumeration, race, IDOR, and (for money workflows) duplicate/retry risks.
4. Add authentication and permission guards (`ApiKeyGuard`, `JwtAuthGuard`, `WapigoPlatformGuard` on JWT routes, `RolesGuard` when roles apply).
5. Register the controller in the module’s `EncryptedBearerTokenMiddleware` `.forRoutes(…)` (login tokens are encrypted — see rule/skill `encrypted-bearer-token`).
6. Resolve the authenticated actor from trusted auth context — never from body roles or IDs for authorization.
7. Ensure `X-Wapigo-Platform` matches the actor role on authenticated / session-issuing routes (see rule `wapigo-platform-header`).
8. Apply resource policies when ownership or state matters (e.g. user-owned resources, open sessions).
9. Explicitly map accepted DTO fields.
10. Use a transaction when multiple state changes must be atomic (especially payments + receipts).
11. Add safe error mapping with stable codes.
12. Add Swagger documentation (include `X-Wapigo-Platform` when the guard applies).
13. Add `@CacheRoute` / `@InvalidateCache` for resource reads and mutations (see rule `http-response-cache`).
14. Update Postman when the collection covers the flow; for backoffice/mobile handoffs, update `docs/*.md` with **full enums** and **nullable fields** (see rule `update-api-docs`).
15. Prefer nested **entity refs** (`UserRefDto` / `MerchantRefDto`) over bare `*UserId` / `*MerchantId` when the UI must show a name (see rule `api-entity-refs` / skill `api-entity-refs`).
16. Add unit, integration, or e2e tests.
17. Run relevant pnpm scripts (`pnpm run lint` mandatory).

Add tenant isolation only when the product needs it.

## Endpoint checklist

- [ ] Authentication is required or public access is explicitly justified.
- [ ] JWT controller is listed in `EncryptedBearerTokenMiddleware` `.forRoutes(…)` of its Nest module.
- [ ] `X-Wapigo-Platform` is required on JWT / session-issuing routes (omit on public routes that do not need it).
- [ ] Required permission is declared.
- [ ] Account / session activity rules are enforced when they exist.
- [ ] Server-managed fields are not accepted from input (`status`, `receiptNumber`, `createdBy`, balances).
- [ ] DTO validation includes limits, amounts, and currencies when relevant.
- [ ] Unknown DTO fields are rejected globally.
- [ ] Sorting and filtering fields are allowlisted.
- [ ] Response hides internal and sensitive fields.
- [ ] Rate limiting is considered (stricter for auth, webhooks, exports).
- [ ] Idempotency is considered for payments, webhooks, and receipt issuance.
- [ ] Race conditions are considered for status transitions.
- [ ] Audit logging is added for sensitive actions.
- [ ] Errors use stable codes.
- [ ] Swagger matches implementation.
- [ ] Resource GETs use `@CacheRoute`; mutations use `@InvalidateCache` (same namespace).
- [ ] Postman updated when the collection covers the flow.
- [ ] Frontend handoff `docs/` lists enums + nullable response fields when applicable.
- [ ] Unauthorized, forbidden, invalid, conflict, and IDOR tests exist.

## Security tests

At minimum, prove:

- No token returns `401`.
- Missing / invalid `X-Wapigo-Platform` on guarded routes returns `401`.
- Platform ↔ role mismatch returns `403`.
- Missing permission returns `403`.
- Another user cannot access a private resource when ownership rules apply (IDOR).
- Invalid payload is rejected.
- Server-managed fields cannot be injected.
- Sensitive fields never appear in the response.
- Duplicate payment / webhook retries do not create double money effects when idempotency applies.
