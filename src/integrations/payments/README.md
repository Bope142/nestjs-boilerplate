# Payment Integrations

Future payment adapters should expose a clear provider contract conceptually covering payment initialization, payment verification, webhook receiving, provider status normalization, idempotency support, and safe raw provider reference recording.

Never trust an external webhook without verification. Never expose provider secrets. Duplicate callbacks must not create duplicate payments.
