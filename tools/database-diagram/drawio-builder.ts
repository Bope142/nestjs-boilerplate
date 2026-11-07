import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import type { SchemaDiff, TableChange } from './types';

/** Avoid clash with DOM lib `Document` when running under Nest's tsconfig. */
type XmlDocument = ReturnType<DOMParser['parseFromString']>;

const COLORS = {
  added: '#D5E8D4',
  removed: '#F8CECC',
  modified: '#FFF2CC',
  unchanged: '#DAE8FC',
  header: '#1A3A5C',
  edge: '#666666',
} as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cellStyle(kind: TableChange['kind']): string {
  const fill =
    kind === 'added'
      ? COLORS.added
      : kind === 'removed'
        ? COLORS.removed
        : kind === 'modified'
          ? COLORS.modified
          : COLORS.unchanged;
  return `rounded=1;whiteSpace=wrap;html=1;fillColor=${fill};strokeColor=#666666;align=left;verticalAlign=top;spacing=8;fontSize=11;`;
}

function tableHtml(table: TableChange): string {
  const rows = table.columns
    .map((col) => {
      const mark =
        col.kind === 'added'
          ? '+'
          : col.kind === 'removed'
            ? '−'
            : col.kind === 'modified'
              ? '~'
              : ' ';
      const detail = col.detail ? ` : ${col.detail}` : '';
      return `${mark} ${col.name}${detail}`;
    })
    .join('<br/>');
  return `<b>${escapeXml(table.name)}</b><br/>${rows}`;
}

function layoutTables(tables: TableChange[]): Array<{
  table: TableChange;
  x: number;
  y: number;
  w: number;
  h: number;
}> {
  const cols = Math.max(1, Math.ceil(Math.sqrt(tables.length)));
  const gapX = 40;
  const gapY = 40;
  const baseW = 240;
  return tables.map((table, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const h = Math.max(80, 28 + table.columns.length * 16);
    return {
      table,
      x: 40 + col * (baseW + gapX),
      y: 40 + row * (220 + gapY),
      w: baseW,
      h,
    };
  });
}

export function buildDiagramPageXml(
  pageName: string,
  diff: SchemaDiff,
  options?: { includeUnchangedTables?: boolean },
): string {
  const includeUnchanged = options?.includeUnchangedTables ?? true;
  const tables = diff.tables.filter(
    (t) => includeUnchanged || t.kind !== 'unchanged',
  );
  // For current schema page, always show all tables
  const visible =
    includeUnchanged || tables.length === 0 ? diff.tables : tables;

  const laidOut = layoutTables(
    visible.filter((t) => t.kind !== 'removed' || !includeUnchanged),
  );

  const rootId = '1';
  const cells: string[] = [
    `<mxCell id="0"/>`,
    `<mxCell id="${rootId}" parent="0"/>`,
  ];

  const tableCellIds = new Map<string, string>();
  let nextId = 2;

  for (const item of laidOut) {
    if (item.table.kind === 'removed' && includeUnchanged) {
      // skip removed on current schema
      continue;
    }
    const id = String(nextId++);
    tableCellIds.set(item.table.name, id);
    const value = escapeXml(tableHtml(item.table));
    cells.push(
      `<mxCell id="${id}" value="${value}" style="${cellStyle(item.table.kind)}" vertex="1" parent="${rootId}"><mxGeometry x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" as="geometry"/></mxCell>`,
    );
  }

  for (const fk of diff.foreignKeys) {
    if (fk.kind === 'removed' && includeUnchanged) continue;
    const source = tableCellIds.get(fk.from);
    const target = tableCellIds.get(fk.to);
    if (!source || !target) continue;
    const id = String(nextId++);
    const label = escapeXml(
      `${fk.columnsFrom.join(',')}\n→ ${fk.columnsTo.join(',')}`,
    );
    const stroke =
      fk.kind === 'added'
        ? '#82B366'
        : fk.kind === 'removed'
          ? '#B85450'
          : fk.kind === 'modified'
            ? '#D6B656'
            : COLORS.edge;
    cells.push(
      `<mxCell id="${id}" value="${label}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=${stroke};fontSize=10;endArrow=block;" edge="1" parent="${rootId}" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry"/></mxCell>`,
    );
  }

  return [
    `<diagram id="${escapeXml(slugify(pageName))}" name="${escapeXml(pageName)}">`,
    `<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0">`,
    `<root>`,
    ...cells,
    `</root>`,
    `</mxGraphModel>`,
    `</diagram>`,
  ].join('');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

export function createEmptyMxFile(): XmlDocument {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="nestjs-boilerplate-database-diagram" version="22.1.0">
</mxfile>`;
  return new DOMParser().parseFromString(xml, 'text/xml');
}

export function parseMxFile(xml: string): XmlDocument {
  return new DOMParser().parseFromString(xml, 'text/xml');
}

export function serializeMxFile(doc: XmlDocument): string {
  const serializer = new XMLSerializer();
  const body = serializer.serializeToString(doc);
  return body.startsWith('<?xml')
    ? body
    : `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
}

export function listPageNames(doc: XmlDocument): string[] {
  const diagrams = doc.getElementsByTagName('diagram');
  const names: string[] = [];
  for (let i = 0; i < diagrams.length; i++) {
    const name = diagrams.item(i)?.getAttribute('name');
    if (name) names.push(name);
  }
  return names;
}

export function upsertPage(
  doc: XmlDocument,
  pageName: string,
  pageXml: string,
  options?: { overwrite?: boolean },
): void {
  const overwrite = options?.overwrite ?? false;
  const root = doc.documentElement;
  if (!root) {
    throw new Error('Invalid mxfile: missing root element');
  }

  const existing = Array.from(doc.getElementsByTagName('diagram')).find(
    (el) => el.getAttribute('name') === pageName,
  );

  if (existing && !overwrite) {
    throw new Error(
      `Draw.io page already exists and will not be overwritten: ${pageName}`,
    );
  }

  const pageDoc = new DOMParser().parseFromString(
    `<mxfile>${pageXml}</mxfile>`,
    'text/xml',
  );
  const newDiagram = pageDoc.getElementsByTagName('diagram').item(0);
  if (!newDiagram) {
    throw new Error('Failed to parse generated diagram page');
  }

  const imported = doc.importNode(newDiagram, true);
  if (existing) {
    root.replaceChild(imported, existing);
  } else if (pageName.startsWith('00 ')) {
    const first = root.getElementsByTagName('diagram').item(0);
    if (first) root.insertBefore(imported, first);
    else root.appendChild(imported);
  } else {
    root.appendChild(imported);
  }
}

export const CURRENT_SCHEMA_PAGE = '00 — Current Database Schema';

export function migrationPageName(index: number, tag: string): string {
  const n = String(index + 1).padStart(2, '0');
  return `${n} — ${tag}`;
}
