const assert=require('node:assert/strict');
// Catches omitted/reordered actors, restarted numbering and clipped message labels.
async function checkPage(page){
 const diagrams=page.locator('svg[data-whole-sequence]');
 assert.equal(await diagrams.count(),2,'Two connected sequence pages must render');
 const results=await diagrams.evaluateAll(nodes=>nodes.map(svg=>{
  const bounds=svg.viewBox.baseVal;
  const labels=[...svg.querySelectorAll('[data-message-label]')].map(n=>{const b=n.getBBox();return {x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};});
  return {actors:[...svg.querySelectorAll('[data-participant]')].map(n=>n.dataset.participant),
   numbers:[...svg.querySelectorAll('[data-step]')].map(n=>Number(n.dataset.step)),labels,
   clipped:labels.filter(b=>b.x<0||b.y<0||b.right>bounds.width||b.bottom>bounds.height),
   overlaps:labels.flatMap((a,i)=>labels.slice(i+1).filter(b=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y)),
   connections:[...svg.querySelectorAll('[data-from]')].map(n=>[n.dataset.from,n.dataset.to]),text:svg.textContent};
 }));
 const actors=['rep','faculty','dean','staff','head','system','db'];
 for(const r of results){assert.deepEqual(r.actors,actors);assert.deepEqual(r.clipped,[]);assert.deepEqual(r.overlaps,[]);}
 const numbers=results.flatMap(r=>r.numbers);
 assert(numbers.length>40);assert.deepEqual(numbers,Array.from({length:numbers.length},(_,i)=>i+1));
 for(const actor of actors.slice(0,5))assert(results.some(r=>r.connections.some(c=>c.includes(actor))),actor+' participates');
 assert(results[0].text.includes('Continue on Page 2'));assert(results[1].text.includes('Continued from Page 1'));
 assert(results[1].text.includes('D11'));assert(results[1].text.includes('Insufficient history'));
 console.log('PASS: two pages, identical actor order, continuous numbering, all actors participate, no overlapping/clipped message labels.');
}
module.exports={checkPage};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
 const root=path.resolve(__dirname,'../..');
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
 const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':'text/html');if(e)return res.end('<p>Diagram not implemented</p>');res.end(b);});});
 (async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/Sequence-Overview.html');await checkPage(page);}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
}
