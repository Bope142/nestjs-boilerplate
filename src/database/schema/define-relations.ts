import type { Many, One, Relations } from 'drizzle-orm';

/** Re-export for portable declaration / IDE naming (avoids *.cjs TS2742). */
export type { Many, One, Relations };

/**
 * Widened relation export type so declaration emit names `Relations` /
 * `One` / `Many` via this module instead of non-portable `relations.cjs` paths.
 */
export type PortableRelations = Relations<
  string,
  Record<string, One<string, boolean> | Many<string>>
>;

/**
 * Wrap `relations(...)` so exported consts use {@link PortableRelations}.
 */
export function defineRelations(value: PortableRelations): PortableRelations {
  return value;
}
