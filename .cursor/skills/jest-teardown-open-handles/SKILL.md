---
name: jest-teardown-open-handles
description: >-
  Diagnose and fix Jest pre-push flakes from open handles, fake timers, worker
  SIGTERM, and libphonenumber-js module resolution. Use when push/test fails with
  detectOpenHandles, "Active timers" / .unref(), worker terminated SIGTERM, or
  Cannot find module './isValid.js' under libphonenumber-js while specs pass alone.
---

# Jest Teardown & Open Handles

## When to use

- Pre-push / `pnpm test` fails; the same file passes with `--runInBand` or alone.
- Messages mention `--detectOpenHandles`, improper teardown, active timers, `.unref()`.
- `A jest worker process … signal=SIGTERM` on a suite that has no timers of its own.
- `Cannot find module './isValid.js' from '…/libphonenumber-js/…'`.

## Procedure

1. **Separate logic bugs from pool flakes**

```bash
pnpm exec jest --runInBand --testPathPattern=<failing-file>
```

If this is green, do not “fix” the failing assert — fix teardown / Jest config / resource pressure.

2. **Find leaks**

```bash
pnpm test:detect-handles
# or narrow:
pnpm exec jest --detectOpenHandles --runInBand --testPathPattern=<area>
```

Fix every handle Jest prints (open sockets, Redis, uncleared intervals, fake timers).

3. **Teardown patterns**

```ts
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(fixed);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
```

- Prefer `afterEach` over `afterAll` for timers and spies.
- Close clients you construct in the spec; rely on Nest `onModuleDestroy` only when the testing module is closed (`await app.close()` / `module.close()`).
- Background timers in production code: call `.unref()` when they must not keep the process alive.

4. **Config invariants** (already expected in this repo)

Confirm `package.json` → `jest` still has:

| Key | Purpose |
|-----|---------|
| `setupFilesAfterEnv` → `test/jest.setup-after-env.ts` | Global `jest.useRealTimers()` after each test |
| `moduleNameMapper` `^libphonenumber-js$` → `min/index.cjs` | Stable CJS entry under Jest + pnpm |
| `maxWorkers: 1` | Serial unit runs — no sibling-worker SIGTERM / OneDrive FS races on `libphonenumber-js` |
| `testTimeout` ≥ 20000 | Slow disk / transform headroom |
| `openHandlesTimeout` ≥ 10000 | Avoid false “failed to exit gracefully” when workers are slow on OneDrive |

E2e: keep the same mapper + setup in `test/jest-e2e.json`.

5. **Do not** add `--forceExit` to default `pnpm test` / pre-push to hide leaks. `test:detect-handles` may use `--forceExit` only as a diagnostic aid after listing handles.

6. **Verify under push pressure**

```bash
pnpm test
```

Completion criterion: full unit suite green once; named flake no longer reproduces; no new `--forceExit` on the default test script.

## Collateral SIGTERM

When Jest force-exits a hung worker, another suite often fails with `signal=SIGTERM` even though that file is fine. Always chase the **open-handle / hang** root cause (or FS pressure), not the SIGTERM victim.
