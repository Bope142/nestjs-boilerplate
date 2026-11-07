---
name: resource-options
description: >-
  Add GET .../options pick-list endpoints for resources used in selects
  (id + label fields, active only, CacheRoute, route before :id). Use when
  creating or updating catalogs, FK pickers, multi-select associations, or when
  the user mentions options/select endpoints.
---

# Resource Options Endpoints

## When to use

- New catalog or library resource consumed by a `<Select>` / multi-select
- Associating entity A to entity B by id (e.g. supplement → group)
- Frontend asks for a lightweight options API instead of paginated list

## Checklist

1. Add `XxxOptionResponseDto` (`id` + display fields only).
2. Repository: list active, non-deleted, ordered by name (or displayOrder).
3. Service: `listOptions…` mapping to the option DTO.
4. Controller: `@Get('options')` **before** `@Get(':id')`.
5. `@CacheRoute` same namespace as CRUD reads; mutations already invalidate it.
6. Swagger description: who uses it + which request field takes `id`.
7. Postman request + `docs/*.md` / frontend handoff mention the path.
8. Follow `.cursor/rules/resource-options.mdc`.

## Canonical example (supplements)

```ts
@Get('options')
@CacheRoute({ namespace: SUPPLEMENTS_CACHE_NS })
@ApiOkResponse({ type: [SupplementOptionResponseDto] })
listOptions(...) { ... }

@Get(':id') // must come after options
getById(...) { ... }
```

Merchant: `GET /api/merchant/supplements/options`  
Admin: `GET /api/admin/merchants/:merchantId/supplements/options`
