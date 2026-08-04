#!/usr/bin/env node
/**
 * Point this repository's Git hooks at `.githooks/`.
 * Safe to run outside a Git checkout (no-op with a warning).
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const hooksDir = '.githooks';
const requiredHooks = ['pre-commit', 'pre-push', 'commit-msg'];

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

try {
  runGit(['rev-parse', '--is-inside-work-tree']);
} catch {
  console.warn('Skipping Git hooks setup: not inside a Git work tree.');
  process.exit(0);
}

if (!existsSync(hooksDir)) {
  console.error(`Missing ${hooksDir}/ directory.`);
  process.exit(1);
}

for (const hook of requiredHooks) {
  const path = join(hooksDir, hook);
  if (!existsSync(path)) {
    console.error(`Missing required hook: ${path}`);
    process.exit(1);
  }
}

runGit(['config', 'core.hooksPath', hooksDir]);

const configured = runGit(['config', '--get', 'core.hooksPath']);
if (configured !== hooksDir && configured.replace(/\\/g, '/') !== hooksDir) {
  console.error(`Failed to set core.hooksPath (got: ${configured}).`);
  process.exit(1);
}

console.log(`Git hooks enabled: core.hooksPath=${hooksDir}`);
console.log('  pre-commit → pnpm exec lint-staged');
console.log('  pre-push   → pnpm lint, typecheck, test, build');
console.log('  commit-msg → pnpm exec commitlint --edit');
