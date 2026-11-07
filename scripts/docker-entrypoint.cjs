#!/usr/bin/env node
/**
 * Optional production entrypoint.
 * Set RUN_DB_MIGRATE=true to apply Drizzle SQL migrations before starting the API.
 */
const { spawn } = require('node:child_process');
const { resolve } = require('node:path');
const pg = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');

async function runMigrationsIfRequested() {
  if (process.env.RUN_DB_MIGRATE !== 'true') {
    return;
  }

  const url =
    process.env.NODE_ENV === 'production'
      ? process.env.DATABASE_URL_PROD
      : process.env.DATABASE_URL_DEV;

  if (!url) {
    throw new Error('RUN_DB_MIGRATE=true but database URL is missing');
  }

  console.log('[entrypoint] Running database migrations…');
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool);
  try {
    await migrate(db, { migrationsFolder: resolve(process.cwd(), 'drizzle') });
    console.log('[entrypoint] Migrations complete.');
  } finally {
    await pool.end();
  }
}

function startApp(argv) {
  const [command, ...args] = argv;
  const child = spawn(command, args, { stdio: 'inherit', env: process.env });
  const forward = (signal) => {
    if (!child.killed) child.kill(signal);
  };
  process.on('SIGTERM', () => forward('SIGTERM'));
  process.on('SIGINT', () => forward('SIGINT'));
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 1);
  });
}

(async () => {
  try {
    await runMigrationsIfRequested();
    const argv = process.argv.slice(2);
    if (argv.length === 0) {
      startApp(['node', 'dist/main.js']);
    } else {
      startApp(argv);
    }
  } catch (error) {
    console.error(
      '[entrypoint]',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
})();
