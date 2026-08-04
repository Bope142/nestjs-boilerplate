#!/usr/bin/env node
/**
 * First-time local setup: ensure .env exists, install Git hooks, print next steps.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const envPath = join(root, '.env');
const envExamplePath = join(root, '.env.example');

if (!existsSync(envExamplePath)) {
  console.error('Missing .env.example. Cannot continue setup.');
  process.exit(1);
}

if (!existsSync(envPath)) {
  copyFileSync(envExamplePath, envPath);
  console.warn('Created .env from .env.example — review secrets before running in production.');
} else {
  console.log('.env already exists.');
}

try {
  execFileSync('pnpm', ['hooks:install'], { stdio: 'inherit', cwd: root });
} catch {
  console.warn('Git hooks install skipped or failed (not a Git repo or pnpm unavailable).');
}

console.log('\nSetup complete. Next steps:\n');
console.log('  1. docker compose up -d');
console.log('  2. pnpm db:migrate');
console.log('  3. pnpm db:seed');
console.log('  4. pnpm start:dev');
console.log('\nSwagger: http://localhost:3000/api/docs (adjust PORT if changed in .env)');
