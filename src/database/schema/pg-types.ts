/**
 * Portable Drizzle pg-core type re-exports.
 * Import these when annotating table exports so declaration/IDE
 * does not resolve through non-portable `*.cjs` paths (TS2742).
 */
export type { PgColumn, PgTableWithColumns } from 'drizzle-orm/pg-core';
