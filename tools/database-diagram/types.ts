export interface DrizzleColumn {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  default?: unknown;
}

export interface DrizzleForeignKey {
  name: string;
  tableFrom: string;
  tableTo: string;
  columnsFrom: string[];
  columnsTo: string[];
  onDelete?: string;
  onUpdate?: string;
}

export interface DrizzleTable {
  name: string;
  schema?: string;
  columns: Record<string, DrizzleColumn>;
  indexes?: Record<string, unknown>;
  foreignKeys?: Record<string, DrizzleForeignKey>;
  uniqueConstraints?: Record<string, unknown>;
  compositePrimaryKeys?: Record<string, unknown>;
}

export interface DrizzleSnapshot {
  id: string;
  prevId: string;
  version: string;
  dialect: string;
  tables: Record<string, DrizzleTable>;
  enums?: Record<string, unknown>;
}

export interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

export interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

export type ChangeKind = 'added' | 'removed' | 'modified' | 'unchanged';

export interface ColumnChange {
  name: string;
  kind: ChangeKind;
  detail?: string;
}

export interface TableChange {
  name: string;
  kind: ChangeKind;
  columns: ColumnChange[];
}

export interface SchemaDiff {
  tables: TableChange[];
  foreignKeys: Array<{
    name: string;
    kind: ChangeKind;
    from: string;
    to: string;
    columnsFrom: string[];
    columnsTo: string[];
  }>;
}
