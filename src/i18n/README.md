# API i18n conventions

Human-readable API `message` values are translated. Machine `code` values stay stable English identifiers and are never translated.

## Languages

- `fr` — default and fallback
- `en`

Resolution order: `?lang=` → `Accept-Language` → `x-lang`. Unknown locales and missing keys fall back to French. Responses set `Content-Language` to the language actually used.

## File layout

```text
src/i18n/
  fr|en/
    errors/<feature>.json   # DomainError codes → errors.<feature>.<CODE>
    common.json             # INTERNAL_SERVER_ERROR, VALIDATION_ERROR
    success.json
    validation.json         # class-validator constraint messages
```

Keep the same keys in every language. Never rename a key in only one locale. Interpolation placeholders (`{property}`, `{constraints.0}`, …) must stay identical across locales.

## New domain error

1. Add a prefixed code constant (`AUTH_*`, `USER_*`, `REMINDER_*`, `NOTIFICATION_*`, …).
2. Add the key in `fr/errors/<feature>.json` and `en/errors/<feature>.json`.
3. Extend `resolveErrorModule` in `src/common/i18n/resolve-error-i18n-key.ts` if the prefix is new.
4. `throw new DomainError(Code, status, { args: { … } })`.

## Success messages

```ts
return { message: translateSuccess('PASSWORD_RESET') };
```

## Custom validation messages

Default constraints map to `validation.<constraintName>`. For custom rules:

```ts
@Matches(/…/, { message: i18nValidationMessage('validation.phoneNumber') })
```

## New language

Copy `fr/` to `src/i18n/<locale>/`, translate values only, restart the app.
