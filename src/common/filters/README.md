# Filters

`AllExceptionsFilter` maps Nest/HTTP exceptions to a consistent JSON body:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "...",
  "timestamp": "...",
  "path": "/api/..."
}
```

Registered globally in `main.ts`. Do not leak stack traces or secrets to clients.
