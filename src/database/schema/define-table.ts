import type { PgTableWithColumns } from './pg-types';

/**
 * Wrap `pgTable(...)` so exported table consts have a portable named type
 * (avoids TS2742 PgColumn / PgTableWithColumns via *.cjs paths).
 */
export function defineTable<T extends PgTableWithColumns<any>>(table: T): T {
  return table;
}
