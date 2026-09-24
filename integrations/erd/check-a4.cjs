const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),model=require('../../assets/erd/model.js'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const tables=new Map(model.tables.map(t=>[t.name,t]));
assert.equal(tables.size,model.tables.length);assert.deepEqual([...new Set(model.tables.map(t=>t.store))].sort(),['D1','D10','D2','D3','D4','D5','D6','D7','D8','D9']);
assert.deepEqual(model.sheets.flatMap(s=>s.main).sort(),[...tables.keys()].sort(),'Every table has exactly one full-definition sheet');
for(const t of model.tables){assert.equal(t.fields.filter(f=>f.key==='PK').length,1,t.name+' has one PK');assert.equal(new Set(t.fields.map(f=>f.name)).size,t.fields.length);for(const f of t.fields){if(!f.ref)continue;assert(tables.get(f.ref.table)?.fields.some(p=>p.name===f.ref.field&&p.key==='PK'),t.name+'.'+f.name+' points to a PK');}for(const u of t.unique)assert(u.every(k=>t.fields.some(f=>f.name===k)));}
const server=http.createServer((req,res)=>{const target=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!target.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(target,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(target)]||'application/octet-stream');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/ERD-A4.html');await page.waitForFunction(()=>window.__erdReady,{},{timeout:10000}).catch(e=>{throw Error(errors.join('\n')||e.message);});assert.deepEqual(errors,[]);
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
 assert.equal(await page.locator('[data-module-panels] > rect').count(),0,'No module containers in the A4 variant');
 assert.equal(await page.locator('[data-diagram-title]').count(),0,'No redundant title in A4 artwork');
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
 assert(await page.locator('[data-cardinality] circle').evaluateAll(nodes=>nodes.every(n=>Number(n.getAttribute('r'))===3)),'Compact optionality circles');
 assert(await page.locator('[data-cardinality] line').evaluateAll(nodes=>nodes.every(n=>Math.abs(Number(n.getAttribute('y2'))-Number(n.getAttribute('y1')))<=8)),'Cardinality bars/prongs are at most 8 units tall');
 for(const g of Object.values(geometry)){
  assert.equal(g.row,28,'Taller data rows and clearance between FK endpoints');
  for(let i=0;i<g.paths.length;i++)for(let j=i+1;j<g.paths.length;j++){
   const a=g.paths[i],b=g.paths[j];if(a.parent===b.parent&&a.key===b.key&&a.parentSide===b.parentSide)assert(Math.abs(a.parentMarker[1]-b.parentMarker[1])>=24,'Parent cardinality marker separation');
  }
 }
 const tags=await page.locator('[data-fk-relation]').evaluateAll(tags=>tags.filter(t=>{const a=t.getBBox(),field=t.previousElementSibling.getBBox();return field.x+field.width>a.x-2;}).map(t=>t.textContent));assert.deepEqual(tags,[],'No FK field/tag overlap');
 const markerIssues=await page.evaluate(()=>{
  const marks=[...document.querySelectorAll('[data-cardinality]')].map(n=>({id:n.getAttribute('data-relation-id')+' '+n.getAttribute('data-end'),box:n.getBBox()})),out=[];
  for(let i=0;i<marks.length;i++)for(let j=i+1;j<marks.length;j++){
   const a=marks[i].box,b=marks[j].box,dx=Math.max(0,Math.max(a.x,b.x)-Math.min(a.x+a.width,b.x+b.width)),dy=Math.max(0,Math.max(a.y,b.y)-Math.min(a.y+a.height,b.y+b.height));
   if(dx<2&&dy<2)out.push([marks[i].id,marks[j].id,dx,dy]);
  }
  return out;
 });assert.deepEqual(markerIssues,[],'All 102 symbol/label bounds have a visible gap');
 const svg=page.locator('.erd-sheet svg');
 for(const r of geometry.complete.paths)for(const end of ['parent','child']){
  const mark=page.locator(`[data-relation-id="${r.id}"][data-end="${end}"]`);
  await mark.hover();
  assert.equal(await svg.getAttribute('data-active-relation'),r.id,'Real pointer hover selects the right relation');
  assert.equal(await page.locator('[data-cardinality].relationship-active').count(),2,'Both cardinalities highlighted');
  assert.equal(await page.locator('[data-table].relationship-active').count(),2,'Both related tables highlighted');
  assert.equal(await page.locator('[data-highlight-layer] path').getAttribute('d'),await page.locator(`[data-relation="${r.id}"]`).getAttribute('d'),'Complete route highlighted');
  assert((await page.locator('#relationship-status').textContent()).includes(r.table+'.'+r.field));
  await page.mouse.move(0,0);assert.equal(await svg.getAttribute('data-active-relation'),null,'Pointer exit clears highlight');
 }
 const focusMark=page.locator('[data-relation-id="R17"][data-end="child"]');
 await focusMark.focus();assert.equal(await svg.getAttribute('data-active-relation'),'R17');
 assert.equal(await focusMark.locator('line').first().evaluate(n=>getComputedStyle(n).stroke),'rgb(0, 101, 209)','Highlight is visibly blue');
 assert.equal(await focusMark.locator('rect').evaluate(n=>getComputedStyle(n).fill),'rgb(220, 236, 255)','Endpoint has a visible highlight background');
 await page.keyboard.press('Escape');assert.equal(await svg.getAttribute('data-active-relation'),null);
 await page.locator('#erd-zoom').selectOption('2');
 assert(Math.abs((await page.locator('.erd-sheet').boundingBox()).width-1587.4)<2,'200% screen zoom');
 await page.emulateMedia({media:'print'});
 assert(Math.abs((await page.locator('.erd-sheet').boundingBox()).width-793.7)<2,'Print ignores screen zoom');
 await page.emulateMedia({media:'screen'});await page.locator('#erd-zoom').selectOption('1');
 console.log('PASS: 102 separated endpoints; 102 pointer-hover checks; keyboard focus/Escape; zoom/print sizing.');
 if(process.argv.includes('--render')){await page.emulateMedia({media:'print'});await page.pdf({path:path.join(root,'assets/erd/erd-a4.pdf'),preferCSSPageSize:true,printBackground:true});const pdf=fs.readFileSync(path.join(root,'assets/erd/erd-a4.pdf')).toString('latin1');assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,1,'One complete landscape page');const box=pdf.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);assert(box&&Math.abs(Number(box[1])-595.28)<2&&Math.abs(Number(box[2])-841.89)<2,'A4 portrait PDF dimensions');for(const s of model.sheets){const svg=page.locator('#erd-'+s.id+' svg');fs.writeFileSync(path.join(root,'assets/erd/erd-a4-'+s.id+'.svg'),await svg.evaluate(n=>new XMLSerializer().serializeToString(n)));await svg.screenshot({path:path.join(root,'assets/erd/erd-a4-'+s.id+'.png')});}}
 console.log('PASS:',model.tables.length,'entities;',total,'PK–FK relationships; all ten DFD stores;',model.sheets.length,'complete interactive A4 portrait sheet. Logical draft, not approval.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
