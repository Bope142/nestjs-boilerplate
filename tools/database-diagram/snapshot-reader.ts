import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DrizzleSnapshot, Journal } from './types';

export function readJournal(drizzleDir: string): Journal {
  const path = join(drizzleDir, 'meta', '_journal.json');
  if (!existsSync(path)) {
    throw new Error(`Missing Drizzle journal at ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8')) as Journal;
}

export function listSnapshotFiles(drizzleDir: string): string[] {
  const metaDir = join(drizzleDir, 'meta');
  if (!existsSync(metaDir)) {
    return [];
  }
  return readdirSync(metaDir)
    .filter((f) => /^\d+_snapshot\.json$/.test(f))
    .sort((a, b) => {
      const ai = Number(a.split('_')[0]);
      const bi = Number(b.split('_')[0]);
      return ai - bi;
    });
}

export function readSnapshot(
  drizzleDir: string,
  fileName: string,
): DrizzleSnapshot {
  const path = join(drizzleDir, 'meta', fileName);
  return JSON.parse(readFileSync(path, 'utf8')) as DrizzleSnapshot;
}

export function snapshotIndexFromTag(tag: string): number | null {
  const match = /^(\d+)_/.exec(tag);
  return match ? Number(match[1]) : null;
}

export function resolveSnapshotForEntry(
  drizzleDir: string,
  tag: string,
): DrizzleSnapshot | null {
  const idx = snapshotIndexFromTag(tag);
  if (idx === null) return null;
  const file = `${String(idx).padStart(4, '0')}_snapshot.json`;
  const path = join(drizzleDir, 'meta', file);
  if (!existsSync(path)) return null;
  return readSnapshot(drizzleDir, file);
}
