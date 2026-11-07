#!/usr/bin/env node
/**
 * Ensure DATABASE_URL_TEST database exists, then run migrations with NODE_ENV=test.
 */
import { spawn } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: '.env', quiet: true });

const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl) {
  console.error('Missing DATABASE_URL_TEST in .env (see .env.example).');
  process.exit(1);
}

const parsed = new URL(testUrl);
const dbName = parsed.pathname.replace(/^\//, '');
if (!dbName) {
  console.error('DATABASE_URL_TEST must include a database name.');
  process.exit(1);
}

const adminUrl = new URL(testUrl);
adminUrl.pathname = '/postgres';

async function ensureDatabase() {
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`Created database ${dbName}`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } finally {
    await client.end();
  }
}

function runMigrate() {
  return new Promise((resolvePromise, reject) => {
    const isWindows = process.platform === 'win32';
    const child = spawn(
      process.execPath,
      ['./scripts/run-with-node-env.mjs', 'test', 'drizzle-kit', 'migrate'],
      {
        env: process.env,
        stdio: 'inherit',
        shell: isWindows,
      },
    );
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`drizzle-kit migrate exited with ${code}`));
    });
  });
}

try {
  await ensureDatabase();
  await runMigrate();
  console.log('Test database ready.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
