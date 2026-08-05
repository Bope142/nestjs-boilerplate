# Filters

`AllExceptionsFilter` maps Nest/HTTP exceptions and `DomainError` to a consistent JSON body, and sets `Content-Language` to the resolved locale (`fr` default):

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "...",
  "timestamp": "...",
  "path": "/api/..."
}
```

- `code` is a stable machine identifier (never translated).
- `message` is human-readable and translated via `src/i18n`.
- Language resolution: `?lang=` → `Accept-Language` → `x-lang` → `fr`.

Registered globally in `main.ts`. Do not leak stack traces or secrets to clients.
