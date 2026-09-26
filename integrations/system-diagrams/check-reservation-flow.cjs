// Focused P2 regression, authored exports and PDF QA. No Google Docs writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const l2=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json')),p2=l2.find(m=>m.id==='p2');
assert.deepEqual(p2.steps,['Retrieve Availability','Validate & Record Reservation','Route and Process Approval','Update Reservation Status']);
assert.equal(p2.flows.length,25);assert.equal(p2.internal.length,3);assert.equal(new Set(p2.flows.map(f=>f.parentFlow)).size,20);
for(const f of ['reservation_type','student_ids','requester_id','group_id','lab_id','block_id','starts_at','ends_at','request_basis','usage_type','item_id','qty_requested','purpose'])assert(p2.internal[1].payloadFields.includes(f),f);
for(const f of ['assets/system-diagrams/models.js','assets/system-diagrams/render.js','assets/system-diagrams/TRACEABILITY.md','assets/system-diagrams/SEQUENCE-PLAN.md'])assert.doesNotMatch(read(f),/available Faculty then Dean|then Dean after Faculty approval|approval → Pending Dean|Intermediate Faculty approval keeps/);
const scenarios=require('../../assets/system-diagrams/models.js');assert(scenarios.find(s=>s.id==='request').processes.includes('p2.4'));
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});});
const overlaps=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>2;
const onBoundary=(p,n)=>n.kind==='decision'?Math.abs(Math.abs(p[0]-n.x-n.w/2)/(n.w/2)+Math.abs(p[1]-n.y-n.h/2)/(n.h/2)-1)<.001:((p[0]===n.x||p[0]===n.x+n.w)&&p[1]>=n.y&&p[1]<=n.y+n.h)||((p[1]===n.y||p[1]===n.y+n.h)&&p[0]>=n.x&&p[0]<=n.x+n.w);
const segments=r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b}));
const crosses=(s,n)=>s.a[0]===s.b[0]?s.a[0]>n.x&&s.a[0]<n.x+n.w&&Math.max(s.a[1],s.b[1])>n.y&&Math.min(s.a[1],s.b[1])<n.y+n.h:s.a[1]>n.y&&s.a[1]<n.y+n.h&&Math.max(s.a[0],s.b[0])>n.x&&Math.min(s.a[0],s.b[0])<n.x+n.w;
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/System-Diagrams.html?authored=1');
 await page.waitForFunction(()=>window.__systemDiagramsReady||window.__systemDiagramsError);assert.equal(await page.evaluate(()=>window.__systemDiagramsError),undefined);assert.deepEqual(errors,[]);
 const sheet=page.locator('#activity-p2'),svg=sheet.locator('svg'),g=await page.evaluate(()=>window.SystemActivityGeometry.p2),route=(a,guard)=>g.routes.find(r=>r.from===a&&r.guard===(guard||null))?.to;
 const children=await sheet.locator('[data-child-process]').evaluateAll(ns=>ns.map(n=>[n.dataset.childProcess,n.dataset.childName]).sort());
 assert.deepEqual(children,p2.steps.map((name,i)=>['p2.'+(i+1),name]));
 const form=['request-input','select-type','request-schedule-type','request-room','request-items','request-review'];
 for(const [i,key] of form.entries())assert(g.nodes[key].title.startsWith(String(i+1)+' '));
 for(const [a,b] of [['type-merge','request-schedule-type'],['request-schedule-type','request-room'],['request-room','request-items'],['request-items','request-review'],['request-review','request-valid'],['request-save','request-confirm'],['request-confirm','request-end']])assert.equal(route(a),b);
 assert.equal(route('request-valid','[Yes]'),'request-save');assert.equal(route('request-valid','[No]'),'request-error');
 assert.match(g.nodes['select-type'].title,/retain on reschedule/);assert.match(g.nodes['request-schedule-type'].title,/route preview/);assert.match(g.nodes['request-review'].title,/route read-only; Submit/);assert.match(g.nodes['request-confirm'].title,/Current Reviewer/);
 assert.equal(route('classrep-schedule','[Yes]'),'faculty-merge');assert.equal(route('classrep-schedule','[No]'),'faculty-available');assert.equal(route('faculty-available','[Yes]'),'faculty-merge');assert.equal(route('faculty-available','[No]'),'dean-merge');assert.equal(route('classrep-final'),'classrep-final-end');assert.equal(route('faculty-schedule','[Yes]'),'faculty-regular');assert.equal(route('faculty-schedule','[No]'),'dean-merge');
 const issues=[];
 for(const [key,n] of Object.entries(g.nodes)){
  const ins=g.routes.filter(r=>r.to===key),outs=g.routes.filter(r=>r.from===key);
  if(n.kind==='action'){assert.equal(ins.length,1,key);assert.equal(outs.length,1,key);}
  if(n.kind==='decision'){assert.equal(ins.length,1,key);assert.equal(outs.length,2,key);assert(outs.every(r=>r.guard&&r.displayGuard&&!/[\[\]]/.test(r.displayGuard)));}
  if(n.kind==='join'){assert.equal(ins.length,key==='type-merge'?3:2,key);assert.equal(outs.length,1);assert.equal(n.joinSpec,'or');}
  for(const [other,b] of Object.entries(g.nodes))if(key<other&&overlaps(n,b))issues.push('nodes '+key+'/'+other);
 }
 const seen=new Set(['start']);for(let i=0;i<Object.keys(g.nodes).length;i++)for(const r of g.routes)if(seen.has(r.from))seen.add(r.to);assert.equal(seen.size,Object.keys(g.nodes).length);
 const terminals=new Set(Object.entries(g.nodes).filter(([,n])=>['final','flow-final'].includes(n.kind)).map(([key])=>key));for(let i=0;i<Object.keys(g.nodes).length;i++)for(const r of g.routes)if(terminals.has(r.to))terminals.add(r.from);assert.equal(terminals.size,Object.keys(g.nodes).length);
 const ports=[];
 for(const r of g.routes){
  assert(onBoundary(r.points[0],g.nodes[r.from])&&onBoundary(r.points.at(-1),g.nodes[r.to]),'Attached '+r.from+'/'+r.to);
  assert(r.points.at(-1)[1]>=r.points[0][1],'Downward flow '+r.from+'/'+r.to);
  ports.push(r.to+':'+r.points.at(-1).join(','));
  for(const s of segments(r)){assert(s.a[0]===s.b[0]||s.a[1]===s.b[1]);for(const [key,n] of Object.entries(g.nodes))if(key!==r.from&&key!==r.to&&['action','decision','join','final','flow-final'].includes(n.kind)&&crosses(s,n))issues.push('line/node '+r.from+'/'+r.to+'/'+key);}
 }
 assert.equal(new Set(ports).size,ports.length,'Separate destination ports');
 const textBoxes=await svg.locator('text').evaluateAll(ns=>ns.map(n=>{const b=n.getBBox();return{x:b.x,y:b.y,w:b.width,h:b.height,text:n.textContent,owner:n.closest('[data-activity-node],[data-decision]')?.getAttribute('data-activity-node')||n.closest('[data-decision]')?.dataset.decision||null};}));
 for(const [i,t] of textBoxes.entries()){
  assert(t.x>=0&&t.y>=0&&t.x+t.w<=g.width&&t.y+t.h<=g.height,'Text in canvas '+t.text);
  for(const u of textBoxes.slice(i+1))if(overlaps(t,u))issues.push('labels '+t.text+'/'+u.text);
  if(t.owner&&g.nodes[t.owner].kind==='action'){const n=g.nodes[t.owner];if(t.x<n.x+3||t.x+t.w>n.x+n.w-3||t.y<n.y+3||t.y+t.h>n.y+n.h-3)issues.push('text outside action '+t.owner);}
  if(!t.owner){
   for(const [key,n] of Object.entries(g.nodes))if(overlaps(t,n))issues.push('guard/node '+t.text+'/'+key);
   const padded={x:t.x-3,y:t.y-3,w:t.w+6,h:t.h+6};for(const r of g.routes)if(segments(r).some(s=>crosses(s,padded)))issues.push('guard/line '+t.text+'/'+r.from+'/'+r.to);
  }
 }
 console.log('P2 geometry:',JSON.stringify(issues));assert.deepEqual(issues,[]);
 assert.equal(await svg.locator('marker').getAttribute('markerWidth'),'8.5');assert.equal(await sheet.evaluate(n=>n.scrollHeight<=n.clientHeight+1),true,'A4 sheet does not overflow');
 await svg.screenshot({path:path.join(os.tmpdir(),'reservation-activity-audit.png')});
 if(process.argv.includes('--render')){
  const output=await svg.evaluate(async source=>{
   const copy=source.cloneNode(true),original=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
   const properties=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style','text-anchor','opacity'];
   clones.forEach((n,i)=>{const s=getComputedStyle(original[i]);for(const p of properties)n.style.setProperty(p,s.getPropertyValue(p));});
   const width=2400,height=Math.round(width*source.viewBox.baseVal.height/source.viewBox.baseVal.width);copy.setAttribute('width',width);copy.setAttribute('height',height);copy.style.removeProperty('width');copy.style.removeProperty('height');
   const svg=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
   try{const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0);return{svg,png:c.toDataURL('image/png').split(',')[1]};}finally{URL.revokeObjectURL(url);}
  });
  fs.writeFileSync(path.join(root,'assets/system-diagrams/activity-p2.svg'),output.svg);fs.writeFileSync(path.join(root,'assets/system-diagrams/activity-p2.png'),Buffer.from(output.png,'base64'));
  await sheet.screenshot({path:path.join(root,'assets/system-diagrams/preview-activity-p2.png')});
 }
 if(process.argv.includes('--pdf')){
  const out=path.join(root,'output/pdf');fs.mkdirSync(out,{recursive:true});const pdfPath=path.join(out,'diagrams.pdf');
  await page.pdf({path:pdfPath,preferCSSPageSize:true,printBackground:true});fs.copyFileSync(pdfPath,path.join(root,'assets/system-diagrams/diagrams.pdf'));
  const pdf=fs.readFileSync(pdfPath).toString('latin1');assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,12);
 }
 if(process.argv.includes('--pdf-preview')){
  const qa=await page.evaluate(async()=>{
   const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
   const data=new Uint8Array(await(await fetch('output/pdf/diagrams.pdf')).arrayBuffer()),doc=await pdfjs.getDocument({data}).promise;
   const montage=document.createElement('canvas');montage.width=900;montage.height=Math.ceil(doc.numPages/3)*445;const ctx=montage.getContext('2d');ctx.fillStyle='#e5e7eb';ctx.fillRect(0,0,montage.width,montage.height);let p2png;const sizes=[];
   for(let i=1;i<=doc.numPages;i++){
    const p=await doc.getPage(i),box=p.getViewport({scale:1});sizes.push([box.width,box.height]);const v=p.getViewport({scale:i===3?3:280/box.width}),c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
    if(i===3)p2png=c.toDataURL('image/png').split(',')[1];const x=((i-1)%3)*300+10,y=Math.floor((i-1)/3)*445+24;ctx.fillStyle='#000';ctx.font='12px Arial';ctx.fillText('Page '+i,x,y-7);ctx.drawImage(c,x,y,280,280*box.height/box.width);
   }
   return{pages:doc.numPages,sizes,p2png,montage:montage.toDataURL('image/png').split(',')[1]};
  });
  assert.equal(qa.pages,12);assert(qa.sizes.every(([w,h])=>Math.abs(w-595.28)<1&&Math.abs(h-841.89)<1));
  const dir=path.join(root,'tmp/pdfs');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'reservation-p2-a4-qa.png'),Buffer.from(qa.p2png,'base64'));fs.writeFileSync(path.join(dir,'reservation-booklet-a4-qa.png'),Buffer.from(qa.montage,'base64'));console.log('Actual PDF render passed: 12 A4 portrait pages.');
 }
 if(process.argv.includes('--docs')){
  await page.goto('http://127.0.0.1:'+server.address().port+'/Docs.html',{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>document.querySelectorAll('.a4-page-number').length>0,null,{timeout:120000});
  for(const [image,heading,caption] of [['dfd-level2-p2.png','dfd-p2','Figure 6:'],['activity-p2.png','activity-p2','Figure 12:']]){
   const fig=page.locator('.doc-pages figure').filter({has:page.locator('img[src*="'+image+'"]')});assert.equal(await fig.count(),1);
   const sheet=fig.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]');
   assert.equal(await sheet.locator('[data-section-id="'+heading+'"]').count(),1,'Heading on diagram page');
   assert.equal(await sheet.locator('figcaption').filter({hasText:caption}).count(),1,'Caption on diagram page');
   const imageBox=await fig.locator('img').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,box:img.getBoundingClientRect().toJSON(),area:img.closest('.pagedjs_area').getBoundingClientRect().toJSON()}));
   assert(imageBox.width>0&&imageBox.box.bottom<=imageBox.area.bottom+2,'Updated figure fits its A4 page');
   await sheet.screenshot({path:path.join(os.tmpdir(),'reservation-docs-'+image)});
  }
  const audit=await page.evaluate(()=>{
   const compact=s=>s.replace(/\s+/g,''),paragraphText=compact([...document.querySelectorAll('.doc-pages p')].map(n=>n.textContent).join(''));
   const missing=[...document.querySelectorAll('.doc-source .approval-routing-reference p')].filter(n=>!paragraphText.includes(compact(n.textContent))).map(n=>n.textContent.slice(0,60));
   return{missing,paragraphText};
  });assert.deepEqual(audit.missing,[],'All revised DFD descriptions survive pagination');assert.deepEqual(errors,[]);
  console.log('Docs.html: updated Figures 6 and 12 fit A4, captions retained, all revised subprocess paragraphs retained.');
 }
 console.log('PASS: six form steps, four subprocesses, single-reviewer routes, distinct arrowheads, connected branches and A4 layout.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
