// Read-only use-case geometry and publication audit.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,d)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(d);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:1770},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/assets/figures-v2/usecase-diagram-source.html?export=1');
 await page.waitForFunction(()=>window.__done);
 const result=await page.evaluate(()=>{
  const cases=BASE_UC.concat(SUPPORT_UC).filter(u=>!u.diagramHidden).map(u=>({...u,...useCaseSize(u)}));
  const paths=[...document.querySelectorAll('.diagram-connector')].map(p=>{const nums=p.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number),points=[];for(let i=0;i<nums.length;i+=2)points.push(nums.slice(i,i+2));return{id:p.dataset.flowId,points,marker:p.getAttribute('marker-end')};});
  const boxes=[...document.querySelectorAll('text tspan')].map(t=>{const b=t.getBBox(),g=t.closest('.diagram-flow-label'),m=g?.transform.baseVal.consolidate()?.matrix;const corners=[[b.x-2,b.y-2],[b.x+b.width+2,b.y-2],[b.x+b.width+2,b.y+b.height+2],[b.x-2,b.y+b.height+2]].map(([x,y])=>{const p=m?new DOMPoint(x,y).matrixTransform(m):{x,y};return[p.x,p.y];});return{text:t.textContent,node:t.closest('[id^="usecase-"]')?.id?.replace('usecase-',''),label:g?.dataset.flowId,corners,x:b.x,y:b.y,w:b.width,h:b.height};});
  return{actors:ACTORS,cases,paths,boxes,relationships:RELATIONSHIPS};
 });
 const issues=[];
 assert.equal(result.actors.length,6);assert.equal(result.cases.length,31);assert.equal(result.relationships.length,12);
 assert.equal(result.paths.length-12,43);
 assert.equal(await page.locator('#usecase-login').count(),1,'Shared login is shown');
 assert.equal(result.paths.filter(p=>p.id.endsWith('-login')).length,6,'All six actors connect to login');
 assert(result.actors.every(a=>['left','right'].includes(a.side)));
 assert.deepEqual(result.actors.filter(a=>a.uses.includes('mgmlogs')).map(a=>a.id),['headlab'],'Only Head Laboratory manages logs, schedule and daily tasks');
 for(const b of result.boxes){
  if((b.node||b.label)&&(b.x<0||b.x+b.w>1600||b.y<0||b.y+b.h>1770))issues.push('canvas text '+b.text);
  if(b.node){const n=result.cases.find(n=>n.id===b.node);for(const x of [b.x,b.x+b.w])for(const y of [b.y,b.y+b.h])if(((x-n.x)/n.rx)**2+((y-n.cy)/n.ry)**2>1.02)issues.push('ellipse text '+b.node+' '+b.text);}
 }
 const inside=(p,n)=>((p[0]-n.x)/n.rx)**2+((p[1]-n.cy)/n.ry)**2<.98;
 const inPoly=(x,y,poly)=>{const signs=poly.map((a,i)=>{const b=poly[(i+1)%poly.length];return(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);});return signs.every(s=>s>0)||signs.every(s=>s<0);};
 for(const b of result.boxes.filter(b=>b.label)){
  for(const n of result.cases)for(let i=0;i<4;i++){
    const a=b.corners[i],z=b.corners[(i+1)%4];
    for(let t=0;t<=1;t+=.02)if(inside([a[0]+t*(z[0]-a[0]),a[1]+t*(z[1]-a[1])],n)){issues.push('label/node '+b.label+'/'+n.id);break;}
  }
  for(const p of result.paths)if(p.id!==b.label)for(let i=1;i<p.points.length;i++){
    const a=p.points[i-1],z=p.points[i];
    for(let t=0;t<=1;t+=.002){const x=a[0]+t*(z[0]-a[0]),y=a[1]+t*(z[1]-a[1]);
      if(inPoly(x,y,b.corners)){issues.push('label/path '+b.label+'/'+p.id);break;}
    }
  }
 }
 for(const p of result.paths){
  const related=p.id.startsWith('association-')?[p.id.replace(/^association-(classrep|faculty|dean|headlab|physics|circuits)-/,'')]:Object.values(result.relationships[Number(p.id.split('-')[1])]).slice(0,2);
  for(const n of result.cases)if(!related.includes(n.id))for(let i=1;i<p.points.length;i++){const a=p.points[i-1],b=p.points[i];for(let t=0;t<=1;t+=.005)if(inside([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],n)){issues.push('path/node '+p.id+'/'+n.id);break;}}
  if(p.id.startsWith('association'))assert.equal(p.marker,null);else {assert(p.marker);assert.equal(p.points.length,2,'Dependencies are straight, not elbow-routed');}
 }
 await page.locator('#stage svg').screenshot({path:path.join(os.tmpdir(),'usecase-audit.png')});
 console.log(JSON.stringify({actors:result.actors.length,cases:result.cases.length,associations:result.paths.length-result.relationships.length,issues:[...new Set(issues)]},null,2));
 assert.deepEqual([...new Set(issues)],[]);assert.deepEqual(errors,[]);
 if(process.argv.includes('--render'))await page.locator('#stage svg').screenshot({path:path.join(root,'assets/figures-v2/usecase-diagram-draft.png')});
 const base='http://127.0.0.1:'+server.address().port+'/assets/figures-v2/usecase-diagram-source.html';
 await page.goto(base);await page.waitForFunction(()=>window.__done);
 const label=page.locator('.diagram-flow-label').first();const authored=await label.getAttribute('transform');await label.hover();
 assert.equal(await page.locator('.diagram-connector.is-active').count(),1);
 const box=await label.boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 await page.mouse.move(box.x+box.width/2+8,box.y+box.height/2+5);await page.mouse.up();
 const moved=await label.getAttribute('transform');assert(moved);
 await page.reload();await page.waitForFunction(()=>window.__done);assert.equal(await label.getAttribute('transform'),moved);
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
 assert.equal(await label.getAttribute('transform'),authored,'Print ignores local edits');
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 assert.equal(await label.getAttribute('transform'),moved);
 await page.getByRole('button',{name:'Reset edits'}).click();assert.equal(await label.getAttribute('transform'),authored);
 await page.goto(base+'?embed=1');await page.waitForFunction(()=>window.__done);
 assert.equal(await page.locator('.diagram-editor-toolbar').count(),0);
 assert.equal(await label.getAttribute('transform'),authored);
 assert.deepEqual(errors,[]);console.log('Use-case hover, label drag, persistence, reset and authored print/embed passed.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
