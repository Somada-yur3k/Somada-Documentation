// Render the native XML with draw.io's upstream mxGraph and shape definitions.
// The editor MCP opens the same XML; this local check also works without a
// browser-control connection to the user's visible browser.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Eurika/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const qa = path.join(root, 'tmp/drawio-qa');
fs.mkdirSync(qa, { recursive: true });
async function vendor(name, relative) {
  const file = path.join(qa, name);
  if (!fs.existsSync(file)) {
    const response = await fetch('https://raw.githubusercontent.com/jgraph/drawio/dev/src/main/webapp/' + relative);
    if (!response.ok) throw new Error(`Cannot fetch ${name}: ${response.status}`);
    fs.writeFileSync(file, await response.text());
  }
  return file;
}
(async () => {
  const [client, shapes, er] = await Promise.all([
    vendor('mxClient.js', 'mxgraph/mxClient.js'),
    vendor('Shapes.js', 'js/grapheditor/Shapes.js'),
    vendor('mxER.js', 'shapes/er/mxER.js')
  ]);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1985, height: 2806 }, deviceScaleFactor: 1 });
    await page.setContent('<html><body style="margin:0;background:white"><div id="graph" style="width:1985px;height:2806px;position:relative;overflow:hidden"></div></body></html>');
    await page.evaluate(() => { window.mxLoadResources = false; window.mxLoadStylesheets = false; });
    await page.addScriptTag({ path: client });
    await page.addScriptTag({ path: shapes });
    await page.addScriptTag({ path: er });
    const xml = fs.readFileSync(path.join(root, 'output/drawio/erd-a4.drawio'), 'utf8');
    const routes = JSON.parse(fs.readFileSync(path.join(root, 'assets/erd/geometry.json'), 'utf8')).paths;
    const result = await page.evaluate(({ xml, routes }) => {
      const doc = mxUtils.parseXml(xml);
      if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid draw.io XML');
      const graph = new mxGraph(document.getElementById('graph'));
      graph.convertValueToString = cell => cell.value?.nodeType === 1 ? cell.value.getAttribute('label') || '' : cell.value || '';
      graph.setEnabled(false);
      new mxCodec(doc).decode(doc.getElementsByTagName('mxGraphModel')[0], graph.getModel());
      graph.refresh();
      const cells = Object.values(graph.getModel().cells);
      const edges = cells.filter(cell => cell.edge);
      const missing = edges.filter(cell => !cell.source || !cell.target || !graph.view.getState(cell)?.absolutePoints?.length);
      const badPaths = [], diagonalSegments = [], nonOrthogonalStyles = [];
      for (const route of routes) {
        const state = graph.view.getState(graph.model.getCell(route.id));
        const points = state.absolutePoints;
        if (graph.model.getCell(route.id).style.indexOf('edgeStyle=orthogonalEdgeStyle;') < 0) nonOrthogonalStyles.push(route.id);
        for (let i = 1; i < points.length; i++) {
          if (Math.abs(points[i].x - points[i - 1].x) > 0.01 && Math.abs(points[i].y - points[i - 1].y) > 0.01) diagonalSegments.push({ id: route.id, segment: i });
        }
        const expectedStart = route.points[0], expectedEnd = route.points.at(-1);
        if (Math.hypot(points[0].x - expectedStart[0], points[0].y - expectedStart[1]) > 0.1 ||
            Math.hypot(points.at(-1).x - expectedEnd[0], points.at(-1).y - expectedEnd[1]) > 0.1) badPaths.push(route.id);
      }
      const bounds = graph.getGraphBounds();
      return {
        tables: cells.filter(cell => cell.value?.getAttribute?.('table')).length,
        fields: cells.filter(cell => cell.value?.getAttribute?.('field')).length,
        relationships: edges.length,
        cardinalities: cells.filter(cell => cell.id?.startsWith('card-')).length,
        missingTerminals: missing.map(cell => cell.id), changedPathTerminals: badPaths,
        diagonalSegments, nonOrthogonalStyles,
        markers: ['ERmandOne', 'ERzeroToOne', 'ERzeroToMany'].map(name => ({ name, supported: !!mxMarker.markers[name] })),
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        oneA4Page: bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 827 * 2.4 && bounds.y + bounds.height <= 1169 * 2.4
      };
    }, { xml, routes });
    assert.equal(result.tables, 30);
    assert.equal(result.fields, 208);
    assert.equal(result.relationships, 61);
    assert.equal(result.cardinalities, 0, 'Numeric labels are omitted; Crow\'s Foot markers remain');
    assert.deepEqual(result.missingTerminals, []);
    assert.deepEqual(result.changedPathTerminals, []);
    assert.deepEqual(result.diagonalSegments, [], 'Every rendered connector segment is horizontal or vertical');
    assert.deepEqual(result.nonOrthogonalStyles, [], 'All connectors use orthogonal routing when edited');
    assert.ok(result.markers.every(marker => marker.supported));
    assert.ok(result.oneA4Page);
    await page.screenshot({ path: path.join(qa, 'erd-a4-native.png') });
    await page.screenshot({ path: path.join(qa, 'erd-a4-detail.png'), clip: { x: 780, y: 330, width: 1185, height: 630 } });
    fs.writeFileSync(path.join(qa, 'report.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
