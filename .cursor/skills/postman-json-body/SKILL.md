---
name: postman-json-body
description: >-
  Ensure Postman collection requests that send data use raw JSON body mode
  (options.raw.language=json) and Content-Type application/json. Use when
  adding or editing Postman requests, fixing collection bodies, or when the
  user mentions Postman JSON body / Content-Type.
---

# Postman JSON Body

## When to use

- Adding or updating requests in `postman/collections/wapigo-api.postman_collection.json`
- User reports Postman Body type is Text / wrong Content-Type
- After creating endpoints with body DTOs and syncing Postman

## Rule

For every `POST` / `PUT` / `PATCH` that sends a payload:

1. `body.mode` = `"raw"`
2. `body.raw` = valid JSON string (pretty-printed with `\n` is fine)
3. `body.options.raw.language` = `"json"` (required — without this Postman shows Text)
4. Header `Content-Type: application/json`

### Canonical example

```json
{
  "method": "POST",
  "header": [
    { "key": "Content-Type", "value": "application/json" }
  ],
  "body": {
    "mode": "raw",
    "raw": "{\n  \"email\": \"{{client_email}}\",\n  \"password\": \"{{client_password}}\"\n}",
    "options": {
      "raw": {
        "language": "json"
      }
    }
  }
}
```

## Exceptions

- **Bodyless actions** (logout, accept/reject without DTO, toggle favorite, flush cache): omit `body`.
- **Multipart / file upload**: use `formdata` only when the Nest endpoint is truly multipart; document why.

## Verify

After edits, run:

```bash
node -e "
const c=require('./postman/collections/wapigo-api.postman_collection.json');
let bad=0;
(function w(items){for(const it of items||[]){if(it.item)w(it.item);const r=it.request;if(!r)continue;const m=(r.method||'').toUpperCase();if(!['POST','PUT','PATCH'].includes(m)||!r.body||r.body.mode!=='raw')continue;if(r.body.options?.raw?.language!=='json'){bad++;console.log(it.name);}}})(c.item);
console.log(bad?bad+' missing json language':'OK');
"
```

Expect `OK`.

## Related

- Rule: `.cursor/rules/postman-json-body.mdc`
- Docs sync: `.cursor/rules/update-api-docs.mdc`
