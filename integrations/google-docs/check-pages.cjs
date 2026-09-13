// Browser regression check. Set PLAYWRIGHT_MODULE to an installed playwright module.
// No Google Docs requests or mutations are made.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error,data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    page.on('console',message => { if (message.type()==='error') console.error('Browser:',message.text()); });
    page.on('requestfailed',request => console.error('Request failed:',request.url(),request.failure()?.errorText));
    await page.goto(`http://127.0.0.1:${server.address().port}/Docs.html`,{waitUntil:'load'});
    await page.waitForFunction(() => document.querySelectorAll('.a4-page-number').length > 0, null, {timeout:120000}).catch(async error => {
      console.error('Page state:',await page.locator('body').innerText(),errors);
      throw error;
    });
    const result = await page.evaluate(() => {
      const pages = [...document.querySelectorAll('.doc-pages .pagedjs_page')];
      const styles = pages.map(p => ({width:p.getBoundingClientRect().width,height:p.getBoundingClientRect().height}));
      const numbers = pages.map(p => p.querySelector('.a4-page-number')?.textContent || '');
      const ids = [...document.querySelectorAll('[id]')].map(n => n.id);
      const toc = [...document.querySelectorAll('.doc-pages .toc-row')].map(a => ({
        printed:a.querySelector('.toc-page').textContent,
        actual:DocumentPages.find(document.querySelector('.doc-pages'),a.hash.slice(1)).closest('.pagedjs_page').dataset.pageNumber
      }));
      const colors = [...document.querySelectorAll('.doc-pages table th,.doc-pages table td')].map(n => {
        const s = getComputedStyle(n); return {background:s.backgroundColor,color:s.color};
      });
      const originalText = document.querySelector('.doc-source').innerText;
      const compact = s => s.replace(/\s+/g,'');
      const previewText = compact(document.querySelector('.doc-pages').textContent);
      const missingCells = [...document.querySelectorAll('.doc-source table td')].filter(n => !previewText.includes(compact(n.textContent))).map(n=>n.textContent.slice(0,90));
      const overflow = pages.map((p,i)=>{
        const area=p.querySelector('.pagedjs_area');
        const box=area.getBoundingClientRect();
        const outside=[...area.querySelectorAll('td,img,p,li')].filter(n=>n.getBoundingClientRect().bottom>box.bottom+2);
        return {page:i,overflow:outside.length,first:outside[0]?.textContent.slice(0,60)};
      }).filter(p=>p.overflow);
      return {count:pages.length,styles,numbers,toc,colors,duplicateIds:ids.filter((id,i) => ids.indexOf(id)!==i),
        missingCells,overflow,
        sourceTables:document.querySelectorAll('.doc-source table').length,
        sourceLastRow:document.querySelector('.doc-source #uc-endterm').textContent.includes('If the export fails'),
        lastPageText:pages.at(-1).textContent.slice(-200),originalTextLength:originalText.length};
    });
    await page.screenshot({path:path.join(os.tmpdir(),'somada-a4-initial.png')});
    console.log('Diagnostics:',JSON.stringify({count:result.count,colors:[...new Set(result.colors.map(c=>JSON.stringify(c)))],toc:result.toc,wrapperCount:await page.locator('.doc-pages .a4-document').count()}));
    assert.equal(errors.length,0,errors.join('\n'));
    assert(result.count>10,'The paper should span separate sheets');
    for (const size of result.styles) {
      assert(Math.abs(size.width-210*96/25.4)<1,'A4 width');
      assert(Math.abs(size.height-297*96/25.4)<1,'A4 height');
    }
    assert.deepEqual(result.numbers,['',...Array.from({length:result.count-1},(_,i)=>String(i+1))]);
    assert.deepEqual(result.duplicateIds,[]);
    assert(result.toc.every(t=>t.printed===t.actual),'TOC matches rendered pages');
    assert(result.colors.every(c=>c.background==='rgb(255, 255, 255)' && c.color==='rgb(0, 0, 0)'),'Plain black-and-white tables');
    assert.equal(result.sourceTables,23,'20 use-case tables plus backlog, events and gap analysis retained for sync');
    assert.deepEqual(result.missingCells,[],'All table cell contents appear in preview');
    assert.deepEqual(result.overflow,[],'Content fits the page area');
    assert(result.sourceLastRow);
    assert.equal(await page.locator('.doc-pages figure img').count(),9,'Nine current figures retained; legacy ERD excluded');
    assert.equal(await page.locator('.doc-source #erd img').count(),0,'No obsolete ERD is submitted or synced');
    const level1=page.locator('.doc-pages .dfd-level1-figure');
    assert.equal(await level1.count(),1,'Level 1 figure is not split or duplicated');
    const level1Page=level1.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]');
    assert.equal(await level1Page.locator('[data-section-id="dfd-level1"]').count(),1,'Level 1 heading stays with its diagram');
    assert.equal(await level1Page.locator('figcaption').filter({hasText:'Figure 3: Level 1 Data Flow Diagram'}).count(),1);
    const imageSize=await level1.locator('img').evaluate(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}));
    assert.equal(imageSize.naturalWidth/imageSize.naturalHeight,1770/2220,'Preview uses the portrait export');
    assert(28.8*Math.min(imageSize.width/1770,imageSize.height/2220)*72/96>=8,'Smallest node text remains at least 8 pt on the A4 page');
    await page.emulateMedia({media:'print'});
    await level1Page.screenshot({path:path.join(os.tmpdir(),'somada-a4-level1.png')});
    await page.emulateMedia({media:'screen'});
    console.log('Level 1 single-sheet A4 check:',JSON.stringify(imageSize));
    const usecase=page.locator('.doc-pages figure').filter({has:page.locator('img[src*="usecase-diagram-draft.png"]')});
    assert.equal(await usecase.count(),1,'One complete use-case figure');
    const usecaseSheet=usecase.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]');
    assert.equal(await usecaseSheet.locator('[data-section-id="usecase-diagrams"]').count(),1,'Use-case heading stays with image');
    const ucSize=await usecase.locator('img').evaluate(img=>({w:img.getBoundingClientRect().width,nw:img.naturalWidth,nh:img.naturalHeight}));
    assert.equal(ucSize.nw,3200);assert.equal(ucSize.nh,3320);
    assert(22*ucSize.w/1600*.75>=6.7,'Requested compact use-case text remains at least 6.7 pt on A4');
    await page.emulateMedia({media:'print'});
    await usecaseSheet.screenshot({path:path.join(os.tmpdir(),'laboratory-a4-usecase.png')});
    await page.emulateMedia({media:'screen'});
    const context=page.locator('.doc-pages figure').filter({has:page.locator('img[src*="dfd-level0-draft.png"]')});
    assert.equal(await context.count(),1,'One complete context diagram');
    const contextSheet=context.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]');
    assert.equal(await contextSheet.locator('[data-section-id="context-diagram"]').count(),1,'Context heading stays with image');
    const contextSize=await context.locator('img').evaluate(img=>({w:img.getBoundingClientRect().width,nw:img.naturalWidth,nh:img.naturalHeight}));
    assert.equal(contextSize.nw,2400);assert.equal(contextSize.nh,3000);
    assert(22*contextSize.w/1200*.75>=8,'Level 0 printed labels at least 8 pt');
    await page.emulateMedia({media:'print'});
    await contextSheet.screenshot({path:path.join(os.tmpdir(),'laboratory-a4-level0.png')});
    for(const id of ['p1','p2','p3','p4','p5']){
      const figure=page.locator('.doc-pages figure').filter({has:page.locator('img[src*="dfd-level2-'+id+'.png"]')});
      assert.equal(await figure.count(),1,'One complete Level 2 image: '+id);
      const sheet=figure.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]');
      assert.equal(await sheet.locator('[data-section-id="dfd-'+id+'"]').count(),1,'Level 2 heading stays with image: '+id);
      const size=await figure.locator('img').evaluate(img=>({w:img.getBoundingClientRect().width,h:img.getBoundingClientRect().height,nw:img.naturalWidth,nh:img.naturalHeight}));
      assert.equal(size.nw,2400);assert.equal(size.nh,1900);
      assert(27*size.w/1770*.75>=7.5,'Level 2 printed label size: '+id);
      await sheet.screenshot({path:path.join(os.tmpdir(),'laboratory-a4-level2-'+id+'.png')});
    }
    await page.emulateMedia({media:'screen'});
    // Expose only the read-only collector in this test page. Never call send().
    const syncSource=fs.readFileSync(path.join(root,'assets/google-doc-sync.js'),'utf8');
    assert(syncSource.includes('window.GoogleDocSync={ open };'));
    await page.addScriptTag({content:syncSource.replace('window.GoogleDocSync={ open };','window.__collectSyncSection=collectSection;')});
    const captured=await page.evaluate(async()=>{
      const {blocks}=await window.__collectSyncSection('dfd');
      return blocks.filter(b=>b.kind==='image').map(b=>({width:b.width,height:b.height,caption:b.caption,png:b.data.startsWith('iVBORw0KGgo')}));
    });
    assert.equal(captured.length,6,'Sync retains Level 1 and all five Level 2 images');
    assert.equal(captured[0].width,1770);assert.equal(captured[0].height,2220);
    assert(captured.every(image=>image.png),'Every DFD exports as a PNG');
    console.log('Read-only Google Docs capture passed: six diagrams; Level 1 portrait 1770 x 2220.');
    await page.locator('.doc-pages .toc-row[href="#backlog"]').click();
    await page.waitForTimeout(700);
    const screenshot = path.join(os.tmpdir(),'somada-a4-backlog.png');
    await page.screenshot({path:screenshot});
    const countBefore = result.count;
    await page.getByRole('button',{name:'Zoom document in',exact:true}).click();
    assert.equal(await page.locator('.doc-pages .pagedjs_page').count(),countBefore,'Zoom does not repaginate');
    await page.setViewportSize({width:800,height:900});
    assert.equal(await page.locator('.doc-pages .pagedjs_page').count(),countBefore,'Narrow screens retain paper geometry');
    await page.getByRole('button',{name:/Reset document zoom/}).click();
    const cellGeometry = () => [...document.querySelectorAll('.doc-pages td,.doc-pages th')].map(n=>[n.getBoundingClientRect().width,n.getBoundingClientRect().height]);
    const screenCells = await page.evaluate(cellGeometry);
    await page.emulateMedia({media:'print'});
    assert.deepEqual(await page.evaluate(cellGeometry),screenCells,'Print preserves table geometry');
    const pdf = path.join(os.tmpdir(),'somada-a4-preview.pdf');
    await page.pdf({path:pdf,preferCSSPageSize:true,displayHeaderFooter:false});
    console.log(JSON.stringify({count:result.count,toc:result.toc,sourceTables:result.sourceTables,screenshot,pdf,errors},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
