---
name: review-security
description: Perform a focused security review of this NestJS boilerplate backend code, prioritizing authorization, authentication, data integrity, input handling, and sensitive data.
---

# Review Security

Use this skill before merging sensitive code or when explicitly asked for a security review.

## Review method

1. Determine assets, actors, trust boundaries, and entry points.
2. Trace authentication and actor resolution from trusted context.
3. Trace authorization from controller to resource (RBAC + resource policy).
4. Inspect queries for missing ownership / IDOR filters where policies require them.
5. Inspect DTOs and explicit field mapping (no mass assignment of status, amounts truth, receipt numbers).
6. Inspect financial state transitions for race conditions and idempotency gaps.
7. Inspect token, password, invitation, and OTP handling.
8. Inspect payment webhooks (signature verification, duplicate callbacks).
9. Inspect logs, errors, exports, files, caches, and jobs.
10. Inspect migrations and database constraints.
11. Verify tests prove denial paths and data integrity.

Review tenant isolation only when the product implements multi-tenancy.

## Mandatory vulnerability classes

Check for:

- IDOR / missing resource ownership checks.
- Missing function-level authorization.
- SQL injection.
- Mass assignment.
- Account enumeration.
- Weak token storage.
- Token replay.
- Brute force.
- Race conditions on money workflows.
- Duplicate webhook / payment double-posting.
- Hard-delete of confirmed financial records.
- Insecure direct file access.
- CSV injection.
- Secret exposure.
- Sensitive logging (credentials, OTPs, payment secrets, full PII).
- Unbounded data access.
- Unsafe CORS.
- Missing rate limits.
- Unsafe dependency or install scripts.

## Severity

Classify findings:

- Critical: auth bypass, secret disclosure, destructive unauthenticated action, confirmed financial double-post or wipe.
- High: privilege escalation, sensitive data exposure, exploitable token flaw, missing webhook verification.
- Medium: meaningful defense gap requiring pre-release correction.
- Low: hardening or limited-impact issue.

## Finding format

For each finding provide:

- Severity.
- File and relevant code location.
- Vulnerability.
- Exploitation scenario.
- Impact.
- Specific remediation.
- Test to prevent regression.

Do not report speculative findings as confirmed. Clearly distinguish verified issues from risks requiring validation.

## Final decision

Conclude with one of:

- Block merge.
- Merge after required fixes.
- Merge with documented follow-up.
- No material issue found.

Never state that code is secure. State only what was reviewed and what was not.
