#!/usr/bin/env node
/**
 * Lightweight project bootstrap: rename package metadata and patch env defaults.
 *
 * Usage:
 *   pnpm init:project
 *   pnpm init:project -- --name "My API" --package my-api --port 4000
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        i += 1;
      } else {
        result[key] = 'true';
      }
    }
  }
  return result;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function prompt(rl, question, fallback) {
  const answer = (await rl.question(`${question}${fallback ? ` [${fallback}]` : ''}: `)).trim();
  return answer || fallback || '';
}

function patchEnvFile(path, replacements) {
  if (!existsSync(path)) {
    return false;
  }

  let content = readFileSync(path, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    if (pattern.test(content)) {
      content = content.replace(pattern, `${key}=${value}`);
    } else {
      content = `${content.trimEnd()}\n${key}=${value}\n`;
    }
  }
  writeFileSync(path, content, 'utf8');
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rl = createInterface({ input, output });

  const projectName =
    args.name ||
    (await prompt(rl, 'Project display name', 'NestJS Boilerplate'));
  const packageName =
    args.package ||
    (await prompt(rl, 'Package name (npm)', slugify(projectName) || 'nestjs-boilerplate'));
  const description =
    args.description ||
    (await prompt(
      rl,
      'Package description',
      'Production-ready NestJS boilerplate with auth, Drizzle, Redis, and email',
    ));
  const port = args.port || (await prompt(rl, 'API port', '3000'));
  const redisPrefix =
    args['redis-prefix'] ||
    (await prompt(rl, 'Redis key prefix', `${slugify(packageName) || 'app'}:`));

  rl.close();

  const packageJsonPath = 'package.json';
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  pkg.name = packageName;
  pkg.description = description;
  writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  const envValues = {
    APP_NAME: projectName,
    PORT: String(port),
    REDIS_KEY_PREFIX: redisPrefix,
    MAIL_FROM_NAME: projectName,
  };

  patchEnvFile('.env.example', envValues);
  const envPatched = patchEnvFile('.env', envValues);

  console.log('\nProject initialized:\n');
  console.log(`  name:          ${projectName}`);
  console.log(`  package:       ${packageName}`);
  console.log(`  port:          ${port}`);
  console.log(`  redis prefix:  ${redisPrefix}`);
  if (envPatched) {
    console.log('  .env updated');
  } else {
    console.log('  .env not found (run pnpm setup to create from .env.example)');
  }

  console.log('\nNext steps:\n');
  console.log('  pnpm install');
  console.log('  pnpm setup');
  console.log('  docker compose up -d');
  console.log('  pnpm db:migrate && pnpm db:seed');
  console.log('  pnpm start:dev');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
