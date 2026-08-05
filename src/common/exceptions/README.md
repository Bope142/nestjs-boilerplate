# Exceptions

Reusable technical exceptions live here when they are not owned by a specific domain.

- `DomainError` — throw a stable machine `code` (and optional interpolation `args`). Human messages are translated by `AllExceptionsFilter` via `src/i18n`.

Domain-specific error helpers and code constants should remain in the domain that owns the rule.
