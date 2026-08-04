# Audit (global)

`AuditModule` est global. Injecter `AuditService` partout :

```ts
await this.auditService.success({
  type: 'AUTH',
  action: 'auth.login',
  actorUserId: user.id,
  targetType: 'auth_session',
  targetId: sessionId,
  ipAddress: meta.ipAddress,
});

await this.auditService.failureSafe({
  type: 'AUTH',
  action: 'auth.login',
  metadata: { reason: 'INVALID_PASSWORD' },
});
```

Colonnes `audit_logs.type` (`AUTH` | `SECURITY` | …) et `audit_logs.status` (`SUCCESS` | `FAILURE`).
