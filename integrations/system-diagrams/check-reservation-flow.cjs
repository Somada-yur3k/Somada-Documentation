// Focused P2 regression, authored exports and PDF QA. No Google Docs writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const l2=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json')),p2=l2.find(m=>m.id==='p2');
assert.deepEqual(p2.steps,['Retrieve Availability','Validate & Record Reservation','Route and Process Approval','Update Reservation Status']);
assert.equal(p2.flows.length,25);assert.equal(p2.internal.length,4);assert.equal(new Set(p2.flows.map(f=>f.parentFlow)).size,20);
assert.deepEqual(p2.internal[1].operations,['submit','edit','reschedule']);
assert.deepEqual(p2.internal[3],{id:'p2-internal4',source:'p2.2',target:'p2.4',label:'Cancellation Result',operations:['cancel'],payloadFields:['request_id','revision_id','status'],kind:'internal'});
assert.equal(p2.internal[2].label,'Routing & Decision Data');
assert.deepEqual(p2.internal[2].payloadFields,['revision_id','approver_id','decision','status']);
for(const f of ['reservation_type','student_ids','requester_id','group_id','lab_id','block_id','starts_at','ends_at','request_basis','usage_type','item_id','qty_requested','purpose'])assert(p2.internal[1].payloadFields.includes(f),f);
for(const f of ['assets/system-diagrams/models.js','assets/system-diagrams/render.js','assets/system-diagrams/TRACEABILITY.md','assets/system-diagrams/SEQUENCE-PLAN.md'])assert.doesNotMatch(read(f),/available Faculty then Dean|then Dean after Faculty approval|approval → Pending Dean|Intermediate Faculty approval keeps/);
const scenarios=require('../../assets/system-diagrams/models.js');assert(scenarios.find(s=>s.id==='request').processes.includes('p2.4'));
const l1=JSON.parse(read('assets/figures-v2/dfd-level1/dfd-level1-model.json'));
assert(l1.flows.some(f=>f.source==='d2'&&f.target==='p4'&&f.label==='Authorized Reservation Data'),'Issuance reads approved evidence from D2');
assert(l1.flows.some(f=>f.source==='p2'&&f.target==='d2'),'Reservation outcomes are saved in D2');
assert(!l1.flows.some(f=>f.source==='p2'&&f.target==='p4'),'Do not invent a direct DFD boundary flow');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});});
const overlaps=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>2;
const overlapsNode=(b,n)=>n.kind==='decision'?Math.max(b.x-n.x-n.w/2,n.x+n.w/2-b.x-b.w,0)/(n.w/2)+Math.max(b.y-n.y-n.h/2,n.y+n.h/2-b.y-b.h,0)/(n.h/2)<1:overlaps(b,n);
const onBoundary=(p,n)=>n.kind==='decision'?Math.abs(Math.abs(p[0]-n.x-n.w/2)/(n.w/2)+Math.abs(p[1]-n.y-n.h/2)/(n.h/2)-1)<.001:((p[0]===n.x||p[0]===n.x+n.w)&&p[1]>=n.y&&p[1]<=n.y+n.h)||((p[1]===n.y||p[1]===n.y+n.h)&&p[0]>=n.x&&p[0]<=n.x+n.w);
const segments=r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b}));
const crosses=(s,n)=>s.a[0]===s.b[0]?s.a[0]>n.x&&s.a[0]<n.x+n.w&&Math.max(s.a[1],s.b[1])>n.y&&Math.min(s.a[1],s.b[1])<n.y+n.h:s.a[1]>n.y&&s.a[1]<n.y+n.h&&Math.max(s.a[0],s.b[0])>n.x&&Math.min(s.a[0],s.b[0])<n.x+n.w;
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/System-Diagrams.html?authored=1');
 await page.waitForFunction(()=>window.__systemDiagramsReady||window.__systemDiagramsError);assert.equal(await page.evaluate(()=>window.__systemDiagramsError),undefined);assert.deepEqual(errors,[]);
 const sheet=page.locator('#activity-p2'),svg=sheet.locator('svg'),g=await page.evaluate(()=>window.SystemActivityGeometry.p2),route=(a,guard)=>g.routes.find(r=>r.from===a&&r.guard===(guard||null))?.to;
 assert.doesNotMatch(await svg.textContent(),/View Status: requester-owned records only\.|Edit \/ reschedule and cancel: eligible requests only\.|Reschedule retains Request Type and rechecks the route\.|Clearance: assigned-class students, read-only\.|Faculty and Dean have no clearance access\./,'Removed explanatory note must not return to the artwork');
 const children=await sheet.locator('[data-child-process]').evaluateAll(ns=>ns.map(n=>[n.dataset.childProcess,n.dataset.childName]).sort());
 assert.deepEqual(children,p2.steps.map((name,i)=>['p2.'+(i+1),name]));
 const form=['request-input','select-type','request-schedule-type','request-room','request-items','request-review'];
 assert.deepEqual(['request-choice','status-choice','approval-choice','clearance-choice'].map(k=>g.nodes[k].title.replace(/\n/g,' ')),['Submit Form?','View Status?','Routed Reviewer?','View Clearance?']);
 for(const obsolete of ['availability-choice','tracking-choice','cancel-choice','status-cancel','request-end'])assert(!g.nodes[obsolete],obsolete+' is not a primary operation');
 assert.equal(route('request-choice','[Submit Form]'),'form-ready');
 assert.equal(route('form-ready'),'request-input');assert.equal(g.nodes['form-ready'].joinSpec,'or');
 assert.equal(route('status-choice','[View Status]'),'status-input');assert.equal(route('status-input'),'status-own');
 assert.equal(route('status-own','[Own record]'),'status-display');assert.equal(route('status-own','[Not own record]'),'status-error');
 assert.equal(route('status-display'),'status-action');
 assert.equal(route('status-action','[Edit / reschedule]'),'edit-valid');assert.equal(route('edit-valid','[Eligible edit]'),'form-ready');assert.equal(route('edit-valid','[Not eligible]'),'edit-error');
 assert.equal(route('status-action','[Cancel request]'),'cancel-check');assert.equal(route('cancel-check'),'cancel-valid');assert.equal(route('cancel-valid','[Eligible]'),'cancel-save');assert.equal(route('cancel-valid','[Not eligible]'),'cancel-error');
 assert.equal(route('status-action','[View only]'),'status-end');
 assert.equal(route('clearance-choice','[View Clearance]'),'clearance-role');assert.equal(route('clearance-role','[Class Representative]'),'clearance-view');assert.equal(route('clearance-role','[Other role]'),'clearance-denied');
 assert.deepEqual(g.nodes['clearance-view'].roles,['Class Representative']);assert.equal(g.nodes['clearance-view'].processReference,'p5.3');assert.equal(await svg.locator('[data-activity-node="clearance-view"]').getAttribute('data-process-reference'),'p5.3');
 assert.deepEqual(scenarios.find(s=>s.id==='clearstatus').processes,['p5.3'],'Clearance ownership remains outside P2');
 assert.equal(route('approval-choice','[Routed Reviewer]'),'approval-open');assert.match(g.nodes['approval-open'].title,/reviewer only/);
 for(const [i,key] of form.slice(0,4).entries())assert(g.nodes[key].title.startsWith(String(i+1)+' '));
 assert.match(g.nodes['request-items'].title,/^Equipment \/ Materials/);assert.match(g.nodes['request-review'].title,/^Review Information/);
 for(const [a,b] of [['type-merge','request-schedule-type'],['request-schedule-type','request-room'],['request-room','equipment-ready'],['equipment-ready','request-items'],['request-items','request-review'],['request-review','request-valid'],['request-save','request-confirm'],['request-confirm','routing-ready'],['approval-open','routing-ready'],['routing-ready','approval-input'],['approval-input','approval-requester']])assert.equal(route(a),b);
 assert.equal(route('request-role','[No: Faculty]'),'faculty-activity');
 assert.equal(route('faculty-activity','[Laboratory Activity]'),'equipment-ready','Assigned-schedule Faculty path goes directly to equipment');
 assert.equal(route('faculty-activity','[Non-Laboratory Activity]'),'faculty-request-options');
 assert.equal(route('faculty-request-options'),'equipment-ready');
 assert.match(g.nodes['faculty-request-options'].title,/Schedule Type; class,\nroom, date and time/);
 assert.equal(g.nodes['faculty-activity'].scheduleSource,'assigned-class-schedule');
 assert.deepEqual(g.routes.filter(r=>r.to==='type-merge').map(r=>r.from).sort(),['group-info','individual-info'],'Class Representative-only type alternatives');
 assert.deepEqual(g.routes.filter(r=>r.to==='equipment-ready').map(r=>r.from).sort(),['faculty-activity','faculty-request-options','request-room']);
 assert(!g.nodes['request-end'],'Submission continues automatically, without a premature Flow Final');
 assert.equal(g.nodes['routing-ready'].joinSpec,'or','New submission or an existing routed request can enter independently');
 assert.equal(g.routes.filter(r=>r.to==='routing-ready').length,2);
 for(const key of ['classrep-faculty-review','dean-review','approval-input'])assert.equal(await svg.locator('[data-activity-node="'+key+'"]').getAttribute('data-child-ref'),'p2.3');
 for(const key of ['classrep-final','dean-final','faculty-regular'])assert.equal(await svg.locator('[data-activity-node="'+key+'"]').getAttribute('data-child-ref'),'p2.4');
 assert.match(g.nodes['faculty-regular'].title,/Confirm Approved;\nno academic approval/,'Do not create a second Faculty on-schedule request or approval row');
 for(const [from,to]of [['request-confirm','routing-ready'],['approval-open','routing-ready'],['routing-ready','approval-input'],['approval-requester','classrep-schedule'],['faculty-available','faculty-merge'],['classrep-faculty-review','classrep-final'],['dean-review','dean-final']]){
  const points=g.routes.find(r=>r.from===from&&r.to===to).points,a=points.at(-2),b=points.at(-1);
  assert(Math.hypot(a[0]-b[0],a[1]-b[1])>=20,'Visible connected-flow arrowhead: '+from+'/'+to);
 }
 assert.equal(route('request-valid','[Yes]'),'request-save');assert.equal(route('request-valid','[No]'),'request-error');
 assert.match(g.nodes['select-type'].title,/retain on reschedule/);assert.match(g.nodes['request-schedule-type'].title,/route preview/);assert.match(g.nodes['request-review'].title,/route read-only; Submit/);assert.match(g.nodes['request-confirm'].title,/Current Reviewer/);
 assert.equal(route('classrep-schedule','[Yes]'),'faculty-merge');assert.equal(route('classrep-schedule','[No]'),'faculty-available');assert.equal(route('faculty-available','[Yes]'),'faculty-merge');assert.equal(route('faculty-available','[No]'),'dean-merge');assert.equal(route('classrep-final'),'classrep-final-end');assert.equal(route('faculty-schedule','[Yes]'),'faculty-regular');assert.equal(route('faculty-schedule','[No]'),'dean-merge');
 const issues=[];
 for(const [key,n] of Object.entries(g.nodes)){
  const ins=g.routes.filter(r=>r.to===key),outs=g.routes.filter(r=>r.from===key);
  if(n.kind==='action'){assert.equal(ins.length,1,key);assert.equal(outs.length,1,key);}
  if(n.kind==='decision'){assert.equal(ins.length,1,key);assert.equal(outs.length,key==='status-action'?3:2,key);assert(outs.every(r=>r.guard&&r.displayGuard&&!/[\[\]]/.test(r.displayGuard)),key+': '+JSON.stringify(outs));}
  if(n.kind==='join'){assert.equal(ins.length,key==='equipment-ready'?3:2,key);assert.equal(outs.length,1);assert.equal(n.joinSpec,'or');}
  for(const [other,b] of Object.entries(g.nodes))if(key<other&&overlaps(n,b))issues.push('nodes '+key+'/'+other);
 }
 const seen=new Set(['start']);for(let i=0;i<Object.keys(g.nodes).length;i++)for(const r of g.routes)if(seen.has(r.from))seen.add(r.to);assert.equal(seen.size,Object.keys(g.nodes).length);
 const terminals=new Set(Object.entries(g.nodes).filter(([,n])=>['final','flow-final'].includes(n.kind)).map(([key])=>key));for(let i=0;i<Object.keys(g.nodes).length;i++)for(const r of g.routes)if(terminals.has(r.to))terminals.add(r.from);assert.equal(terminals.size,Object.keys(g.nodes).length);
 const ports=[];
 for(const r of g.routes){
  assert(onBoundary(r.points[0],g.nodes[r.from])&&onBoundary(r.points.at(-1),g.nodes[r.to]),'Attached '+r.from+'/'+r.to);
  const last=r.points.at(-1),previous=r.points.at(-2);assert(Math.hypot(last[0]-previous[0],last[1]-previous[1])>=20,'Visible arrow shaft '+r.from+'/'+r.to);
  assert(r.points.at(-1)[1]>=r.points[0][1]||r.to==='form-ready','Downward flow or explicit edit/form-entry loop '+r.from+'/'+r.to);
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
   for(const [key,n] of Object.entries(g.nodes))if(overlapsNode(t,n))issues.push('guard/node '+t.text+'/'+key);
   const padded={x:t.x-3,y:t.y-3,w:t.w+6,h:t.h+6};for(const r of g.routes)if(segments(r).some(s=>crosses(s,padded)))issues.push('guard/line '+t.text+'/'+r.from+'/'+r.to);
  }
 }
 console.log('P2 geometry:',JSON.stringify(issues));assert.deepEqual(issues,[]);
 assert(await svg.locator('[data-flow-label]').evaluateAll(ns=>ns.every(n=>getComputedStyle(n).fontSize==='21px')),'All P2 arrow labels are 21 px');
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
 console.log('PASS: four navigation entries, nested status actions, Class Representative-only clearance reference, six form steps, four subprocesses, single-reviewer routes, distinct arrowheads and A4 layout.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
