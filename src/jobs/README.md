# Jobs (BullMQ)

BullMQ workers and the central reminder scheduler live here.

## Queues

| Queue | Role |
|-------|------|
| `reminder-scheduler` | Repeatable tick; claims due reminders by `next_run_at` |
| `reminder-dispatch` | Eligibility + channel fan-out |
| `notification-email` | Rate-limited email delivery |
| `notification-in-app` | In-app inbox inserts |

## Production safety

- One scheduler for all users (never one cron per user).
- Batch claim with `FOR UPDATE SKIP LOCKED`.
- Concurrency and email rate limits via env (`REMINDER_*`, `NOTIFICATION_*`).
- Idempotent jobs (`jobId`) + unique `(reminder_id, channel, scheduled_for)` deliveries.
- Dedicated Redis DB (`REDIS_QUEUE_DB`, default `1`) — do not reuse the cache client (`app:` prefix, fail-open).

## Disable in tests

Set `JOBS_ENABLED=false` to skip BullMQ registration.
