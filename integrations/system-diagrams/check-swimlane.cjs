// Focused whole-system swimlane QA/export, independent of other diagram drafts.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),os=require('node:os'),vm=require('node:vm');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'Docs.html'),'utf8');
const data=vm.runInNewContext(html.match(/<script>\s*\/\*[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'')+'; DATA');
const scheduled=data.useCases.find(u=>u.diagramId==='submitscheduled'),request=data.useCases.find(u=>u.diagramId==='submitcombined');
assert.match(scheduled.flowActor[0],/Laboratory Activity/);
assert.match(scheduled.briefDescription,/does not ask Faculty to choose On-Schedule or Out-of-Schedule/);
assert.match(scheduled.flowSystem.join(' '),/Approved without an approval row/);
assert.match(request.flowActor.join(' '),/Faculty on-schedule non-laboratory requests show No academic approval required/);
assert.match(request.postconditions.join(' '),/Faculty out-of-schedule requests go directly to Dean and remain Pending/);
assert.match(request.postconditions.join(' '),/Faculty on-schedule non-laboratory request is stored as Approved/);
assert.match(data.events.find(e=>e.event==='A requester submits an on-schedule non-laboratory request').response,/Faculty on-schedule non-laboratory request is saved as Approved/);
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(error,bytes)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(bytes);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1600}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/System-Diagrams.html?authored=1');
  await page.waitForFunction(()=>window.__systemDiagramsReady||window.__systemDiagramsError);
  assert.equal(await page.evaluate(()=>window.__systemDiagramsError),undefined);
  assert.deepEqual(errors,[]);
  const sheet=page.locator('#activity-system'),svg=sheet.locator('svg');
  const whole=await page.evaluate(()=>window.SystemSwimlaneGeometry),issues=[];
  const required=[
   ['start','admin'],['admin','faculty-credentials'],['faculty-credentials','faculty-identity'],
   ['faculty-identity','classrep-account'],['classrep-account','headlab-fork'],
   ['headlab-fork','faculty-handoff'],['faculty-handoff','faculty-fork'],
   ['faculty-fork','classrep-receive'],['classrep-receive','classrep-login'],
   ['faculty-fork','faculty-login'],['classrep-login','question'],['faculty-login','faculty-request'],
   ['headlab-fork','admin-tasks'],['admin-tasks','forecast']
  ];
  for(const [from,to]of required)assert(whole.routes.some(r=>r.from===from&&r.to===to),'Missing handover/role path: '+from+' -> '+to);
  assert(!whole.routes.some(r=>['classrep-login','faculty-login'].includes(r.from)&&r.to==='admin-tasks'));
  for(const key of ['admin','classrep-account','admin-tasks','forecast','clearance','report'])assert.equal(whole.nodes[key].lane,4,key+' belongs to Head Lab');
  assert(!whole.routes.some(r=>r.from==='review'&&r.to==='dean'),'Faculty review does not escalate to Dean');
  for(const [from,to]of [
   ['request-ready','choose-laboratory'],['choose-laboratory','reservation-type'],
   ['type-merge','schedule-type'],['schedule-type','request-details'],['request-details','request'],
   ['request','request-submitted'],['request-submitted','pending-status'],['request-submitted','classrep-schedule'],
   ['pending-status','pending-status-end'],['faculty-review-ready','review'],
   ['approval-ready','approved-dispatch'],['approved-dispatch','prepare-requester'],['approved-dispatch','lab'],
   ['requester-prepared','approved-status-end']
  ])assert(whole.routes.some(r=>r.from===from&&r.to===to),'Reservation path: '+from+' -> '+to);
  assert.equal(whole.nodes['request-submitted'].kind,'fork');assert.equal(whole.nodes['approved-dispatch'].kind,'fork');
  assert.equal(whole.nodes['type-merge'].joinSpec,'or');assert.equal(whole.nodes['faculty-review-ready'].joinSpec,'or');
  assert.match(whole.nodes['choose-laboratory'].title,/Physics or Circuits/);
  assert.match(whole.nodes['schedule-type'].title,/On- \/ Out-of-schedule/);
  assert.match(whole.nodes['pending-status'].title,/Pending status;\nCurrent Reviewer/);
  assert.equal(whole.nodes['pending-status-end'].kind,'flow-final','Viewing Pending does not end the reservation');
  assert(!whole.routes.some(r=>r.from==='pending-status'&&['review','dean'].includes(r.to)),'Reviewer processing does not depend on status viewing');
  assert(!whole.routes.some(r=>r.from==='requester-prepared'&&r.to==='lab'),'Staff queue does not wait for status viewing');
  const target=(from,guard)=>whole.routes.find(r=>r.from===from&&r.guard===guard)?.to;
  assert.equal(target('classrep-schedule','[Yes]'),'faculty-review-ready');assert.equal(target('classrep-schedule','[No]'),'faculty-available');
  assert.equal(target('faculty-available','[Yes]'),'faculty-review-ready');assert.equal(target('faculty-available','[No]'),'dean-route');
  for(const [from,to]of [
   ['faculty-request','faculty-activity'],['faculty-schedule-type','faculty-form-ready'],
   ['faculty-form-ready','faculty-room'],['faculty-room','faculty-items'],
   ['faculty-items','faculty-submit'],['faculty-submit','faculty-scheduled']
  ])assert(whole.routes.some(r=>r.from===from&&r.to===to),'Faculty form path: '+from+' -> '+to);
  assert.equal(target('faculty-activity','[Laboratory Activity]'),'faculty-form-ready');
  assert.equal(target('faculty-activity','[Non-Laboratory]'),'faculty-schedule-type');
  assert.equal(whole.nodes['faculty-form-ready'].joinSpec,'or','Activity alternatives are not parallel tasks');
  assert.equal(target('faculty-scheduled','[Yes]'),'approved','Both validated Faculty on-schedule modes skip approval');
  assert.equal(target('faculty-scheduled','[No]'),'dean-route','Only Faculty out-of-schedule goes to Dean');
  assert.equal(await svg.locator('[data-swimlane-node="faculty-submit"][data-validation-rule="assigned-class-schedule-and-availability"]').count(),1,'Laboratory Activity cannot bypass assigned-class validation');
  assert.equal(await svg.locator('[data-routing-rule="automatic"]').count(),3,'Reviewer rules are automatic');
  assert.equal(await svg.locator('[data-routing-rule="selected-laboratory"]').count(),2,'Staff uses the saved laboratory');
  for(const [key,n]of Object.entries(whole.nodes)){
   if(n.x<whole.laneBounds[n.lane]||n.x+n.w>whole.laneBounds[n.lane+1]||n.y<130||n.y+n.h>=whole.height)issues.push(key+' outside lane/page');
   const incoming=whole.routes.filter(r=>r.to===key),outgoing=whole.routes.filter(r=>r.from===key);
   if(n.kind==='action'&&(incoming.length!==1||outgoing.length!==1))issues.push(key+' implicit merge/fork');
   if(n.kind==='decision'&&(incoming.length!==1||outgoing.length!==2||outgoing.some(r=>!r.guard)))issues.push(key+' decision flow');
   if(n.kind==='fork'&&(incoming.length!==1||outgoing.length!==2||outgoing.some(r=>r.guard)))issues.push(key+' fork flow');
   if(n.kind==='join'&&(incoming.length!==2||outgoing.length!==1||n.joinSpec!=='or'))issues.push(key+' exclusive join flow');
  }
  for(const r of whole.routes){
   const a=r.points.at(-2),b=r.points.at(-1);
   if(Math.hypot(b[0]-a[0],b[1]-a[1])<30)issues.push(r.from+' -> '+r.to+' short arrowhead shaft');
   r.points.slice(1).forEach((b,i)=>{
    const a=r.points[i];
    if(a[0]!==b[0]&&a[1]!==b[1])issues.push(r.from+' -> '+r.to+' diagonal segment');
    for(const [key,n]of Object.entries(whole.nodes)){
     if(key===r.from||key===r.to)continue;
     const cross=a[0]===b[0]?a[0]>n.x&&a[0]<n.x+n.w&&Math.max(a[1],b[1])>n.y&&Math.min(a[1],b[1])<n.y+n.h:a[1]>n.y&&a[1]<n.y+n.h&&Math.max(a[0],b[0])>n.x&&Math.min(a[0],b[0])<n.x+n.w;
     if(cross)issues.push(r.from+' -> '+r.to+' crosses '+key);
    }
   });
  }
  // Unrelated arrows must not share a shaft; crossings are visually bridged.
  for(let i=0;i<whole.routes.length;i++)for(let j=i+1;j<whole.routes.length;j++){
   const a=whole.routes[i],b=whole.routes[j];
   for(let p=1;p<a.points.length;p++)for(let q=1;q<b.points.length;q++){
    const c=a.points[p-1],d=a.points[p],e=b.points[q-1],f=b.points[q];
    const v=c[0]===d[0]&&e[0]===f[0]&&c[0]===e[0],h=c[1]===d[1]&&e[1]===f[1]&&c[1]===e[1];
    if(!v&&!h)continue;
    const k=v?1:0,shared=Math.min(Math.max(c[k],d[k]),Math.max(e[k],f[k]))-Math.max(Math.min(c[k],d[k]),Math.min(e[k],f[k]));
    if(shared>1)issues.push(a.from+' -> '+a.to+' shares shaft with '+b.from+' -> '+b.to);
   }
  }
  const reached=new Set(['start']),ended=new Set(Object.entries(whole.nodes).filter(([,n])=>['final','flow-final'].includes(n.kind)).map(([key])=>key));
  for(let i=0;i<Object.keys(whole.nodes).length;i++)for(const r of whole.routes){if(reached.has(r.from))reached.add(r.to);if(ended.has(r.to))ended.add(r.from);}
  assert.deepEqual([...reached].sort(),Object.keys(whole.nodes).sort(),'All tasks reachable');
  assert.deepEqual([...ended].sort(),Object.keys(whole.nodes).sort(),'All branches have an outcome');
  issues.push(...await svg.evaluate(svg=>{
   const out=[],geometry=window.SystemSwimlaneGeometry;
   const labels=[...svg.querySelectorAll('[data-flow-label]')].map(t=>({id:t.dataset.flowLabel,text:t.textContent,box:t.getBBox()}));
   const shapes=[...svg.querySelectorAll('[data-swimlane-node]')].map(g=>({id:g.dataset.swimlaneNode,box:g.getBBox()}));
   const overlap=(a,b)=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>2;
   for(const g of svg.querySelectorAll('[data-swimlane-node]')){
    const shape=g.querySelector('.flow-shape');if(!shape)continue;
    const box=shape.getBBox(),n=geometry.nodes[g.dataset.swimlaneNode];
    for(const t of g.querySelectorAll('tspan')){
     const b=t.getBBox();
     if(b.x<box.x+4||b.y<box.y+4||b.x+b.width>box.x+box.width-4||b.y+b.height>box.y+box.height-4)out.push(g.dataset.swimlaneNode+' text outside shape');
     if(n.kind==='decision')for(const x of [b.x,b.x+b.width])for(const y of [b.y,b.y+b.height])if(Math.abs(x-(n.x+n.w/2))/(n.w/2)+Math.abs(y-(n.y+n.h/2))/(n.h/2)>.98)out.push(g.dataset.swimlaneNode+' text touches diamond slope');
    }
   }
   for(const label of labels){
    if(/[\[\]]/.test(label.text))out.push(label.id+' bracketed label');
    for(const shape of shapes)if(overlap(label.box,shape.box))out.push(label.id+' overlaps '+shape.id);
    for(const route of geometry.routes)for(let i=1;i<route.points.length;i++){
     const a=route.points[i-1],b=route.points[i],r=label.box;
     if(a[0]===b[0]&&a[0]>r.x-3&&a[0]<r.x+r.width+3&&Math.max(a[1],b[1])>r.y-3&&Math.min(a[1],b[1])<r.y+r.height+3||a[1]===b[1]&&a[1]>r.y-3&&a[1]<r.y+r.height+3&&Math.max(a[0],b[0])>r.x-3&&Math.min(a[0],b[0])<r.x+r.width+3)out.push(label.id+' touches '+route.from+' -> '+route.to);
    }
   }
   for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)if(overlap(labels[i].box,labels[j].box))out.push(labels[i].id+' overlaps '+labels[j].id);
   const sheet=svg.closest('.sheet');
   if(sheet.scrollHeight>sheet.clientHeight+1)out.push('A4 sheet overflow');
   return [...new Set(out)];
  }));
  console.log('Swimlane geometry issues:',JSON.stringify([...new Set(issues)],null,2));
  if(process.argv.includes('--preview'))await sheet.screenshot({path:path.join(root,'assets/system-diagrams/preview-activity.png')});
  assert.deepEqual(issues,[]);
  if(process.argv.includes('--render')){
   const output=await svg.evaluate(async source=>{
    const copy=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
    const properties=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style','text-anchor','opacity'];
    clones.forEach((node,i)=>{const style=getComputedStyle(originals[i]);for(const property of properties)node.style.setProperty(property,style.getPropertyValue(property));});
    const width=3200,height=Math.round(width*source.viewBox.baseVal.height/source.viewBox.baseVal.width);
    copy.setAttribute('width',width);copy.setAttribute('height',height);copy.style.removeProperty('width');copy.style.removeProperty('height');
    const svg=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);return{svg,png:canvas.toDataURL('image/png').split(',')[1]};}finally{URL.revokeObjectURL(url);}
   });
   fs.writeFileSync(path.join(root,'assets/system-diagrams/swimlane-system.svg'),output.svg);
   fs.writeFileSync(path.join(root,'assets/system-diagrams/swimlane-system.png'),Buffer.from(output.png,'base64'));
   await sheet.screenshot({path:path.join(root,'assets/system-diagrams/preview-activity.png')});
   const out=path.join(root,'output/pdf');fs.mkdirSync(out,{recursive:true});
   const swimlanePdf=path.join(out,'swimlane-system.pdf'),diagramsPdf=path.join(out,'diagrams.pdf');
   await page.pdf({path:swimlanePdf,preferCSSPageSize:true,printBackground:true,pageRanges:'1'});
   fs.copyFileSync(swimlanePdf,path.join(root,'assets/system-diagrams/swimlane-system.pdf'));
   const pdf=fs.readFileSync(swimlanePdf).toString('latin1');
   assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,1,'One-page Swimlane PDF');
   const box=pdf.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
   assert(box&&Math.abs(Number(box[1])-595.28)<1&&Math.abs(Number(box[2])-841.89)<1,'A4 portrait PDF');
   await page.pdf({path:diagramsPdf,preferCSSPageSize:true,printBackground:true});
   fs.copyFileSync(diagramsPdf,path.join(root,'assets/system-diagrams/diagrams.pdf'));
  }
  if(process.argv.includes('--pdf-preview')){
   // Render the actual exported PDF, rather than treating SVG QA as PDF QA.
   const preview=await page.evaluate(async()=>{
    const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    const bytes=new Uint8Array(await(await fetch('assets/system-diagrams/swimlane-system.pdf')).arrayBuffer());
    const doc=await pdfjs.getDocument({data:bytes}).promise,first=await doc.getPage(1);
    const viewport=first.getViewport({scale:2}),canvas=document.createElement('canvas');
    canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    await first.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
    const combinedBytes=new Uint8Array(await(await fetch('assets/system-diagrams/diagrams.pdf')).arrayBuffer());
    const combined=await pdfjs.getDocument({data:combinedBytes}).promise,cols=3,cellWidth=300,cellHeight=445;
    const montage=document.createElement('canvas');montage.width=cols*cellWidth;montage.height=Math.ceil(combined.numPages/cols)*cellHeight;
    const context=montage.getContext('2d');context.fillStyle='#e5e7eb';context.fillRect(0,0,montage.width,montage.height);
    const sizes=[];
    for(let i=1;i<=combined.numPages;i++){
     const page=await combined.getPage(i),box=page.getViewport({scale:1});sizes.push([box.width,box.height]);
     const view=page.getViewport({scale:280/box.width}),small=document.createElement('canvas');
     small.width=Math.ceil(view.width);small.height=Math.ceil(view.height);
     await page.render({canvasContext:small.getContext('2d'),viewport:view}).promise;
     const x=((i-1)%cols)*cellWidth+10,y=Math.floor((i-1)/cols)*cellHeight+24;
     context.fillStyle='#000';context.font='12px Arial';context.fillText('Page '+i,x,y-7);context.drawImage(small,x,y);
    }
    return{pages:doc.numPages,width:canvas.width,height:canvas.height,png:canvas.toDataURL('image/png').split(',')[1],combinedPages:combined.numPages,sizes,montage:montage.toDataURL('image/png').split(',')[1]};
   });
   assert.equal(preview.pages,1);
   const temp=path.join(root,'tmp/pdfs');fs.mkdirSync(temp,{recursive:true});
   fs.writeFileSync(path.join(temp,'swimlane-a4-qa.png'),Buffer.from(preview.png,'base64'));
   fs.writeFileSync(path.join(temp,'diagrams-a4-qa.png'),Buffer.from(preview.montage,'base64'));
   assert(preview.sizes.every(([w,h])=>Math.abs(w-595.28)<1&&Math.abs(h-841.89)<1),'Every combined PDF page is A4 portrait');
   console.log('PDF render:',preview.width+' x '+preview.height+', '+preview.pages+' A4 page');
   console.log('Combined PDF:',preview.combinedPages+' A4 pages');
  }
  console.log('PASS: account handover, independent role paths, all nodes, labels and arrow geometry.');
  if(process.argv.includes('--docs')){
   await page.goto('http://127.0.0.1:'+server.address().port+'/Docs.html',{waitUntil:'load',timeout:120000});
   await page.waitForFunction(()=>document.querySelectorAll('.a4-page-number').length>0,null,{timeout:120000});
   const fig=page.locator('.doc-pages figure').filter({has:page.locator('img[src*="swimlane-system.png"]')});assert.equal(await fig.count(),1,'One updated Figure 16');
   const a4=fig.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]');
   assert.equal(await a4.locator('figcaption').filter({hasText:'Figure 16: Whole-System Swimlane Diagram'}).count(),1,'Caption retained on the diagram page');
   const size=await fig.locator('img').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,bottom:img.getBoundingClientRect().bottom,pageBottom:img.closest('.pagedjs_area').getBoundingClientRect().bottom}));
   assert.equal(size.width,3200);assert.equal(size.height,Math.round(3200*4260/2520));assert(size.bottom<=size.pageBottom+2,'Swimlane fits the A4 content area');
   const text=await page.evaluate(()=>{
    const clean=s=>s.replace(/\s+/g,''),rendered=clean([...document.querySelectorAll('.doc-pages p')].map(n=>n.textContent).join(''));
    return [...document.querySelectorAll('.doc-source #swimlane-diagram .lede p')].filter(p=>!rendered.includes(clean(p.textContent))).map(p=>p.textContent.slice(0,50));
   });assert.deepEqual(text,[],'Revised descriptions retained across page breaks');
   await a4.screenshot({path:path.join(os.tmpdir(),'swimlane-docs-a4-qa.png')});assert.deepEqual(errors,[]);console.log('PASS: Figure 16, caption, A4 fit and all revised Swimlane descriptions in Docs.html.');
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
