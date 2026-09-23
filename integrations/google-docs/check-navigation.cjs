// Navigation audit; no external link opened and no Google Docs writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../..');
const files=['index.html','Docs.html','Analytics.html','Current-System.html','assets/figures-v2/usecase-diagram-source.html','assets/figures-v2/dfd-level0/dfd-level0-source.html','assets/figures-v2/dfd-level1/dfd-level1-source.html','assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html'];
const google='https://docs.google.com/document/d/1UfFa6G0eWenSY_KjokZoOHqrQ2ajKGVgIwU56dkjpzY/edit';
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,d)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(d);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
const base='http://127.0.0.1:'+server.address().port+'/',page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
for(const file of files){
 await page.goto(base+file,{timeout:120000});await page.locator('nav[aria-label="Primary navigation"]').waitFor();
 const nav=page.locator('nav[aria-label="Primary navigation"]');
 assert.equal(await nav.getByRole('link',{name:'Google Docs ↗',exact:true}).getAttribute('href'),google);
 assert.equal(await nav.getByRole('link',{name:'Google Docs ↗',exact:true}).getAttribute('target'),'_blank');
 const links=await nav.locator('a').evaluateAll(as=>as.map(a=>({href:a.href,text:a.textContent})));
 assert(!links.some(a=>/traceable/i.test(a.href+' '+a.text)));
 for(const name of ['Home','Documentation','Analytics','Current System','Use Case','DFD Level 0','DFD Level 1','DFD Level 2'])assert.equal(await nav.getByRole('link',{name,exact:true}).count(),1,file+' '+name);
 for(const a of links.filter(a=>a.href.startsWith(base)))assert(fs.existsSync(path.join(root,decodeURIComponent(new URL(a.href).pathname))),a.href);
 assert.equal(await nav.locator('[aria-current="page"]').count(),1);
 if(file.includes('dfd-level1/')||file.includes('dfd-level2-compact/')){
  await page.setViewportSize({width:390,height:844});
  const doc=await nav.getByRole('link',{name:'Documentation',exact:true}).boundingBox();assert(doc&&doc.x>=0&&doc.x+doc.width<=390);
  await nav.getByRole('link',{name:'Documentation',exact:true}).click();await page.waitForURL('**/Docs.html');
  await page.goto(base+file+'?export=1');await page.waitForFunction(()=>window.__done||window.__error);assert.equal(await nav.isVisible(),false);
  await page.setViewportSize({width:1440,height:900});
 }
}
for(const [old,target]of [['dfd-level1-traceable/dfd-level1-traceable-source.html','dfd-level1/dfd-level1-source.html'],['dfd-level2-traceable/dfd-level2-traceable.html','dfd-level2-compact/dfd-level2-compact.html']]){
 await page.goto(base+'assets/figures-v2/'+old);await page.waitForURL('**/'+target);
}
assert.deepEqual(errors,[]);console.log('Eight primary menus, Analytics links, Google Docs target, mobile Documentation return, legacy redirects and clean exports passed.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
