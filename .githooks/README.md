# Git hooks

This repository stores hooks in `.githooks/`. `pnpm install` runs `prepare`, which sets `core.hooksPath` to this folder via `scripts/install-git-hooks.mjs`.

| Hook | Runs |
|------|------|
| **pre-commit** | `pnpm exec lint-staged` |
| **pre-push** | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` |
| **commit-msg** | `pnpm exec commitlint --edit` (Conventional Commits) |

If hooks are not active after clone:

```bash
pnpm hooks:install
```

E2E tests are intentionally excluded from pre-push to keep local pushes fast; CI runs the full verify pipeline.
