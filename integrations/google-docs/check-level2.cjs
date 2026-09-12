// Five Level 2 figures: canonical balancing, geometry, rendering, no Google writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..'),dir='assets/figures-v2/dfd-level2-compact/';
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
const segs=points=>points.slice(1).map((b,i)=>({a:points[i],b}));
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const hits=(s,b)=>s.a[1]===s.b[1]?s.a[1]>b.y&&s.a[1]<b.y+b.h&&Math.max(s.a[0],s.b[0])>b.x&&Math.min(s.a[0],s.b[0])<b.x+b.w:s.a[0]>b.x&&s.a[0]<b.x+b.w&&Math.max(s.a[1],s.b[1])>b.y&&Math.min(s.a[1],s.b[1])<b.y+b.h;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:950},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const id of ['p1','p2','p3','p4','p5']){
   await page.goto(`http://127.0.0.1:${server.address().port}/${dir}dfd-level2-compact.html?process=${id}&export=1`);
   await page.waitForFunction(()=>window.__done||window.__error);assert.equal(await page.evaluate(()=>window.__error),undefined,id);
   const d=await page.evaluate(()=>({...window.__level2,nodeText:[...document.querySelectorAll('[data-node-id] text')].map(t=>{const b=t.getBBox();return{id:t.closest('[data-node-id]').dataset.nodeId,text:t.textContent,x:b.x,y:b.y,w:b.width,h:b.height};})}));
   const {model,parent,nodes,routes,labelBoxes}=d,issues=[],ports=[];
   assert.equal(d.constants.LANE_GAP,20);
   for(const n of Object.values(nodes).filter(n=>n.kind==='store')){
    const group=page.locator('[data-node-id="'+n.id+'"]');
    assert.equal(await group.locator('rect').getAttribute('stroke'),'none');
    assert.equal(await group.locator('[data-store-outline]').getAttribute('d'),`M${n.x+n.w} ${n.y} H${n.x} V${n.y+n.h} H${n.x+n.w}`,'Open right edge');
   }
   const expected=parent.flows.filter(f=>f.source===id||f.target===id);
   assert.deepEqual([...new Set(model.flows.map(f=>f.parentFlow))].sort(),expected.map(f=>f.id).sort(),'Every parent flow retained');
   for(const f of model.flows){const p=expected.find(p=>p.id===f.parentFlow);assert(p);assert.equal(f.label,p.label);assert.equal(nodes[f.source].kind==='process'?id:f.source,p.source);assert.equal(nodes[f.target].kind==='process'?id:f.target,p.target);}
   for(const kind of ['entity','process','store'])assert.equal(new Set(Object.values(nodes).filter(n=>n.kind===kind).map(n=>n.w+'x'+n.h)).size,1);
   for(const [i,a]of Object.values(nodes).entries())for(const b of Object.values(nodes).slice(i+1))if(overlap(a,b))issues.push('node overlap '+a.id+'/'+b.id);
   for(const r of routes){
    for(const [pt,id]of [[r.points[0],r.source],[r.points.at(-1),r.target]]){const n=nodes[id];assert(((pt[0]===n.x||pt[0]===n.x+n.w)&&pt[1]>=n.y&&pt[1]<=n.y+n.h)||((pt[1]===n.y||pt[1]===n.y+n.h)&&pt[0]>=n.x&&pt[0]<=n.x+n.w),'Attached '+r.id);ports.push(id+':'+pt.join(','));}
    for(const n of Object.values(nodes))if(n.id!==r.source&&n.id!==r.target&&segs(r.points).some(s=>hits(s,n)))issues.push('line/node '+r.id+'/'+n.id);
   }
   assert.equal(new Set(ports).size,ports.length,'No shared ports');
   for(const [i,a]of routes.entries())for(const b of routes.slice(i+1)){
    const tip=a.points.at(-1),other=b.points.at(-1);
    if(a.target===b.target&&tip[0]===other[0])assert(Math.abs(tip[1]-other[1])>=12,'Larger arrowhead separation '+a.id+'/'+b.id);
   }
   for(const side of ['left','right']){
    const all=routes.filter(r=>r.side===side);
    const lanes=all.map(r=>r.points[1][0]).sort((a,b)=>a-b);
    for(let i=1;i<lanes.length;i++)assert(lanes[i]-lanes[i-1]>=20,'Wider distinct lanes with clearance');
    for(const peerBelow of [true,false]){
     const ordered=all.filter(r=>(r.sy>r.py)===peerBelow).sort((a,b)=>a.py-b.py);
     for(let i=1;i<ordered.length;i++){
      const previous=ordered[i-1].points[1][0],current=ordered[i].points[1][0];
      const increasing=(side==='left')===peerBelow;
      assert(increasing?current-previous>=20:previous-current>=20,'Two-axis mirrored lanes: '+side+' peerBelow='+peerBelow);
     }
    }
   }
   if(id==='p5'){
    const inputs=['d3','d7','d2'].map(peer=>routes.find(r=>r.source===peer&&r.target==='p5.4'));
    assert(inputs.every(Boolean));
    assert(inputs[0].points[1][0]<inputs[1].points[1][0]&&inputs[1].points[1][0]<inputs[2].points[1][0],'D3/D7/D2 staircase into 5.4');
    const report=routes.find(r=>r.source==='p5.5'&&r.target==='headlab');
    const request=routes.find(r=>r.source==='headlab'&&r.target==='p5.5');
    assert(report&&request);
    assert(report.points[1][0]<request.points[1][0],'Report return is outside the request lane');
   }
   for(const n of Object.values(nodes).filter(n=>n.kind!=='process')){
    const links=routes.filter(r=>r.peer===n.id).sort((a,b)=>a.sy-b.sy);
    for(let i=1;i<links.length;i++){
     assert(nodes[links[i-1].process].y<=nodes[links[i].process].y,'Top-to-bottom process order at '+n.id);
     assert(links[i-1].py<links[i].py,'Peer rows preserve process approach order at '+n.id);
    }
   }
   for(const [i,a]of labelBoxes.entries()){
    for(const b of labelBoxes.slice(i+1))if(overlap(a,b))issues.push('labels '+a.id+'/'+b.id);
    for(const n of Object.values(nodes))if(overlap(a,n))issues.push('label/node '+a.id+'/'+n.id);
    for(const r of routes)if(r.id!==a.id&&segs(r.points).some(s=>hits(s,a)))issues.push('label/line '+a.id+'/'+r.id);
    const r=routes.find(r=>r.id===a.id),host=segs(r.points).find(s=>s.a[1]===s.b[1]&&s.a[1]>=a.y&&s.a[1]<=a.y+a.h&&Math.min(s.a[0],s.b[0])+12<=a.x&&Math.max(s.a[0],s.b[0])-12>=a.x+a.w);
    if(!host)issues.push({kind:'label host clearance',id:a.id,box:a,points:r.points});
   }
   for(const [i,a]of routes.entries())for(const b of routes.slice(i+1))for(const s of segs(a.points))for(const t of segs(b.points)){
    const axis=s.a[0]===s.b[0]?0:1;if(t.a[axis]===t.b[axis]&&Math.abs(s.a[axis]-t.a[axis])<1e-6&&Math.min(Math.max(s.a[1-axis],s.b[1-axis]),Math.max(t.a[1-axis],t.b[1-axis]))>=Math.max(Math.min(s.a[1-axis],s.b[1-axis]),Math.min(t.a[1-axis],t.b[1-axis])))issues.push('shared run '+a.id+'/'+b.id);
   }
   for(const t of d.nodeText){const n=nodes[t.id];if(t.x<n.x+3||t.x+t.w>n.x+n.w-3||t.y<n.y+3||t.y+t.h>n.y+n.h-3)issues.push('node text '+t.id+' '+t.text);}
   assert.equal(await page.locator('.diagram-flow-label rect').count(),0);
   assert.equal(await page.locator('.diagram-connector[stroke-dasharray]').count(),routes.length);
   await page.locator('#diagram').screenshot({path:path.join(os.tmpdir(),'level2-'+id+'-audit.png')});
   console.log(JSON.stringify({id,boundary:model.flows.length,internal:model.internal.length,issues}));
   assert.deepEqual(issues,[]);
   if(process.argv.includes('--render'))await page.locator('#diagram').screenshot({path:path.join(root,dir,'png/dfd-level2-'+id+'.png')});
  }
  for(const id of ['p1','p2','p3','p4','p5']){
    const base=`http://127.0.0.1:${server.address().port}/${dir}dfd-level2-compact.html?process=${id}`;
    // Every interactive trace and edit affects just its own flow, with fixed endpoints.
    await page.goto(base);await page.waitForFunction(()=>window.__done);
    const label=page.locator('.diagram-flow-label').first();
    await label.hover();
    assert.equal(await page.locator('.diagram-connector.is-active').count(),1);
    const before=await label.getAttribute('transform');
    const authoredGap=await page.locator('.diagram-connector').first().getAttribute('stroke-dasharray');
    const box=await label.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+10,box.y+box.height/2+8);await page.mouse.up();
    assert.notEqual(await label.getAttribute('transform'),before);
    assert.notEqual(await page.locator('.diagram-connector').first().getAttribute('stroke-dasharray'),authoredGap,'Transparent stroke gap follows the dragged label');
    const movedLabel=await label.getAttribute('transform');
    const connector=page.locator('.diagram-connector').first();
    const originalPath=await connector.getAttribute('d');
    await page.locator('.diagram-connector-hit').first().dispatchEvent('click');
    const handle=page.locator('.diagram-segment-handle').first();
    await handle.scrollIntoViewIfNeeded();
    const h=await handle.boundingBox();
    await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();await page.mouse.move(h.x+h.width/2+9,h.y+h.height/2);await page.mouse.up();
    const editedPath=await connector.getAttribute('d');
    assert.notEqual(editedPath,originalPath,'Internal route handle changes its own path');
    const coords=d=>d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.deepEqual(coords(editedPath).slice(0,2),coords(originalPath).slice(0,2),'Source stays fixed');
    assert.deepEqual(coords(editedPath).slice(-2),coords(originalPath).slice(-2),'Destination stays fixed');
    await page.reload();await page.waitForFunction(()=>window.__done);
    assert.equal(await connector.getAttribute('d'),editedPath,'Route edit persists');
    assert.equal(await label.getAttribute('transform'),movedLabel,'Label edit persists');
    await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    assert.equal(await connector.getAttribute('d'),originalPath,'Print uses authored routes');
    assert.equal(await label.getAttribute('transform'),null,'Print uses authored labels');
    await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
    assert.equal(await connector.getAttribute('d'),editedPath,'Editor is restored after printing');
    await page.goto(base+'&embed=1');await page.waitForFunction(()=>window.__done);
    assert.equal(await connector.getAttribute('d'),originalPath,'Google Docs embed ignores saved edits');
    assert.equal(await label.getAttribute('transform'),null);
    assert.equal(await page.locator('.diagram-editor-toolbar,.diagram-segment-handle').count(),0);
    await page.goto(base+'&export=1');await page.waitForFunction(()=>window.__done);
    assert.equal(await connector.getAttribute('d'),originalPath,'Static export ignores saved edits');
    await page.goto(base);await page.waitForFunction(()=>window.__done);
    await page.getByRole('button',{name:'Reset edits'}).click();
    assert.equal((await label.getAttribute('transform'))||'',before||'');
    assert.equal(await connector.getAttribute('d'),originalPath,'Reset restores authored path');
  }
  assert.deepEqual(errors,[]);console.log('All five Level 2 models, figures, editor interactions and authored exports passed.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
