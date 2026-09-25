// Read-only integration audit: no Google Docs writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/Docs.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelectorAll('.a4-page-number').length>0,null,{timeout:120000});
  assert.deepEqual(errors,[]);assert.equal(await page.locator('.doc-pages figure img').count(),19);
  const sheets=[];
  for(const id of [1,2]){
   const figure=page.locator('.doc-pages figure').filter({has:page.locator('img[src*="sequence-whole-'+id+'.png"]')});assert.equal(await figure.count(),1);
   const sheet=figure.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]');
   console.log('Page '+id,await sheet.getAttribute('data-page-number'),await sheet.locator('[data-section-id]').evaluateAll(ns=>ns.map(n=>n.dataset.sectionId)));
   assert.equal(await sheet.locator('figure').count(),1);assert.equal(await sheet.locator('[data-section-id="sequence-whole-'+id+'"]').count(),1,'Heading remains with sequence image');
   sheets.push(Number(await sheet.getAttribute('data-page-number')));
   await page.emulateMedia({media:'print'});await sheet.screenshot({path:path.join(os.tmpdir(),'sequence-docs-'+id+'.png')});await page.emulateMedia({media:'screen'});
  }
  assert.equal(sheets[1],sheets[0]+1);
  const sync=fs.readFileSync(path.join(root,'assets/google-doc-sync.js'),'utf8');
  await page.addScriptTag({content:sync.replace('window.GoogleDocSync={ open };','window.__collect=collectSection;')});
  const images=await page.evaluate(async()=>{const {blocks}=await window.__collect('sequence-diagrams');return blocks.filter(b=>b.kind==='image').map(b=>({caption:b.caption,width:b.width,height:b.height}));});
  assert.deepEqual(images.map(b=>b.caption),['Figure 17: Whole-System Sequence Diagram — Page 1 of 2','Figure 18: Whole-System Sequence Diagram — Page 2 of 2']);
  assert(images.every(b=>b.width===3600&&b.height>5000));
  const pdf=fs.readFileSync(path.join(root,'assets/system-diagrams/sequence-whole.pdf')).toString('latin1');assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,2);
  console.log('PASS: two consecutive full-page sequence figures in Docs, high-resolution sync capture, and exactly two PDF pages.');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
