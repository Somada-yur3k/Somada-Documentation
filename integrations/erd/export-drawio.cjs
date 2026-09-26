// Transfer the published one-page ERD to editable draw.io cells.
// Preserve schema, positions and routed paths from the existing source files.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const model = JSON.parse(fs.readFileSync(path.join(root, 'assets/erd/model.json'), 'utf8'));
const geometry = JSON.parse(fs.readFileSync(path.join(root, 'assets/erd/geometry.json'), 'utf8'));
const tables = new Map(model.tables.map(table => [table.name, table]));
const nodes = new Map(geometry.nodes.map(node => [node.name, node]));
const relations = model.tables.flatMap(table => table.fields.filter(field => field.ref).map(field => ({
  table: table.name, field: field.name, parent: field.ref.table, key: field.ref.field,
  optional: !!field.nullable, one: !!field.unique
}))).map((relation, index) => ({ ...relation, id: `R${String(index + 1).padStart(2, '0')}` }));
const byRelation = new Map(relations.map(relation => [relation.id, relation]));
assert.equal(geometry.nodes.length, model.tables.length);
assert.equal(geometry.paths.length, relations.length);

const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#xa;');
const attrs = value => Object.entries(value).map(([key, item]) => `${key}="${escape(item)}"`).join(' ');
const number = value => Number(value.toFixed(6));
const cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>'];
function vertex(id, label, parent, box, style, metadata = {}) {
  const attributes = { id, label, ...metadata };
  cells.push(`<object ${attrs(attributes)}><mxCell vertex="1" parent="${parent}" style="${escape(style)}"><mxGeometry ${attrs(box)} as="geometry"/></mxCell></object>`);
}
const textStyle = 'text;html=0;whiteSpace=nowrap;overflow=hidden;strokeColor=none;fillColor=none;fontFamily=Arial;fontColor=#182230;spacing=0;';

// Keep the published routing order so the crossing gaps are consistent.
for (const route of geometry.paths) {
  const relation = byRelation.get(route.id);
  for (const property of ['table', 'field', 'parent', 'key', 'optional', 'one']) {
    assert.equal(route[property], relation[property], `${route.id}: stale ${property}`);
  }
  const parent = nodes.get(route.parent);
  const child = nodes.get(route.table);
  const start = route.points[0], end = route.points.at(-1);
  const childIndex = child.fields.indexOf(route.field);
  assert.ok(childIndex >= 0);
  assert.equal(end[1], child.y + geometry.header + childIndex * geometry.row + geometry.row / 2);
  const tooltip = `${route.id}: ${route.parent}.${route.key} (${route.optional ? '0..1' : '1'}) to ${route.table}.${route.field} (${route.one ? '0..1' : '0..*'})`;
  const style = [
    'edgeStyle=orthogonalEdgeStyle', 'orthogonal=1', 'rounded=0', 'curved=0', 'jettySize=auto', 'html=0',
    'strokeColor=#243244', 'strokeWidth=1.5', 'jumpStyle=gap', 'jumpSize=5',
    `startArrow=${route.optional ? 'ERzeroToOne' : 'ERmandOne'}`,
    `endArrow=${route.one ? 'ERzeroToOne' : 'ERzeroToMany'}`,
    'startSize=12', 'endSize=12', 'startFill=0', 'endFill=0',
    `exitX=${route.parentSide === 'right' ? 1 : 0}`,
    `exitY=${number((start[1] - parent.y) / parent.h)}`, 'exitPerimeter=0',
    `entryX=${route.childSide === 'right' ? 1 : 0}`, 'entryY=0.5', 'entryPerimeter=0'
  ].join(';') + ';';
  const waypoints = route.points.slice(1, -1).map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join('');
  cells.push(`<object ${attrs({ id: route.id, label: '', tooltip, relationship: route.id, parentPK: `${route.parent}.${route.key}`, childFK: `${route.table}.${route.field}`, parentsPerChild: route.optional ? '0..1' : '1', childrenPerParent: route.one ? '0..1' : '0..*' })}><mxCell edge="1" parent="1" source="table-${route.parent}" target="field-${route.table}-${route.field}" style="${style}"><mxGeometry relative="1" as="geometry"><Array as="points">${waypoints}</Array></mxGeometry></mxCell></object>`);
}

for (const node of geometry.nodes) {
  const table = tables.get(node.name);
  assert.deepEqual(node.fields, table.fields.map(field => field.name));
  assert.equal(node.h, geometry.header + table.fields.length * geometry.row);
  const id = `table-${node.name}`;
  vertex(id, '', '1', { x: node.x, y: node.y, width: node.w, height: node.h },
    'shape=rectangle;container=1;collapsible=0;recursiveResize=0;html=0;fillColor=#ffffff;strokeColor=#65758b;strokeWidth=1.4;',
    { table: node.name, dataStore: table.store, tooltip: `${node.name}: ${table.purpose}` });
  vertex(`header-${node.name}`, node.name, id, { x: 0, y: 0, width: node.w, height: geometry.header },
    'shape=rectangle;html=0;whiteSpace=nowrap;overflow=hidden;fillColor=#edf2f7;strokeColor=#65758b;strokeWidth=1;fontFamily=Arial;fontSize=16.5;fontStyle=1;fontColor=#182230;spacing=0;align=center;verticalAlign=middle;movable=0;resizable=0;');
  table.fields.forEach((field, index) => {
    const rowId = `field-${node.name}-${field.name}`;
    const relation = relations.find(item => item.table === node.name && item.field === field.name);
    const key = [field.key, field.unique ? 'UK' : ''].filter(Boolean).join('\n');
    const tooltip = `${node.name}.${field.name}: ${field.type}; ${field.nullable ? 'nullable' : 'required'}${field.ref ? `; references ${field.ref.table}.${field.ref.field}` : ''}${field.unique ? '; unique' : ''}`;
    vertex(rowId, field.name + (field.nullable ? ' ?' : ''), id,
      { x: 0, y: geometry.header + index * geometry.row, width: node.w, height: geometry.row },
      'shape=rectangle;html=0;whiteSpace=nowrap;overflow=hidden;fillColor=#ffffff;strokeColor=#65758b;strokeWidth=0.45;fontFamily=Arial;fontSize=16;fontColor=#182230;align=left;verticalAlign=middle;spacing=0;spacingLeft=32;spacingRight=28;movable=0;resizable=0;',
      { field: field.name, logicalType: field.type, nullable: field.nullable, tooltip });
    if (key) vertex(`key-${node.name}-${field.name}`, key, rowId,
      { x: 4, y: 0, width: 26, height: geometry.row },
      textStyle + `fontSize=${field.unique ? 10 : 13};fontStyle=1;align=left;verticalAlign=middle;movable=0;resizable=0;`);
    if (relation) vertex(`ref-${relation.id}`, relation.id, rowId,
      { x: node.w - 27, y: 0, width: 23, height: geometry.row },
      textStyle + 'fontSize=10;align=right;verticalAlign=middle;movable=0;resizable=0;', { tooltip });
  });
}

// Crow's Foot markers remain on every connector. Exact numeric cardinalities
// remain in relationship metadata/tooltips, without duplicate visible labels.

// Native A4 portrait dimensions; pageScale keeps the original source geometry.
const graph = `<mxGraphModel dx="1980" dy="2800" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="0" page="1" pageScale="2.4" pageWidth="827" pageHeight="1169" background="#ffffff" math="0" shadow="0"><root>${cells.join('\n')}</root></mxGraphModel>`;
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" agent="PBL1 ERD export" version="29.0.0"><diagram id="erd-a4-complete" name="ERD - A4 Portrait">${graph}</diagram></mxfile>\n`;
const output = path.join(root, 'output/drawio/erd-a4.drawio');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, xml);
console.log(JSON.stringify({ file: output, pages: 1, format: 'A4 portrait', tables: model.tables.length,
  fields: model.tables.reduce((count, table) => count + table.fields.length, 0),
  relationships: relations.length, cardinalityLabels: 0, editable: true }, null, 2));
