---
name: bullmq-job-ids
description: >-
  Build BullMQ custom jobId values without ":" using src/jobs/job-id.util.ts.
  Use when enqueueing jobs (queue.add jobId), adding idempotent workers,
  fixing "Custom Id cannot contain :", or reviewing document/notification/
  reminder/import job enqueue code.
---

# BullMQ job IDs (no colons)

## Why

BullMQ rejects custom `jobId` values that contain `:` (except legacy 3-segment repeatable ids). Symptom in logs:

```text
Error: Custom Id cannot contain :
Failed to enqueue … 
```

The job never enters the queue; fire-and-forget callers may only `warn`.

## Hard rule

1. **Never** set `jobId` with template literals that include `:`.
2. Prefer helpers in [`src/jobs/job-id.util.ts`](../../../src/jobs/job-id.util.ts):
   - `buildJobId(...segments)` — joins with `-`, throws if a segment still has `:`
   - Named helpers: `documentGenerateJobId`, `documentEmailJobId`, `notificationPushJobId`, `notificationEmailJobId`, `notificationInAppJobId`, `reminderDispatchJobId`
3. Add a **named helper** next to those when introducing a new idempotent enqueue path; cover it in `job-id.util.spec.ts` (`not.toContain(':')`).

## Do / don't

| Do | Don't |
|---|---|
| `documentGenerateJobId(orderId)` → `doc-gen-receipt-<uuid>` | `` `gen:${clientReceiptIdempotencyKey(orderId)}` `` |
| `buildJobId('mi', kind, sessionId)` | `` `mi-${kind}:${sessionId}` `` |
| Keep HTTP/docs idempotency keys with `:` if an external API needs them | Reuse those keys **as** BullMQ `jobId` |

HTTP / documents storage keys (e.g. `receipt:order:<uuid>` in `clientReceiptIdempotencyKey`) may keep colons. Map them to hyphenated **job** ids via discrete segments — never paste the colon key into `jobId`.

## Checklist for new `queue.add(..., { jobId })`

- [ ] `jobId` from `buildJobId` or a named helper in `job-id.util.ts`
- [ ] Grep the new string / helper: no `:` in the produced id
- [ ] Spec asserts `expect(jobId).not.toContain(':')`
- [ ] Fail path still handled (idempotent re-add / duplicate job ok)

## Related code

- Orchestrator: `src/modules/documents/documents-orchestrator.service.ts`
- Specs: `src/jobs/job-id.util.spec.ts`
- Imports already hyphenated: catalog/merchant import jobs (`ci-` / `mi-`)
