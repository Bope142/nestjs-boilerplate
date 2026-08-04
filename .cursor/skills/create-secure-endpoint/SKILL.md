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
4. Add authentication and permission guards.
5. Resolve the authenticated actor from trusted auth context — never from body roles or IDs for authorization.
6. Apply resource policies when ownership or state matters (e.g. user-owned resources, open sessions).
7. Explicitly map accepted DTO fields.
8. Use a transaction when multiple state changes must be atomic (especially payments + receipts).
9. Add safe error mapping with stable codes.
10. Add Swagger documentation.
11. Add unit, integration, or e2e tests.
12. Run relevant pnpm scripts (`pnpm run lint` mandatory).

Add tenant isolation only when the product needs it.

## Endpoint checklist

- [ ] Authentication is required or public access is explicitly justified.
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
- [ ] Unauthorized, forbidden, invalid, conflict, and IDOR tests exist.

## Security tests

At minimum, prove:

- No token returns `401`.
- Missing permission returns `403`.
- Another user cannot access a private resource when ownership rules apply (IDOR).
- Invalid payload is rejected.
- Server-managed fields cannot be injected.
- Sensitive fields never appear in the response.
- Duplicate payment / webhook retries do not create double money effects when idempotency applies.
