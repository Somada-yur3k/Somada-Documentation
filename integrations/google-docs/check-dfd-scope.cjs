// Role-scope regression and publication assets. Never sends a Google Docs update.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..'),dir='assets/figures-v2/';
const model=JSON.parse(fs.readFileSync(path.join(root,dir,'dfd-level1/dfd-level1-model.json'),'utf8'));
assert.equal(model.flows.length,74);
assert.equal(model.entities.at(-1).id,'headlab');
assert.deepEqual(model.flows.filter(f=>f.label==='Daily Task Entry').map(f=>f.source),['headlab']);
 assert.deepEqual(model.flows.filter(f=>f.label==='Usage Entry').map(f=>f.source),['headlab']);
 assert(!model.flows.some(f=>['physics','circuits'].includes(f.source)&&f.target==='p5'));
assert(!model.flows.some(f=>f.label==='Laboratory Dashboard'));
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1200,height:1500},deviceScaleFactor:2}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const base=`http://127.0.0.1:${server.address().port}/`+dir;
    await page.goto(base+'dfd-level2-compact/dfd-level2-compact.html?process=p5&embed=1');
    await page.waitForFunction(()=>window.__done||window.__error);
    assert.equal(await page.evaluate(()=>window.__error),undefined);
    const child=await page.evaluate(()=>window.__level2.model);
    assert.deepEqual([...new Set(child.flows.map(f=>f.parentFlow))].sort(),model.flows.filter(f=>f.source==='p5'||f.target==='p5').map(f=>f.id).sort(),'Every Process 5 parent boundary flow is realized');
    assert(child.flows.filter(f=>f.label==='Daily Task Entry').every(f=>f.source==='headlab'));
    assert(child.flows.filter(f=>f.label==='Usage Entry').every(f=>f.source==='headlab'));
    assert(!child.flows.some(f=>['physics','circuits'].includes(f.source)));
    const signature=f=>[f.source,f.label,f.target].join('|');
    await page.goto(base+'dfd-level0/dfd-level0-source.html?export=1');
    await page.waitForFunction(()=>window.__done||window.__error);
    assert.equal(await page.evaluate(()=>window.__error),undefined);
    const flows=await page.evaluate(()=>FLOWS);
    assert.equal(flows.length,46);
    assert.deepEqual(flows.map(f=>signature({source:f.dir==='in'?f.entity:'system',target:f.dir==='in'?'system':f.entity,label:f.label})).sort(),model.flows.filter(f=>f.kind==='external').map(f=>signature({...f,source:f.source.startsWith('p')&&!['physics'].includes(f.source)?'system':f.source,target:f.target.startsWith('p')&&!['physics'].includes(f.target)?'system':f.target})).sort());
    const geometry=await page.evaluate(()=>window.__level0);
    const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
    assert.equal(Object.keys(geometry.nodes).length,7,'Six entities, one process, no duplicated nodes');
    assert.equal(new Set(Object.values(geometry.nodes).filter(n=>n.id!=='system').map(n=>n.w+'x'+n.h)).size,1);
    for(const [i,a]of geometry.labelBoxes.entries()){
      for(const b of geometry.labelBoxes.slice(i+1))assert(!overlap(a,b),'No label collisions: '+a.id+'/'+b.id);
      for(const n of Object.values(geometry.nodes))assert(!overlap(a,n),'No label/node collision: '+a.id);
      const r=geometry.routes.find(r=>r.id===a.id),xs=r.points.map(p=>p[0]);
      assert(a.x>=Math.min(...xs)+12&&a.x+a.w<=Math.max(...xs)-12,'Visible connectors on both sides: '+a.id);
    }
    assert.equal(await page.locator('.diagram-flow-label rect').count(),0);
    assert.equal(await page.locator('.diagram-connector[stroke-dasharray]').count(),46);
    await page.setViewportSize({width:1200,height:1500});
    await page.locator('#stage svg').screenshot({path:path.join(os.tmpdir(),'somada-level0-scope.png')});
    if(process.argv.includes('--render'))await page.locator('#stage svg').screenshot({path:path.join(root,dir,'dfd-level0/dfd-level0-draft.png')});
    assert.deepEqual(errors,[]);
    console.log('Scope passed: 74 L1 flows, 46 L0 flows, 17 P5 parent flows realized by 18 child exchanges; only Head Lab logs, schedules and Daily Tasks, Head Lab last.');
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
