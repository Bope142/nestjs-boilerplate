import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { diffSnapshots, fullSchemaAsDiff } from './diff';
import {
  CURRENT_SCHEMA_PAGE,
  buildDiagramPageXml,
  createEmptyMxFile,
  listPageNames,
  migrationPageName,
  parseMxFile,
  serializeMxFile,
  upsertPage,
} from './drawio-builder';
import {
  listSnapshotFiles,
  readJournal,
  readSnapshot,
  resolveSnapshotForEntry,
} from './snapshot-reader';

export interface DiagramPaths {
  repoRoot: string;
  drizzleDir: string;
  drawioPath: string;
}

export function defaultPaths(repoRoot: string): DiagramPaths {
  return {
    repoRoot,
    drizzleDir: join(repoRoot, 'drizzle'),
    drawioPath: join(
      repoRoot,
      'docs',
      'database',
      'database-architecture.drawio',
    ),
  };
}

export function generateDiagram(paths: DiagramPaths): {
  createdPages: string[];
  updatedPages: string[];
} {
  const journal = readJournal(paths.drizzleDir);
  const snapshots = listSnapshotFiles(paths.drizzleDir);
  if (snapshots.length === 0) {
    throw new Error('No Drizzle snapshots found under drizzle/meta');
  }

  const latest = readSnapshot(
    paths.drizzleDir,
    snapshots[snapshots.length - 1],
  );
  const currentDiff = fullSchemaAsDiff(latest);

  const doc = existsSync(paths.drawioPath)
    ? parseMxFile(readFileSync(paths.drawioPath, 'utf8'))
    : createEmptyMxFile();

  const createdPages: string[] = [];
  const updatedPages: string[] = [];

  const currentXml = buildDiagramPageXml(CURRENT_SCHEMA_PAGE, currentDiff, {
    includeUnchangedTables: true,
  });
  const names = listPageNames(doc);
  if (names.includes(CURRENT_SCHEMA_PAGE)) {
    upsertPage(doc, CURRENT_SCHEMA_PAGE, currentXml, { overwrite: true });
    updatedPages.push(CURRENT_SCHEMA_PAGE);
  } else {
    upsertPage(doc, CURRENT_SCHEMA_PAGE, currentXml, { overwrite: false });
    createdPages.push(CURRENT_SCHEMA_PAGE);
  }

  for (const entry of journal.entries) {
    const pageName = migrationPageName(entry.idx, entry.tag);
    if (listPageNames(doc).includes(pageName)) {
      continue;
    }

    const after = resolveSnapshotForEntry(paths.drizzleDir, entry.tag);
    if (!after) {
      throw new Error(
        `Missing snapshot for migration ${entry.tag}. Run drizzle-kit generate first.`,
      );
    }

    const beforeIdx = entry.idx - 1;
    const before =
      beforeIdx >= 0
        ? resolveSnapshotForEntry(
            paths.drizzleDir,
            journal.entries[beforeIdx]?.tag ?? '',
          )
        : null;

    // Prefer previous snapshot file by numeric index when journal tag resolve fails
    let prev = before;
    if (!prev && beforeIdx >= 0) {
      const prevFile = `${String(beforeIdx).padStart(4, '0')}_snapshot.json`;
      try {
        prev = readSnapshot(paths.drizzleDir, prevFile);
      } catch {
        prev = null;
      }
    }

    const diff = diffSnapshots(prev, after);
    const pageXml = buildDiagramPageXml(pageName, diff, {
      includeUnchangedTables: false,
    });
    upsertPage(doc, pageName, pageXml, { overwrite: false });
    createdPages.push(pageName);
  }

  mkdirSync(dirname(paths.drawioPath), { recursive: true });
  writeFileSync(paths.drawioPath, `${serializeMxFile(doc)}\n`, 'utf8');

  return { createdPages, updatedPages };
}

export function checkDiagram(paths: DiagramPaths): string[] {
  const errors: string[] = [];
  if (!existsSync(paths.drawioPath)) {
    errors.push(`Missing Draw.io file: ${paths.drawioPath}`);
    return errors;
  }

  const xml = readFileSync(paths.drawioPath, 'utf8');
  let doc: ReturnType<typeof parseMxFile>;
  try {
    doc = parseMxFile(xml);
  } catch (error) {
    errors.push(
      `Invalid Draw.io XML: ${error instanceof Error ? error.message : String(error)}`,
    );
    return errors;
  }

  if (!doc.documentElement || doc.documentElement.nodeName !== 'mxfile') {
    errors.push('Draw.io root element must be <mxfile>');
  }

  const names = listPageNames(doc);
  if (!names.includes(CURRENT_SCHEMA_PAGE)) {
    errors.push(`Missing page: ${CURRENT_SCHEMA_PAGE}`);
  }

  const journal = readJournal(paths.drizzleDir);
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) {
      errors.push(`Duplicate page: ${name}`);
    }
    seen.add(name);
  }

  for (const entry of journal.entries) {
    const pageName = migrationPageName(entry.idx, entry.tag);
    if (!names.includes(pageName)) {
      errors.push(`Missing migration page: ${pageName}`);
    }
  }

  // Detect orphan migration-like pages that no longer match journal (warn as error for CI)
  const expected = new Set(
    journal.entries.map((e) => migrationPageName(e.idx, e.tag)),
  );
  for (const name of names) {
    if (name === CURRENT_SCHEMA_PAGE) continue;
    if (/^\d{2} — /.test(name) && !expected.has(name)) {
      errors.push(
        `Orphan migration page (not in journal — do not delete history silently; investigate rename): ${name}`,
      );
    }
  }

  return errors;
}

export function validateDiagramXml(paths: DiagramPaths): string[] {
  const errors: string[] = [];
  if (!existsSync(paths.drawioPath)) {
    errors.push(`Missing Draw.io file: ${paths.drawioPath}`);
    return errors;
  }
  const xml = readFileSync(paths.drawioPath, 'utf8');
  try {
    const doc = parseMxFile(xml);
    if (!doc.documentElement || doc.documentElement.nodeName !== 'mxfile') {
      errors.push('Root element must be <mxfile>');
    }
    const diagrams = doc.getElementsByTagName('diagram');
    if (diagrams.length === 0) {
      errors.push('mxfile must contain at least one <diagram> page');
    }
    for (let i = 0; i < diagrams.length; i++) {
      const d = diagrams.item(i);
      if (!d?.getAttribute('name')) {
        errors.push(`diagram[${i}] missing name attribute`);
      }
    }
  } catch (error) {
    errors.push(
      `XML parse failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return errors;
}
