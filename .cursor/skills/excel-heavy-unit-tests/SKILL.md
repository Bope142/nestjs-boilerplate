---
name: excel-heavy-unit-tests
description: >-
  Write or fix Jest unit tests that generate/parse real Excel (.xlsx) files with
  ExcelJS. Use when adding merchant-import specs, Excel template/parser tests,
  pre-push timeouts on *.xlsx fixtures, or "Exceeded timeout of 5000 ms" on
  import/validator specs that pass in isolation but fail in full pnpm test.
---

# Excel-Heavy Unit Tests

## When to use

- Specs under `merchant-imports/**/*.spec.ts` (or any ExcelJS write/read).
- Pre-push / CI fails with `Exceeded timeout of 5000 ms` on Excel fixtures.
- Tests pass alone but flake or hang under full `pnpm test`.

## Procedure

1. **Raise the suite timeout** at describe scope (default Jest is 5s — too low):

```ts
jest.setTimeout(30_000);

describe('…', () => {
  // …
});
```

2. **Write workbooks via buffer**, then one `fs.writeFile` (less brittle than `wb.xlsx.writeFile` on synced disks):

```ts
const buffer = Buffer.from(await wb.xlsx.writeBuffer());
await fs.writeFile(filePath, buffer);
```

3. **Parallelize** independent fixture files with `Promise.all`.

4. **Clean up in `try/finally`** so failures still delete temp dirs:

```ts
const dir = await fs.mkdtemp(join(tmpdir(), 'mi-'));
try {
  // write + assert
} finally {
  await fs.rm(dir, { recursive: true, force: true });
}
```

5. Use OS `tmpdir()` — never write fixtures into the OneDrive project tree.

6. **Verify under push pressure**, not only in isolation:

```bash
pnpm test -- --testPathPattern=merchant-imports.validator
pnpm test -- --testPathPattern=merchant-imports
```

If pre-push runs full `pnpm test`, a green narrow run is necessary but not sufficient for Excel-heavy files — re-run the affected pattern after a warm/full suite when debugging timeouts.

## Anti-patterns

- Leaving default 5s timeout on ExcelJS specs
- Claiming push is fine after only `jest path/to/spec.ts` in isolation
- Writing temp xlsx inside the repo / OneDrive workspace folder
- Skipping `finally` cleanup (leaks + open handles → “worker failed to exit”)

## Completion criterion

- Specs pass with `--testPathPattern` for the changed file(s).
- No 5s timeout failures on those cases under a second run.
- Temp dirs removed after each test.
