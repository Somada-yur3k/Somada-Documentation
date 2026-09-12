// Geometry and A4 readability audit. --render regenerates the checked-in PNG.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
const eps=1e-5;
function segments(points){return points.slice(1).map((b,i)=>({a:points[i],b}));}
function intersect(a,b){
  const ah=a.a[1]===a.b[1],bh=b.a[1]===b.b[1];
  const inRange=(n,x,y)=>n>=Math.min(x,y)-eps&&n<=Math.max(x,y)+eps;
  if(ah===bh){
    const fixed=ah?1:0,vary=1-fixed;
    if(Math.abs(a.a[fixed]-b.a[fixed])>eps)return null;
    return Math.min(Math.max(a.a[vary],a.b[vary]),Math.max(b.a[vary],b.b[vary]))>=Math.max(Math.min(a.a[vary],a.b[vary]),Math.min(b.a[vary],b.b[vary]))-eps?'overlap':null;
  }
  const h=ah?a:b,v=ah?b:a,x=v.a[0],y=h.a[1];
  if(!inRange(x,h.a[0],h.b[0])||!inRange(y,v.a[1],v.b[1]))return null;
  return [a.a,a.b,b.a,b.b].some(p=>Math.abs(p[0]-x)<eps&&Math.abs(p[1]-y)<eps)?'touch':'crossing';
}
function hitsBox(s,b){
  if(s.a[1]===s.b[1])return s.a[1]>b.y-eps&&s.a[1]<b.y+b.h+eps&&Math.max(s.a[0],s.b[0])>b.x&&Math.min(s.a[0],s.b[0])<b.x+b.w;
  return s.a[0]>b.x-eps&&s.a[0]<b.x+b.w+eps&&Math.max(s.a[1],s.b[1])>b.y&&Math.min(s.a[1],s.b[1])<b.y+b.h;
}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1770,height:2220},deviceScaleFactor:2});
    const base=`http://127.0.0.1:${server.address().port}/assets/figures-v2/dfd-level1/dfd-level1-source.html`;
    await page.goto(base+'?export=1');
    await page.waitForFunction(()=>window.__done||window.__error);
    assert.equal(await page.evaluate(()=>window.__error),undefined);
    const data=await page.evaluate(()=>({...window.__level1,nodeText:[...document.querySelectorAll('[data-node-id] text')].map(t=>{
      const b=t.getBBox();return {id:t.closest('[data-node-id]').dataset.nodeId,text:t.textContent,x:b.x,y:b.y,w:b.width,h:b.height};
    })}));
    const issues=[],crossings=[];
    const {routes,nodes,labelBoxes,constants:c,model}=data;
    assert.equal(routes.length,74);assert.equal(new Set(routes.map(r=>r.id)).size,74);
    assert.equal(nodes.headlab.y,Math.max(...Object.values(nodes).filter(n=>n.kind==='entity').map(n=>n.y)));
    for(const side of ['left','right']){
      const horizontal=routes.filter(r=>r.side===side).flatMap(r=>segments(r.points).filter(s=>s.a[1]===s.b[1]));
      for(const [i,a]of horizontal.entries())for(const b of horizontal.slice(i+1)){
        if(Math.min(Math.max(a.a[0],a.b[0]),Math.max(b.a[0],b.b[0]))>Math.max(Math.min(a.a[0],a.b[0]),Math.min(b.a[0],b.b[0])))assert(Math.abs(a.a[1]-b.a[1])>=8-eps,'At least 8 units between overlapping horizontal runs');
      }
    }
    assert.equal(Object.values(nodes).filter(n=>n.kind==='entity').length,6);
    assert.equal(Object.values(nodes).filter(n=>n.kind==='store').length,10);
    for(const kind of ['entity','process','store'])assert.equal(new Set(Object.values(nodes).filter(n=>n.kind===kind).map(n=>n.w+'x'+n.h)).size,1);
    const ports=[];
    for(const r of routes){
      for(const [point,key] of [[r.points[0],r.source],[r.points.at(-1),r.target]]){
        const n=nodes[key],onSide=(Math.abs(point[0]-n.x)<eps||Math.abs(point[0]-n.x-n.w)<eps)&&point[1]>=n.y&&point[1]<=n.y+n.h;
        assert(onSide,'Endpoint on visible boundary: '+r.id);ports.push(key+':'+point.join(','));
      }
      for(const n of Object.values(nodes))if(n.id!==r.source&&n.id!==r.target&&segments(r.points).some(s=>hitsBox(s,n)))issues.push({kind:'route-through-node',flow:r.id,node:n.id});
    }
    for(const process of Object.values(nodes).filter(n=>n.kind==='process'))for(const side of ['left','right']){
      const ordered=routes.filter(r=>r.process===process.id&&r.side===side).sort((a,b)=>{
        const py=r=>r.source===process.id?r.points[0][1]:r.points.at(-1)[1];return py(a)-py(b);
      });
      const owners=ordered.map(r=>r.peer).filter((owner,i,list)=>i===0||owner!==list[i-1]);
      assert.equal(new Set(owners).size,owners.length,'Each owner has one contiguous process-side band');
      assert.deepEqual(owners.map(id=>nodes[id].y),owners.map(id=>nodes[id].y).sort((a,b)=>a-b),'Bands follow peer-node order');
    }
    assert.equal(new Set(ports).size,ports.length,'No shared ports');
    for(let i=0;i<routes.length;i++)for(let j=i+1;j<routes.length;j++)for(const a of segments(routes[i].points))for(const b of segments(routes[j].points)){
      const hit=intersect(a,b);if(hit==='crossing')crossings.push([routes[i].id,routes[j].id]);else if(hit)issues.push({kind:hit,flows:[routes[i].id,routes[j].id]});
    }
    for(const label of labelBoxes){
      const route=routes.find(r=>r.id===label.id);
      const host=segments(route.points).find(s=>s.a[1]===s.b[1]&&Math.abs(s.a[1]-label.y-label.h/2)<eps&&Math.min(s.a[0],s.b[0])<=label.x&&Math.max(s.a[0],s.b[0])>=label.x+label.w);
      if(!host)issues.push({kind:'label-host',label:label.id});
      else {
        const lo=Math.min(host.a[0],host.b[0]),hi=Math.max(host.a[0],host.b[0]);
        if(label.x-lo<12||hi-label.x-label.w<12)issues.push({kind:'label-clearance',label:label.id,text:label.text,width:label.w,left:label.x-lo,right:hi-label.x-label.w});
        const process=nodes[route.process];
        const gap=route.side==='left'?process.x-label.x-label.w:label.x-process.x-process.w;
        if(gap<20)issues.push({kind:'label-node-clearance',label:label.id,text:label.text,width:label.w,gap});
      }
      for(const n of Object.values(nodes))if(overlap(label,n))issues.push({kind:'label-node',label:label.id,node:n.id});
      for(const r of routes)if(r.id!==label.id&&segments(r.points).some(s=>hitsBox(s,label)))issues.push({kind:'label-hides-flow',label:label.id,flow:r.id});
    }
    for(let i=0;i<labelBoxes.length;i++)for(let j=i+1;j<labelBoxes.length;j++)if(overlap(labelBoxes[i],labelBoxes[j]))issues.push({kind:'label-label',labels:[labelBoxes[i].id,labelBoxes[j].id]});
    for(const t of data.nodeText){const n=nodes[t.id];if(t.x<n.x+3||t.x+t.w>n.x+n.w-3||t.y<n.y+3||t.y+t.h>n.y+n.h-3)issues.push({kind:'node-text',...t});}
    const fontPt=c.FONT*Math.min(174*96/25.4/c.W,220*96/25.4/c.H)*72/96;
    assert(fontPt>=7.5,'User-requested slight reduction: at least 7.5 pt flow labels');
    assert.equal(await page.locator('.diagram-flow-label rect').count(),0,'Plain labels have no background or border');
    assert.equal(await page.locator('.diagram-connector[stroke-dasharray]').count(),74,'Each plain label clears only its own connector stroke');
    const paint=await page.evaluate(async()=>{
      const {constants:c,labelBoxes}=window.__level1,svg=document.querySelector('#stage svg');
      const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
      try {
        const img=new Image();img.src=url;await img.decode();
        const canvas=document.createElement('canvas');canvas.width=c.W*2;canvas.height=c.H*2;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const white=(x,y)=>{const p=ctx.getImageData(Math.round(x*2),Math.round(y*2),1,1).data;return p[0]>250&&p[1]>250&&p[2]>250;};
        return labelBoxes.map(b=>({id:b.id,clearLeft:white(b.x+3,b.y+b.h/2),clearRight:white(b.x+b.w-3,b.y+b.h/2),connectedLeft:!white(b.x-4,b.y+b.h/2),connectedRight:!white(b.x+b.w+4,b.y+b.h/2)}));
      } finally {URL.revokeObjectURL(url);}
    });
    assert.deepEqual(paint.filter(p=>!p.clearLeft||!p.clearRight||!p.connectedLeft||!p.connectedRight),[],'All 74 rendered labels have white clearance and connected lines on both sides');
    for(const side of ['left','right']){
      const trunks=routes.filter(r=>r.side===side).map(r=>({x:r.points[1][0],lo:Math.min(r.points[1][1],r.points[2][1]),hi:Math.max(r.points[1][1],r.points[2][1])}));
      assert.equal(new Set(trunks.map(t=>t.x)).size,trunks.length,'Every trunk has a unique lane');
      for(let i=0;i<trunks.length;i++)for(let j=i+1;j<trunks.length;j++)if(Math.min(trunks[i].hi,trunks[j].hi)+12>=Math.max(trunks[i].lo,trunks[j].lo))assert(Math.abs(trunks[i].x-trunks[j].x)>=(side==='left'?9:8)-eps,'Wider vertical runs on '+side);
    }
    // Balance the external inventory against the parent Level 0, not just counts.
    const parentPage=await browser.newPage();
    await parentPage.goto(new URL('../dfd-level0/dfd-level0-source.html?export=1',base).href);
    await parentPage.waitForFunction(()=>window.__done||window.__error);
    assert.equal(await parentPage.evaluate(()=>window.__error),undefined);
    const parentFlows=await parentPage.evaluate(()=>window.FLOWS);
    await parentPage.close();
    const norm=f=>[f.entity,f.dir,f.label].join('|');
    const external=model.flows.filter(f=>f.kind==='external').map(f=>({entity:nodes[f.source].kind==='entity'?f.source:f.target,dir:nodes[f.source].kind==='entity'?'in':'out',label:f.label}));
    assert.deepEqual(external.map(norm).sort(),parentFlows.map(norm).sort(),'Exact Level 0 boundary balancing');
    const shot=path.join(os.tmpdir(),'somada-level1-portrait-audit.png');
    await page.locator('#stage svg').screenshot({path:shot});
    console.log(JSON.stringify({flows:routes.length,crossings:crossings.length,fontPt,issues,screenshot:shot},null,2));
    assert.equal(issues.length,0,'Geometry audit must pass before replacing print assets');
    if(process.argv.includes('--render'))await page.locator('#stage svg').screenshot({path:path.join(root,'assets/figures-v2/dfd-level1/dfd-level1-draft.png')});
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
    await page.goto(base+'?embed=1');await page.waitForFunction(()=>window.__done);
    assert.equal(await connector.getAttribute('d'),originalPath,'Google Docs embed ignores saved edits');
    assert.equal(await label.getAttribute('transform'),null);
    assert.equal(await page.locator('.diagram-editor-toolbar,.diagram-segment-handle').count(),0);
    await page.goto(base+'?export=1');await page.waitForFunction(()=>window.__done);
    assert.equal(await connector.getAttribute('d'),originalPath,'Static export ignores saved edits');
    await page.goto(base);await page.waitForFunction(()=>window.__done);
    await page.getByRole('button',{name:'Reset edits'}).click();
    assert.equal((await label.getAttribute('transform'))||'',before||'');
    assert.equal(await connector.getAttribute('d'),originalPath,'Reset restores authored path');
    console.log('Level 1 audit passed: 74 flows, balanced, unique nodes/ports, no merges, white label clearances, wider actor/store lanes, hover/label and route drag/persistence/reset/authored export.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
