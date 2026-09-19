// Browser audit for the new read-only Analytics page, including stale-source refusal.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..'),report=JSON.parse(fs.readFileSync(path.join(root,'assets/system-audit.json'),'utf8'));
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),base=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const g of report.groups){assert.equal(g.total,report.checks.filter(c=>c.group===g.id).length);assert.equal(g.passed,report.checks.filter(c=>c.group===g.id&&c.status==='pass').length);assert.equal(g.percent,g.total?Math.round(100*g.passed/g.total):null);}
  assert.equal(report.groups.find(g=>g.id==='erd').status,'pending');
  assert.equal(report.groups.find(g=>g.id==='erd').available,true,'The draft is available, not validated');
  assert.equal(report.groups.find(g=>g.id==='erd').percent,null,'No invented schema completeness score');
  assert(report.findings.some(f=>f.status==='pending'&&f.id==='ERD-01'));
  assert(report.findings.some(f=>f.status==='fixed'&&f.id==='POL-01'),'Confirmed sequential approval is no longer pending');
  assert(report.findings.some(f=>f.status==='pending'&&f.id==='POL-08'),'Dean account provisioning remains unresolved');
  for(const f of report.features){assert(f.events>0&&f.steps.length&&f.backlog.length);assert(f.stores.every(s=>report.stores.some(n=>n.id===s)));}
  await page.goto(base+'Analytics.html');await page.waitForFunction(()=>window.__auditReady||window.__auditError);assert.equal(await page.evaluate(()=>window.__auditError),undefined);
  assert.equal(await page.locator('#features tr').count(),20);assert.equal(await page.locator('#model-grid .model-card').count(),6);
  assert.equal(await page.locator('#findings article').count(),report.findings.filter(f=>f.status==='pending').length);
  await page.locator('#feature-search').fill('clearance');assert.equal(await page.locator('#features tr').count(),2);
  await page.locator('#feature-search').fill('no-match-test');assert.match(await page.locator('#features').innerText(),/No matching/);
  await page.locator('#feature-search').fill('');await page.locator('#process-filter').selectOption('p4');assert.equal(await page.locator('#features tr').count(),4);
  await page.locator('#process-filter').selectOption('');await page.locator('#finding-filter').selectOption('fixed');assert.equal(await page.locator('#findings article').count(),report.findings.filter(f=>f.status==='fixed').length);
  await page.locator('#finding-filter').selectOption('pending');
  const links=await page.locator('a').evaluateAll(as=>as.map(a=>a.href));for(const href of links.filter(h=>h.startsWith(base)))assert(fs.existsSync(path.join(root,new URL(href).pathname)),href);
  await page.screenshot({path:path.join(os.tmpdir(),'system-analytics-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile page must not overflow horizontally');
  await page.screenshot({path:path.join(os.tmpdir(),'system-analytics-mobile.png'),fullPage:true});
  // Mimic Live Server's marked reload block on the two fingerprinted HTML files.
  const reloadScript=[
   '<!-- Code injected by live-server -->','<script>',
   '\t// <![CDATA[  <-- For SVG support',
   "\tif ('WebSocket' in window) {",'\t\tfunction refreshCSS() {}',
   "\t\tvar address = 'ws://localhost/ws';",'\t\tvar socket = new WebSocket(address);',
   "\t\tconsole.log('Live reload enabled.');",'\t}','\t// ]]>','</script>',''
  ].join('\n');
  const htmlPaths=['Docs.html','assets/figures-v2/usecase-diagram-source.html'];
  let changedSource='',unknownScript=false;
  for(const file of htmlPaths)await page.route('**/'+file,async route=>{
   const response=await route.fetch();let body=(await response.text()).replace(/\r\n/g,'\n');
   if(changedSource===file)body=body.replace('</body>','<!-- actual authored change -->\n</body>');
   const injection=unknownScript?'<!-- Code injected by live-server -->\n<script>\nwindow.authoredChange = true;\n</script>\n':reloadScript;
   await route.fulfill({response,body:body.replace('</body>',injection+'</body>').replace(/\n/g,'\r\n')});
  });
  await page.reload();await page.waitForFunction(()=>window.__auditReady||window.__auditError);
  assert.equal(await page.evaluate(()=>window.__auditError),undefined,'Live Server injection and CRLF are transport-only changes');
  assert.equal(await page.locator('#audit-content').isVisible(),true);
  for(const file of htmlPaths){
   changedSource=file;await page.reload();await page.waitForFunction(()=>window.__auditError);
   assert((await page.locator('#load-state').innerText()).includes('Changed: '+file),'Authored changes remain detectable underneath reload injection');
   assert.equal(await page.locator('#audit-content').isVisible(),false);
  }
  changedSource='';unknownScript=true;
  await page.reload();await page.waitForFunction(()=>window.__auditError);
  assert.equal(await page.locator('#audit-content').isVisible(),false,'A matching comment alone must not hide arbitrary script changes');
  for(const file of htmlPaths)await page.unroute('**/'+file);
  await page.route('**/Docs.html',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\n<!-- changed after audit -->'});});
  await page.reload();await page.waitForFunction(()=>window.__auditError);assert.match(await page.locator('#load-state').innerText(),/stale/);assert.equal(await page.locator('#audit-content').isVisible(),false,'Stale snapshot cannot display green percentages');
  await page.unroute('**/Docs.html');await page.route('**/assets/system-audit.json',route=>route.fulfill({status:404,body:'not found'}));
  await page.reload();await page.waitForFunction(()=>window.__auditError);assert.match(await page.locator('#load-state').innerText(),/could not be loaded/);
  assert.deepEqual(errors,[]);console.log('Analytics passed: formulas, 20 traces, 6 models, pending ERD, filters, mobile layout, local links, Live Server / CRLF compatibility, real HTML edits, unknown scripts, missing-data and stale-source handling.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
