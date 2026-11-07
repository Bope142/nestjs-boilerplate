#!/usr/bin/env node
/**
 * Run a command with NODE_ENV forced (e.g. test → DATABASE_URL_TEST).
 * Usage: node ./scripts/run-with-node-env.mjs <env> <command> [...args]
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const [nodeEnv, command, ...args] = process.argv.slice(2);

if (!nodeEnv || !command) {
  console.error(
    'Usage: node ./scripts/run-with-node-env.mjs <NODE_ENV> <command> [...args]',
  );
  process.exit(1);
}

const env = { ...process.env, NODE_ENV: nodeEnv };
const isWindows = process.platform === 'win32';
const cmd = isWindows && !command.includes('\\') && !command.includes('/')
  ? `${command}.cmd`
  : command;

const child = spawn(cmd, args, {
  env,
  stdio: 'inherit',
  shell: isWindows,
  cwd: resolve(process.cwd()),
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
