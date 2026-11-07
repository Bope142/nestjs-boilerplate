import type {
  DrizzleSnapshot,
  DrizzleTable,
  SchemaDiff,
  TableChange,
} from './types';

function tableName(key: string, table: DrizzleTable): string {
  return table.name || key.replace(/^public\./, '');
}

function columnSignature(col: {
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  default?: unknown;
}): string {
  return JSON.stringify({
    type: col.type,
    primaryKey: col.primaryKey,
    notNull: col.notNull,
    default: col.default ?? null,
  });
}

function emptySnapshot(): DrizzleSnapshot {
  return {
    id: 'empty',
    prevId: '',
    version: '7',
    dialect: 'postgresql',
    tables: {},
  };
}

export function diffSnapshots(
  before: DrizzleSnapshot | null,
  after: DrizzleSnapshot,
): SchemaDiff {
  const prev = before ?? emptySnapshot();
  const prevKeys = new Set(Object.keys(prev.tables));
  const nextKeys = new Set(Object.keys(after.tables));
  const tables: TableChange[] = [];

  for (const key of nextKeys) {
    const nextTable = after.tables[key];
    const name = tableName(key, nextTable);
    if (!prevKeys.has(key)) {
      tables.push({
        name,
        kind: 'added',
        columns: Object.values(nextTable.columns).map((c) => ({
          name: c.name,
          kind: 'added' as const,
          detail: `${c.type}${c.primaryKey ? ' PK' : ''}${c.notNull ? '' : ' NULL'}`,
        })),
      });
      continue;
    }

    const prevTable = prev.tables[key];
    const prevCols = prevTable.columns;
    const nextCols = nextTable.columns;
    const colNames = new Set([
      ...Object.keys(prevCols),
      ...Object.keys(nextCols),
    ]);
    const columns: TableChange['columns'] = [];
    let tableModified = false;

    for (const colKey of colNames) {
      const prevCol = prevCols[colKey];
      const nextCol = nextCols[colKey];
      if (!prevCol && nextCol) {
        tableModified = true;
        columns.push({
          name: nextCol.name,
          kind: 'added',
          detail: nextCol.type,
        });
      } else if (prevCol && !nextCol) {
        tableModified = true;
        columns.push({
          name: prevCol.name,
          kind: 'removed',
          detail: prevCol.type,
        });
      } else if (
        prevCol &&
        nextCol &&
        columnSignature(prevCol) !== columnSignature(nextCol)
      ) {
        tableModified = true;
        columns.push({
          name: nextCol.name,
          kind: 'modified',
          detail: `${prevCol.type} → ${nextCol.type}`,
        });
      } else if (nextCol) {
        columns.push({
          name: nextCol.name,
          kind: 'unchanged',
          detail: nextCol.type,
        });
      }
    }

    tables.push({
      name,
      kind: tableModified ? 'modified' : 'unchanged',
      columns,
    });
  }

  for (const key of prevKeys) {
    if (!nextKeys.has(key)) {
      const prevTable = prev.tables[key];
      tables.push({
        name: tableName(key, prevTable),
        kind: 'removed',
        columns: Object.values(prevTable.columns).map((c) => ({
          name: c.name,
          kind: 'removed' as const,
          detail: c.type,
        })),
      });
    }
  }

  const foreignKeys: SchemaDiff['foreignKeys'] = [];
  const prevFks = collectForeignKeys(prev);
  const nextFks = collectForeignKeys(after);
  const fkNames = new Set([...Object.keys(prevFks), ...Object.keys(nextFks)]);

  for (const name of fkNames) {
    const a = prevFks[name];
    const b = nextFks[name];
    if (!a && b) {
      foreignKeys.push({ name, kind: 'added', ...b });
    } else if (a && !b) {
      foreignKeys.push({ name, kind: 'removed', ...a });
    } else if (a && b && JSON.stringify(a) !== JSON.stringify(b)) {
      foreignKeys.push({ name, kind: 'modified', ...b });
    }
  }

  return { tables, foreignKeys };
}

function collectForeignKeys(snapshot: DrizzleSnapshot) {
  const result: Record<
    string,
    {
      from: string;
      to: string;
      columnsFrom: string[];
      columnsTo: string[];
    }
  > = {};

  for (const table of Object.values(snapshot.tables)) {
    for (const fk of Object.values(table.foreignKeys ?? {})) {
      result[fk.name] = {
        from: fk.tableFrom,
        to: fk.tableTo,
        columnsFrom: fk.columnsFrom,
        columnsTo: fk.columnsTo,
      };
    }
  }
  return result;
}

export function fullSchemaAsDiff(snapshot: DrizzleSnapshot): SchemaDiff {
  return diffSnapshots(null, snapshot);
}
