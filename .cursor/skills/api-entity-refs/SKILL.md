---
name: api-entity-refs
description: >-
  Nest related users/merchants/riders as compact ref objects (id + display name)
  in API responses instead of bare UUID fields. Use when adding or changing
  response DTOs, mappers, settlement/remittance actors, or any *UserId/*MerchantId
  exposed to a UI that must show a label.
---

# API Entity Refs

## When to use

- Adding or changing a response that includes who created / confirmed / rejected / assigned something
- Exposing a related merchant, rider, or user the front must show by name
- Reviewing DTOs that still return only `*UserId` / `*MerchantId` for display

## Do

1. Use shared DTOs from `src/common/dto/entity-ref.dto.ts`:
   - `UserRefDto` → `{ id, name, avatarUrl }`
   - `MerchantRefDto` → `{ id, name, logo }`
2. Map with `src/common/utils/entity-ref.mapper.ts`:
   - `mapUserRef` / `mapMerchantRef`
   - `buildUserRefMap` for list endpoints (batch `UsersRepository.findByIds`)
3. Name resolution for users: `displayName` if set, else `` `${firstName} ${lastName}` ``.
4. If the relation is absent → `null` for the **whole** object (e.g. `confirmedBy: null`).
5. If the row is missing (soft-deleted) → still return `{ id, name: 'Utilisateur inconnu', avatarUrl: null }`.
6. Update Swagger + frontend `docs/*.md` (nullable tables) + Postman when the collection covers the flow.
7. Prefer nested field names without `Id` suffix: `createdBy`, `confirmedBy`, `rejectedBy`, `merchant`.

## Don't

- Return only `confirmedByUserId` / `rejectedByUserId` when the UI needs a name
- Force the client to N+1 fetch `/users/:id` for labels
- Put passwords, emails, or tokens inside ref DTOs (keep refs display-safe)

## Example (settlements)

```ts
{
  createdBy: { id, name, avatarUrl },
  confirmedBy: UserRefDto | null,
  rejectedBy: UserRefDto | null,
}
```

## Checklist

- [ ] Displayable FKs nested as refs
- [ ] Nullability documented
- [ ] List endpoints batch-load refs
- [ ] Docs / Swagger updated
