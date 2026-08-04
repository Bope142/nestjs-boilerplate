# Identity module

Authentication and user identity.

## Endpoints

All under global prefix `/api`. Every request requires `x-api-key`.

- `POST /auth/register` — credentials register (no session; email verification required)
- `POST /auth/verify-email`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/magic-link/request`
- `POST /auth/magic-link/consume`
- `POST /auth/refresh`
- `POST /auth/logout` (JWT)
- `POST /auth/logout-all` (JWT)
- `GET /users/me` (JWT)

Access and refresh tokens are returned as AES-256-GCM encrypted envelopes in the response body.

## Seed

```bash
pnpm db:seed
```
