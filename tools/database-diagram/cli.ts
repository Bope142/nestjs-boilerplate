import { resolve } from 'node:path';
import {
  checkDiagram,
  defaultPaths,
  generateDiagram,
  validateDiagramXml,
} from './sync';

function usage(): never {
  console.error(`Usage: ts-node tools/database-diagram/cli.ts <generate|check|validate>

  generate  Update page 00 (current schema) and append missing migration pages
  check     Fail if journal/pages/XML are out of sync (CI)
  validate  Structural XML + page titles only
`);
  process.exit(1);
}

const command = process.argv[2];
if (!command) usage();

const paths = defaultPaths(resolve(process.cwd()));

if (command === 'generate') {
  const result = generateDiagram(paths);
  console.log(`Draw.io updated: ${paths.drawioPath}`);
  if (result.createdPages.length) {
    console.log(`Created pages:\n- ${result.createdPages.join('\n- ')}`);
  }
  if (result.updatedPages.length) {
    console.log(`Updated pages:\n- ${result.updatedPages.join('\n- ')}`);
  }
  process.exit(0);
}

if (command === 'check') {
  const errors = checkDiagram(paths);
  if (errors.length) {
    console.error('db:diagram:check failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('db:diagram:check OK');
  process.exit(0);
}

if (command === 'validate') {
  const errors = validateDiagramXml(paths);
  if (errors.length) {
    console.error('db:diagram:validate failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('db:diagram:validate OK');
  process.exit(0);
}

usage();
