// Export the six requested diagrams; preserve existing published artwork and ERD layout.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), vm = require('node:vm'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Eurika/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/diagram-pdf-exports.js'), 'utf8'), sandbox);
const exportsList = sandbox.window.DocumentDiagramExports;
const pdfjsRoot = process.env.PDFJS_ROOT || 'C:/Users/Eurika/AppData/Local/npm-cache/_npx/7673eca99d5dbcb2/node_modules/pdfjs-dist';
const output = path.join(root, 'output/pdf'), downloads = path.join(root, 'assets/downloads/diagrams'), qa = path.join(root, 'tmp/pdfs/selected-diagrams');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.json': 'application/json' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
  if (pathname === '/pdf-qa') return response.writeHead(200, { 'Content-Type': 'text/html' }).end('<html><body style="margin:0;background:white"><canvas id="page"></canvas></body></html>');
  const prefix = pathname.startsWith('/pdfjs/') ? pdfjsRoot : root;
  const file = path.resolve(prefix, '.' + (prefix === pdfjsRoot ? pathname.slice(6) : pathname));
  if (!file.startsWith(path.resolve(prefix) + path.sep)) return response.writeHead(403).end();
  fs.readFile(file, (error, data) => { if (error) return response.writeHead(404).end(); response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(data); });
});

(async () => {
  let browser;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    [output, downloads, qa].forEach(folder => fs.mkdirSync(folder, { recursive: true }));
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1800 } });
    for (const item of exportsList) {
      const file = path.join(output, item.file);
      if (item.pdf) fs.copyFileSync(path.join(root, item.pdf), file);
      else {
        let svg;
        if (item.svg) svg = fs.readFileSync(path.join(root, item.svg), 'utf8');
        else {
          await page.goto(base + '/' + item.source);
          await page.waitForFunction(() => window.__done);
          svg = await page.locator(item.selector).evaluate(source => {
            const clone = source.cloneNode(true), originals = [source, ...source.querySelectorAll('*')], copies = [clone, ...clone.querySelectorAll('*')];
            const properties = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'opacity', 'paint-order'];
            copies.forEach((node, index) => { const style = getComputedStyle(originals[index]); properties.forEach(property => node.style.setProperty(property, style.getPropertyValue(property))); });
            clone.querySelectorAll('.diagram-handle-layer,.diagram-connector-hit').forEach(node => node.remove());
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            return new XMLSerializer().serializeToString(clone);
          });
        }
        await page.setContent('<!doctype html><html><head><style>@page{size:A4 portrait;margin:5mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}.diagram{height:276mm;width:200mm;display:flex;align-items:center;justify-content:center}.diagram svg{width:100%;height:100%;max-width:100%;max-height:100%;display:block}p{font:italic 10pt/1.3 "Times New Roman",serif;margin:3mm 0 0;text-align:center;height:8mm}</style></head><body><div class="diagram"></div><p></p></body></html>');
        await page.evaluate(({ svg, caption }) => { document.querySelector('.diagram').innerHTML = svg; document.querySelector('p').textContent = caption; }, { svg, caption: item.caption });
        await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
      }
      fs.copyFileSync(file, path.join(downloads, item.file));
      console.log('Exported ' + item.file);
    }
    await page.goto(base + '/pdf-qa');
    const results = [];
    for (const item of exportsList) {
      const result = await page.evaluate(async filename => {
        const pdfjs = await import('/pdfjs/build/pdf.mjs'); pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';
        const doc = await pdfjs.getDocument({ url: '/output/pdf/' + filename, standardFontDataUrl: '/pdfjs/standard_fonts/' }).promise;
        const pdfPage = await doc.getPage(1), viewport = pdfPage.getViewport({ scale: 2 }), canvas = document.getElementById('page');
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const text = (await pdfPage.getTextContent()).items.filter(item => item.str.trim());
        const bounds = text.filter(item => item.transform[4] < -1 || item.transform[5] < -1 || item.transform[4] + item.width > pdfPage.view[2] + 2 || item.transform[5] > pdfPage.view[3] + 2);
        const result = { file: filename, pages: doc.numPages, size: pdfPage.view, text: text.map(item => item.str).join(' '), textOutsidePage: bounds.map(item => item.str) };
        await doc.destroy(); return result;
      }, item.file);
      assert.equal(result.pages, 1, item.file + ' must contain only the selected diagram');
      assert.ok(Math.abs(result.size[2] - 595.28) < 1 && Math.abs(result.size[3] - 841.89) < 1, item.file + ' must be A4 portrait');
      assert.equal(result.textOutsidePage.length, 0, item.file + ' text stays inside the page');
      await page.locator('#page').screenshot({ path: path.join(qa, item.file.replace('.pdf', '.png')) });
      results.push(result);
    }
    fs.writeFileSync(path.join(qa, 'report.json'), JSON.stringify(results, null, 2));
    console.log('Verified all six PDFs: one A4 portrait page each, no text outside page; rendered actual PDF previews.');
    // Downloads live outside .doc-source and .pagedjs_area so publication/sync stay unchanged.
    await page.goto(base + '/Docs.html', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => document.querySelector('.diagram-pdf-toolbar'), null, { timeout: 120000 });
    const links = await page.locator('.diagram-pdf-toolbar a').evaluateAll(nodes => nodes.map(node => ({ file: node.download, href: node.href })));
    for (const item of exportsList) {
      const link = links.find(link => link.file === item.file); assert.ok(link, 'Missing download for ' + item.label);
      const response = await page.request.get(link.href); assert.equal(response.status(), 200); assert.ok((await response.body()).subarray(0, 5).equals(Buffer.from('%PDF-')));
    }
    assert.equal(await page.locator('.doc-source .diagram-pdf-toolbar,.pagedjs_area .diagram-pdf-toolbar').count(), 0);
    for (const item of exportsList) {
      const link = page.locator('.diagram-pdf-toolbar a[download="' + item.file + '"]').first();
      const downloaded = page.waitForEvent('download'); await link.click(); const download = await downloaded;
      assert.equal(download.suggestedFilename(), item.file); assert.equal(await download.failure(), null);
    }
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.diagram-pdf-toolbar').first().evaluate(node => getComputedStyle(node).display), 'none');
    await page.emulateMedia({ media: 'screen' });
    const toolbar = page.locator('.diagram-pdf-toolbar').filter({ hasText: 'Activity Diagram 2.0' }).first();
    await toolbar.scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(qa, 'documentation-download-button.png') });
    console.log('Verified all six download buttons in Docs: correct files, successful clicks, controls excluded from print and Google Docs source.');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
