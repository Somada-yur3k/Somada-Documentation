const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),model=require('../../assets/erd/model.js'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const tables=new Map(model.tables.map(t=>[t.name,t]));
assert.equal(tables.size,model.tables.length);assert.deepEqual([...new Set(model.tables.map(t=>t.store))].sort(),['D1','D10','D11','D2','D3','D4','D5','D6','D7','D8','D9']);
assert.deepEqual(model.sheets.flatMap(s=>s.main).sort(),[...tables.keys()].sort(),'Every table has exactly one full-definition sheet');
for(const t of model.tables){assert.equal(t.fields.filter(f=>f.key==='PK').length,1,t.name+' has one PK');assert.equal(new Set(t.fields.map(f=>f.name)).size,t.fields.length);for(const f of t.fields){if(!f.ref)continue;assert(tables.get(f.ref.table)?.fields.some(p=>p.name===f.ref.field&&p.key==='PK'),t.name+'.'+f.name+' points to a PK');}for(const u of t.unique)assert(u.every(k=>t.fields.some(f=>f.name===k)));}
const server=http.createServer((req,res)=>{const target=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!target.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(target,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(target)]||'application/octet-stream');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/ERD.html');await page.waitForFunction(()=>window.__erdReady,{},{timeout:60000}).catch(e=>{throw Error(errors.join('\n')||e.message);});assert.deepEqual(errors,[]);
 const geometry=await page.evaluate(()=>window.ErdGeometry);let total=0;
 let closeRuns=0,mergedRuns=0;
 for(const g of Object.values(geometry))for(let i=0;i<g.paths.length;i++)for(let j=i+1;j<g.paths.length;j++){
  const p=g.paths[i],q=g.paths[j];
  const segments=r=>r.points.slice(3,-1).slice(1).map((b,k)=>[r.points[k+3],b]);
  for(const [a,b] of segments(p))for(const [c,d] of segments(q)){
   const vertical=a[0]===b[0];if(vertical!==(c[0]===d[0]))continue;
   const axis=vertical?1:0,perp=1-axis,shared=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]))-Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis])),gap=Math.abs(a[perp]-c[perp]);
   if(shared>40&&gap<12){closeRuns++;if(gap<.1)mergedRuns++;console.log('Close routes',p.id,q.id,{a,b,c,d,gap,shared});}
  }
 }
 console.log('Long parallel routing conflicts:',{closeRuns,mergedRuns});
 assert.equal(mergedRuns,0,'Long relationship routes never share a segment');
 assert.equal(closeRuns,0,'Long parallel runs maintain at least 12 SVG units of separation');
 for(const sheet of model.sheets){const g=geometry[sheet.id],nodes=new Map(g.nodes.map(n=>[n.name,n]));
  assert.equal(g.paths.length,sheet.main.reduce((n,name)=>n+tables.get(name).fields.filter(f=>f.ref).length,0));total+=g.paths.length;
  for(const p of g.paths){const a=nodes.get(p.parent),b=nodes.get(p.table),start=p.points[0],end=p.points.at(-1);assert.equal(start[1],a.y+g.header+a.fields.indexOf(p.key)*g.row+g.row/2,'Parent PK row attachment');assert.equal(end[1],b.y+g.header+b.fields.indexOf(p.field)*g.row+g.row/2,'Child FK row attachment');assert([a.x,a.x+a.w].includes(start[0]));assert([b.x,b.x+b.w].includes(end[0]));
   p.points.slice(1).forEach((v,i)=>{const u=p.points[i];assert(u[0]===v[0]||u[1]===v[1],'Orthogonal relationship');for(const n of g.nodes){if(n.name===p.parent||n.name===p.table)continue;const cross=u[0]===v[0]?u[0]>n.x&&u[0]<n.x+n.w&&Math.max(u[1],v[1])>n.y&&Math.min(u[1],v[1])<n.y+n.h:u[1]>n.y&&u[1]<n.y+n.h&&Math.max(u[0],v[0])>n.x&&Math.min(u[0],v[0])<n.x+n.w;assert(!cross,p.id+' crosses '+n.name);}});
  }
 }
 const issues=await page.evaluate(()=>{const out=[];for(const svg of document.querySelectorAll('.erd-sheet svg')){const id=svg.closest('article').id,view=svg.viewBox.baseVal;for(const t of svg.querySelectorAll('text')){const b=t.getBBox();if(b.x<view.x||b.y<view.y||b.x+b.width>view.x+view.width||b.y+b.height>view.y+view.height)out.push([id,'outside',t.textContent]);}for(const g of svg.querySelectorAll('[data-table]')){const r=g.querySelector('rect').getBBox();for(const t of g.querySelectorAll('text')){const b=t.getBBox();if(b.x<r.x+2||b.x+b.width>r.x+r.width-2||b.y<r.y||b.y+b.height>r.y+r.height)out.push([id,'table text overflow',t.textContent]);}}}return out;});console.log('ERD geometry issues:',issues);assert.deepEqual(issues,[]);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page-level mobile overflow');await page.setViewportSize({width:1440,height:1000});
 assert.equal(model.sheets.length,1,'One complete diagram');
 assert.equal(await page.locator('[data-module-panels] > rect').count(),13,'Reference-style functional groups');
 assert.equal(await page.locator('[data-diagram-title]').count(),1,'Reference-style title banner');
 assert.equal(await page.locator('[data-cardinality-label]').count(),102,'Numeric cardinality at both ends of every relationship');
 for(const t of model.tables)for(const f of t.fields.filter(f=>f.ref)){
  const g=Object.values(geometry)[0],r=g.paths.find(p=>p.table===t.name&&p.field===f.name);
  for(const [end,kind,value] of [['parent',f.nullable?'optional':'one',f.nullable?'0..1':'1'],['child',f.unique?'optional':'many',f.unique?'0..1':'0..*']]){
   const mark=page.locator(`[data-relation-id="${r.id}"][data-end="${end}"]`);
   assert.equal(await mark.getAttribute('data-cardinality'),kind,'Symbol agrees with schema');
   assert.equal(await mark.locator('text').textContent(),value,'Numeric cardinality agrees with symbol');
  }
 }
 assert(await page.locator('.erd-sheet svg').evaluateAll(svgs=>svgs.every(svg=>{
  const v=svg.viewBox.baseVal;
  return [...svg.querySelectorAll('[data-cardinality]')].every(n=>{const b=n.getBBox();return b.x>=v.x&&b.y>=v.y&&b.x+b.width<=v.x+v.width&&b.y+b.height<=v.y+v.height;});
 })),'Tight artwork bounds retain all cardinality markers');
 assert.equal(await page.locator('.erd-sheet [data-table]').count(),25,'Every entity appears once');
 assert.equal(await page.locator('[data-fk-relation]').count(),51,'Every FK is identified in the register');
 assert.equal(await page.locator('[data-cardinality]').count(),102,'Both ends retain their cardinality');
 assert(await page.locator('[data-cardinality] circle').evaluateAll(nodes=>nodes.every(n=>Number(n.getAttribute('r'))===5)),'Larger optionality circles');
 for(const g of Object.values(geometry)){
  assert.equal(g.row,30,'Taller data rows and clearance between FK endpoints');
  for(let i=0;i<g.paths.length;i++)for(let j=i+1;j<g.paths.length;j++){
   const a=g.paths[i],b=g.paths[j];if(a.parent===b.parent&&a.key===b.key&&a.parentSide===b.parentSide)assert(Math.abs(a.parentMarker[1]-b.parentMarker[1])>=24,'Parent cardinality marker separation');
  }
 }
 assert.equal(await page.locator('nav.somada-nav a[aria-current="page"]').getAttribute('href'),'ERD.html');
 const tags=await page.locator('[data-fk-relation]').evaluateAll(tags=>tags.filter(t=>{const a=t.getBBox(),field=t.previousElementSibling.getBBox();return field.x+field.width>a.x-2;}).map(t=>t.textContent));assert.deepEqual(tags,[],'No FK field/tag overlap');
 for(const href of await page.locator('a[href]').evaluateAll(as=>as.map(a=>a.getAttribute('href')).filter(h=>!h.startsWith('#')&&!/^https?:/.test(h))))assert(fs.existsSync(path.resolve(root,href.split('#')[0])),'Missing local link: '+href);
 if(process.argv.includes('--render')){await page.emulateMedia({media:'print'});await page.pdf({path:path.join(root,'assets/erd/erd.pdf'),preferCSSPageSize:true,printBackground:true});const pdf=fs.readFileSync(path.join(root,'assets/erd/erd.pdf')).toString('latin1');assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,1,'One complete landscape page');const box=pdf.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);assert(box&&Math.abs(Number(box[1])-1417.32)<2&&Math.abs(Number(box[2])-1034.4)<2,'Custom landscape PDF dimensions');for(const s of model.sheets){const svg=page.locator('#erd-'+s.id+' svg');fs.writeFileSync(path.join(root,'assets/erd/erd-'+s.id+'.svg'),await svg.evaluate(n=>new XMLSerializer().serializeToString(n)));await svg.screenshot({path:path.join(root,'assets/erd/erd-'+s.id+'.png')});}}
 console.log('PASS:',model.tables.length,'entities;',total,'PK–FK relationships; all eleven DFD stores;',model.sheets.length,'complete grouped landscape sheet. Logical draft, not approval.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
