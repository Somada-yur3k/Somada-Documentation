// Read-only browser checks: no Google connection or document updates.
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../../CHANGELOG-WRITING.html')).href);
    await page.waitForSelector('body.ready');
    const readPages = () => page.evaluate(() => {
      const sheets = [...document.querySelectorAll('#pages .page')];
      return {
        count: sheets.length,
        source: [...document.querySelectorAll('#source > *')].map(node => node.textContent),
        output: [...document.querySelectorAll('#pages .page-content > *')].map(node => node.textContent),
        overflow: sheets.flatMap((sheet, index) => {
          const content = sheet.querySelector('.page-content');
          const box = content.getBoundingClientRect();
          const outside = [...content.children].some(node => {
            const bounds = node.getBoundingClientRect();
            return bounds.bottom > box.bottom + 1 || bounds.right > box.right + 1;
          });
          const paper = sheet.getBoundingClientRect();
          return outside || content.scrollHeight > content.clientHeight + 1 ||
            Math.abs(paper.width / paper.height - 210 / 297) > 0.002 ? [index + 1] : [];
        }),
        numbering: sheets.map(sheet => sheet.querySelector('.page-number').textContent)
      };
    });
    for (const media of ['screen', 'print']) {
      await page.emulateMedia({media});
      const result = await readPages();
      assert.deepEqual(result.output, result.source, 'Pagination must not omit, duplicate or reorder text');
      assert.deepEqual(result.overflow, [], 'All comparisons must fit within A4 content bounds');
      assert.deepEqual(result.numbering, Array.from({length: result.count}, (_, i) => `Page ${i + 1} of ${result.count}`));
    }
    assert.equal(await page.locator('.toolbar').isVisible(), false, 'Print controls must not appear on paper');
    assert.equal(await page.locator('#pages [data-entry]').count(), 135);
    assert.deepEqual(errors, []);
    console.log(`PASS: 135 comparisons, ${(await readPages()).count} A4 pages, full text retained, no overflow in screen or print.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
