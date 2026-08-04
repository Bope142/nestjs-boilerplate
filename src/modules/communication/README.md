# Communication Module

Notifications, reminders, user preferences, and delivery history.

## Capabilities

- User notification preferences (enable/disable, default channels, timezone, quiet hours)
- Generic reusable **reminders** (`DAILY` / `WEEKLY` / `DEADLINE_OFFSET`) with multiple time slots
- In-app notification inbox
- Delivery history with idempotency and skip/failure tracking
- Central BullMQ scheduler (see `src/jobs/`) — domains only write reminder rows with `next_run_at`

## Integration (other modules)

Inject `REMINDER_PORT` and call:

- `syncResourceReminder(...)` — create/update/cancel scheduling for a resource
- `cancelResourceReminders(resourceType, resourceId, reason)`

Register a `ReminderEligibilityAdapter` via `ReminderEligibilityRegistry.register(...)` in `OnModuleInit` when a domain needs custom eligibility rules.

Do **not** import BullMQ from business modules.

## Channels

| Channel | v1 |
|---------|----|
| `IN_APP` | Implemented |
| `EMAIL` | Implemented |
| `SMS` / `WHATSAPP` | Enum only → deliveries marked `CHANNEL_NOT_IMPLEMENTED` |

See [docs/communication/reminders-notifications.md](../../../docs/communication/reminders-notifications.md).
