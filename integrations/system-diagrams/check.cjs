// Additive UML supplement checks and optional PDF generation. No cloud writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const models=require('../../assets/system-diagrams/models.js');
const sequences=require('../../assets/system-diagrams/sequence-models.js');
const sequenceChecks=require('./check-sequences.cjs');
const docs=read('Docs.html'),data=vm.runInNewContext(docs.match(/<script>\s*\/\*[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'')+'; DATA');
const l1=JSON.parse(read('assets/figures-v2/dfd-level1/dfd-level1-model.json')),l2=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json'));
const roles=l1.entities.map(n=>n.name),processes=l2.flatMap(m=>m.steps.map((_,i)=>m.id+'.'+(i+1))),stores=l1.stores.map(n=>n.id);
assert.equal(new Set(models.map(m=>m.id)).size,models.length);
for(const m of models){assert(m.actors.every(a=>roles.includes(a)),m.id);assert(m.uses.every(u=>data.useCases.some(d=>d.diagramId===u)),m.id);assert(m.processes.every(p=>processes.includes(p)),m.id);assert(m.stores.every(d=>stores.includes(d)),m.id);}
for(const u of data.useCases)assert(models.some(m=>m.uses.includes(u.diagramId)),'Missing use case '+u.diagramId);
for(const p of processes)assert(models.some(m=>m.processes.includes(p)),'Missing child process '+p);
// Verify current requirements semantically; the old exact-copy comparison
// against commit 2c15a21 predates approved reservation-type changes.
require('../google-docs/check-usecase-alignment.cjs');
require('./check-approval.cjs');
// P2 must distinguish the requester before applying approval rules:
// Class Rep on-schedule → Faculty; Class Rep out-of-schedule → available Faculty
// then Dean, or direct Dean only when the assigned Faculty is unavailable;
// Faculty on-schedule → regular schedule; Faculty out-of-schedule → Dean.
const p2Activity=read('assets/system-diagrams/process-activities.js');
assert.match(p2Activity,/decision\('approval-requester',980,1850,'Class Rep\.\?'/);
assert.match(p2Activity,/decision\('classrep-schedule',600,1980,'On-schedule\?'/);
assert.match(p2Activity,/action\('classrep-faculty-review',640,2100,'Faculty: review\\nApprove or Reject'/);
assert.match(p2Activity,/decision\('faculty-available',300,2100,'Faculty\\navailable\?'/);
assert.match(p2Activity,/action\('classrep-out-faculty-review',300,2220,'Faculty: review\\nApprove or Reject'/);
assert.match(p2Activity,/action\('classrep-direct-dean',920,2340,'Dean: final\\nApprove or Reject'/);
assert.match(p2Activity,/action\('classrep-out-final',300,2340,'Save final\\nApproved \/ Rejected'/);
assert.match(p2Activity,/decision\('faculty-schedule',980,1980,'On-schedule\?'/);
assert.match(p2Activity,/action\('faculty-regular',980,2100,'Save regular class\\nschedule; no approval'/);
assert.match(p2Activity,/action\('faculty-dean-review',980,2220,'Dean: final\\nApprove or Reject'/);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(p,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(p)]||'application/octet-stream');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/System-Diagrams.html?authored=1');await page.waitForFunction(()=>window.__systemDiagramsReady||window.__systemDiagramsError);assert.equal(await page.evaluate(()=>window.__systemDiagramsError),undefined,errors.join('\n'));
 assert.equal(await page.locator('.sheet').count(),7+sequences.length);assert.deepEqual(errors,[]);
 assert.deepEqual(await page.locator('.sheet').evaluateAll(nodes=>nodes.map(n=>n.id)),['activity-system','activity-p1','activity-p2','activity-p3','activity-p4','activity-p5',...sequences.map(m=>'sequence-'+m.id),'deployment-view']);
 await sequenceChecks.checkPage(page);
 for(const model of l2){
  const section=page.locator('#activity-'+model.id);
  assert.equal(await section.locator('svg').count(),1);
  assert.equal(await section.locator('[data-lane],.lane-bg').count(),0,model.id+' has no partitions or swimlanes');
  assert.deepEqual(await section.locator('[data-activity-node]').evaluateAll(nodes=>nodes.map(n=>{
   const shape=n.matches('g')?n.querySelector('rect,circle'):n,s=getComputedStyle(shape);
   return s.fill==='rgb(255, 255, 255)'||s.fill==='rgb(0, 0, 0)';
  })),await section.locator('[data-activity-node]').evaluateAll(nodes=>nodes.map(()=>true)),'Monochrome activity shapes');
  assert.equal(await section.locator('marker').getAttribute('markerWidth'),'8.5','Enlarged filled arrowheads');
  const children=await section.locator('[data-child-process]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.childProcess,name:n.dataset.childName})).sort((a,b)=>a.id.localeCompare(b.id)));
  assert.deepEqual(children,model.steps.map((name,i)=>({id:model.id+'.'+(i+1),name})),model.id+' retains every canonical child exactly once');
  assert.equal(await section.locator('..').locator('.process-reference .sheet-foot a').first().getAttribute('href'),'assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process='+model.id);
  assert.equal(await section.locator('.sheet-head,.sheet-note,.sheet-foot,.sheet-subtitle').count(),0,'Only the titled diagram belongs inside the A4 artwork');
  assert.equal(await section.locator('g[data-uml-kind="action"] text').count(),await section.locator('g[data-uml-kind="action"]').count(),'Only one action name per box; no descriptions');
  const aliases=await section.locator('[data-child-ref]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.childRef,name:n.dataset.childName})));
  for(const alias of aliases)assert.equal(alias.name,model.steps[Number(alias.id.split('.')[1])-1],'Repeated behavior retains its canonical mapping');
  assert(await section.locator('[data-child-process]').evaluateAll(nodes=>nodes.every(n=>!/^\d+\.\d+/.test(n.textContent))),'No process-number prefixes in action labels');
  const geometry=await page.evaluate(id=>window.SystemActivityGeometry[id],model.id);
  const finalKeys={p1:'account-end',p2:'other-end',p3:'end',p4:'other-end',p5:'report-end'};
  assert.deepEqual(Object.entries(geometry.nodes).filter(([,n])=>n.kind==='final').map(([k])=>k),[finalKeys[model.id]],'One retained lower Activity Final under the adviser convention');
  assert(Object.values(geometry.nodes).some(n=>n.kind==='flow-final'),'Branch endings use Flow Final');
  assert.equal(await section.locator('svg').getAttribute('viewBox'),model.id==='p2'?'0 0 1200 2500':model.id==='p4'?'0 0 1200 2300':'0 0 1200 1697','Portrait activity artwork');
  if(model.id==='p4'){
   const route=(from,guard)=>geometry.routes.find(r=>r.from===from&&r.guard===guard)?.to;
   assert.equal(route('forecast-choice','[Yes: Head Lab]'),'forecast-input');
   assert.equal(route('forecast-valid','[Yes]'),'forecast-estimate');
   assert.equal(route('forecast-valid','[No]'),'forecast-unavailable');
   assert.equal(route('forecast-show',null),'forecast-review');
   assert.equal(geometry.nodes['forecast-end'].kind,'flow-final');
   assert.equal(geometry.nodes['other-end'].kind,'final');
  }
  for(const [key,node]of Object.entries(geometry.nodes).filter(([key])=>key.endsWith('-error-end'))){
   assert.equal(node.kind,'flow-final','Invalid operation ends only its flow: '+key);
   assert.equal(await section.locator('[data-activity-node="'+key+'"][data-uml-kind="flow-final"] path').count(),1,'Flow Final has an X');
  }
  const actionSizes=Object.values(geometry.nodes).filter(n=>n.kind==='action').map(n=>[n.w,n.h]);
  assert(actionSizes.every(([w,h])=>w===260&&h===68),'Uniform compact action boxes across all five activities');
  assert(Object.values(geometry.nodes).filter(n=>['initial','final'].includes(n.kind)).every(n=>n.w===44&&n.h===44),'Larger, uniform initial/final nodes');
  assert(Object.values(geometry.nodes).filter(n=>n.kind==='decision').every(n=>n.w===180&&n.h===92),'Uniform decision diamonds');
  const forks=Object.entries(geometry.nodes).filter(([,n])=>n.kind==='fork'),joins=Object.entries(geometry.nodes).filter(([,n])=>n.kind==='join');
  assert.equal(forks.length,model.id==='p5'?1:0,'Fork only for independent reporting reads');
  assert.equal(joins.filter(([,n])=>n.joinSpec!=='or').length,forks.length,'Every parallel fork has its synchronization join');
  assert.equal(joins.filter(([,n])=>n.joinSpec==='or').length,model.id==='p2'?1:0,'P2 uses an explicit OR join for alternative reservation types');
  for(const [key,n] of Object.entries(geometry.nodes)){
   assert(n.x>=0&&n.x+n.w<=geometry.width&&n.y>80&&n.y+n.h<geometry.height,key+' stays inside the publication canvas');
   const incoming=geometry.routes.filter(r=>r.to===key),outgoing=geometry.routes.filter(r=>r.from===key);
   if(n.kind==='decision'){
    assert.equal(incoming.length,1,'No decision used as a merge: '+key);
    assert(outgoing.length>=2,'Decision has meaningful alternatives: '+key);
    assert(outgoing.every(r=>/^\[.+\]$/.test(r.guard)),'Every decision branch has a guard: '+key);
    assert.equal(new Set(outgoing.map(r=>r.guard)).size,outgoing.length,'Distinct conditions: '+key);
    assert(n.title.includes('?'),'Decision states its question: '+key);
   }
   if(n.kind==='action'){assert.equal(incoming.length,1,'No implicit AND-join of exclusive alternatives: '+key);assert.equal(outgoing.length,1,'No implicit fork: '+key);}
   if(n.kind==='fork'){assert.equal(incoming.length,1);assert.equal(outgoing.length,2);assert(outgoing.every(r=>!r.guard),'Concurrent branches have no exclusive guards');}
   if(n.kind==='join'){assert.equal(incoming.length,n.joinSpec==='or'?3:2);assert.equal(outgoing.length,1);}
   if(n.kind==='final')assert.equal(outgoing.length,0,'A final cannot continue');
  }
  if(model.id==='p5'){
   const readKeys=['read-usage','read-stock'];
   assert.deepEqual(geometry.routes.filter(r=>r.from==='report-fork').map(r=>r.to).sort(),readKeys.slice().sort());
   assert.deepEqual(geometry.routes.filter(r=>r.to==='report-join').map(r=>r.from).sort(),readKeys.slice().sort());
   for(const key of readKeys)for(const store of geometry.nodes[key].stores)assert(model.flows.some(f=>f.source===store&&f.target==='p5.4'),'Read already present at DFD 5.4: '+store);
   assert(geometry.routes.some(r=>r.from==='report-join'&&r.to==='records-ready'),'Missing evidence checked after synchronization');
  }
  if(model.id==='p2'){
   const route=(from,guard)=>geometry.routes.find(r=>r.from===from&&r.guard===guard)?.to;
   assert.equal(route('approval-requester','[Yes: Class Rep.]'),'classrep-schedule','Requester type is checked before applying Class Rep rules');
   assert.equal(route('approval-requester','[No: Faculty]'),'faculty-schedule','Requester type is checked before applying Faculty rules');
   assert.equal(route('classrep-schedule','[Yes]'),'classrep-faculty-review','On-schedule Class Rep requests go to Faculty');
   assert.equal(route('classrep-schedule','[No]'),'faculty-available','Out-of-schedule Class Rep requests first check Faculty availability');
   assert.equal(route('faculty-available','[Yes]'),'classrep-out-faculty-review','Available Faculty reviews the Class Rep out-of-schedule request');
   assert.equal(route('faculty-available','[No: Faculty unavailable]'),'classrep-direct-dean','Only an unavailable Faculty permits direct Dean review');
   assert.equal(route('classrep-out-faculty-review',null),'classrep-out-final','Available Faculty makes the final out-of-schedule decision');
   assert.equal(route('faculty-schedule','[Yes]'),'faculty-regular','Regular Faculty class schedules need no approval');
   assert.equal(route('faculty-schedule','[No]'),'faculty-dean-review','Only out-of-schedule Faculty requests go to Dean');
   assert.match(geometry.nodes['classrep-out-final'].title,/Save final\nApproved \/ Rejected/);
   for(const [key,n]of Object.entries(geometry.nodes).filter(([,n])=>n.kind==='final')){
    for(const [other,b]of Object.entries(geometry.nodes))if(other!==key)assert(!(n.x<b.x+b.w&&n.x+n.w>b.x&&n.y<b.y+b.h&&n.y+n.h>b.y),'Activity 2 final node overlaps '+other);
   }
  }
  if(model.id==='p4')assert.match(geometry.nodes['issue-valid'].title,/Final approval/,'Pending Dean cannot pass issuance validation');
  for(const route of geometry.routes){
   const onBoundary=(p,n)=>n.kind==='decision'?Math.abs(Math.abs(p[0]-n.x-n.w/2)/(n.w/2)+Math.abs(p[1]-n.y-n.h/2)/(n.h/2)-1)<.001:((p[0]===n.x||p[0]===n.x+n.w)&&p[1]>=n.y&&p[1]<=n.y+n.h)||((p[1]===n.y||p[1]===n.y+n.h)&&p[0]>=n.x&&p[0]<=n.x+n.w);
   assert(onBoundary(route.points[0],geometry.nodes[route.from])&&onBoundary(route.points.at(-1),geometry.nodes[route.to]),'Attached control-flow endpoints');
   route.points.slice(1).forEach((p,i)=>assert(p[0]===route.points[i][0]||p[1]===route.points[i][1],'Orthogonal control flow'));
   for(const [key,n] of Object.entries(geometry.nodes)){
    if(key===route.from||key===route.to||!['action','decision'].includes(n.kind))continue;
    route.points.slice(1).forEach((b,i)=>{
     const a=route.points[i],cross=a[0]===b[0]
      ? a[0]>n.x&&a[0]<n.x+n.w&&Math.max(a[1],b[1])>n.y&&Math.min(a[1],b[1])<n.y+n.h
      : a[1]>n.y&&a[1]<n.y+n.h&&Math.max(a[0],b[0])>n.x&&Math.min(a[0],b[0])<n.x+n.w;
     assert(!cross,model.id+': '+route.from+' → '+route.to+' must not cross '+key);
    });
   }
  }
  const reachable=new Set(['start']);for(let i=0;i<Object.keys(geometry.nodes).length;i++)for(const r of geometry.routes)if(reachable.has(r.from))reachable.add(r.to);
  assert.deepEqual([...reachable].sort(),Object.keys(geometry.nodes).sort(),'All activity nodes connected to the initial node: '+model.id);
  const finals=Object.entries(geometry.nodes).filter(([,n])=>n.kind==='final').map(([key])=>key);assert(finals.length>0,'Every complete activity has a final');
  assert.equal(Object.values(geometry.nodes).filter(n=>n.kind==='initial').length,1,'One continuous initial flow');
  assert(geometry.precondition.includes('signed in')||geometry.precondition.includes('signed-in'),'Explicit authenticated entry scope');
  assert(geometry.routes.every(r=>r.points.at(-1)[1]>=r.points[0][1]),'Top-to-bottom control flow');
  const reachesEnd=new Set(Object.entries(geometry.nodes).filter(([,n])=>['final','flow-final'].includes(n.kind)).map(([key])=>key));for(let i=0;i<Object.keys(geometry.nodes).length;i++)for(const r of geometry.routes)if(reachesEnd.has(r.to))reachesEnd.add(r.from);
  assert.deepEqual([...reachesEnd].sort(),Object.keys(geometry.nodes).sort(),'All branches reach an Activity or Flow Final: '+model.id);
 }
 const dep=page.locator('#deployment-view svg'),deploymentText=await dep.locator('tspan').allTextContents().then(rows=>rows.join(' '));
 assert.deepEqual(await dep.locator('[data-node]').evaluateAll(ns=>ns.map(n=>n.dataset.node).sort()),['application','classrep','database','dean','faculty','head','staff']);
 assert.equal(await dep.getAttribute('viewBox'),'0 0 1200 1697');
 assert.equal(await dep.locator('[data-store]').count(),10);
 for(const term of ['Desktop','Laptop','Tablet','Smartphone','Class Representative','Faculty','Dean','Circuit Staff','Physics Staff','Head Lab','Web Browser','Next.js','React','TypeScript','Node.js','PostgreSQL','HTTPS','TLS','AI Chatbot','Inventory Forecasting'])assert(deploymentText.includes(term),'Deployment missing '+term);
 for(const store of l1.stores)assert(deploymentText.includes(store.number+' — '+store.name),'Deployment missing store '+store.id);
 assert(!/Email infrastructure|Protocol TBD|Not yet selected|SOMADA|\.html/i.test(deploymentText));
 assert.deepEqual(await dep.locator('[data-connection]').evaluateAll(ns=>ns.map(n=>n.dataset.connection).sort()),['application-database','classrep-application','dean-application','faculty-application','head-application','staff-application']);
 assert.deepEqual(await page.locator('#activity-system [data-lane-name]').evaluateAll(ns=>ns.map(n=>n.dataset.laneName)),['Class Representative','Faculty','Circuit Staff','Physics Staff','Head Lab','Dean'],'Six distinct actor partitions');
 const swim=page.locator('#activity-system');
 assert.equal(await swim.locator('[data-uml-kind="initial"]').count(),1);
 assert.equal(await swim.locator('[data-uml-kind="fork"]').count(),0,'Preparation is sequential');
 assert.equal(await swim.locator('[data-uml-kind="join"]').count(),9,'Exclusive preparation outcomes converge separately');
 assert.equal(await swim.locator('[data-uml-kind="final"]').count(),1);
 assert.equal(await swim.locator('[data-uml-kind="flow-final"]').count(),3);
 assert.equal(await swim.locator('svg').getAttribute('viewBox'),'0 0 2520 3800','Portrait artwork fits the A4 publication page');
 assert.equal(await swim.locator('[data-child-process]').count(),0,'Summary does not repeat every Level 2 step');
 assert.equal(await swim.locator('.sheet-head,.sheet-subtitle,.sheet-note,.sheet-foot').count(),0,'Reusable swimlane has no surrounding print chrome');
 assert(await swim.locator('[data-uml-kind="action"] rect').evaluateAll(nodes=>nodes.every(n=>Number(n.getAttribute('rx'))>0)),'UML actions use rounded rectangles');
 assert(await swim.locator('svg *').evaluateAll(nodes=>nodes.filter(n=>['rect','path','text','line'].includes(n.localName)).every(n=>{const s=getComputedStyle(n);return [s.fill,s.stroke].every(c=>['none','rgb(0, 0, 0)','rgb(255, 255, 255)'].includes(c));})),'Swimlane shapes, text and connectors are black and white');
 const whole=await page.evaluate(()=>window.SystemSwimlaneGeometry);
 for(const key of ['prepare-requester','balance']){
  const entry=whole.routes.find(r=>r.to===key).points.at(-1);
  for(const r of whole.routes.filter(r=>r.from===key))assert(Math.hypot(entry[0]-r.points[0][0],entry[1]-r.points[0][1])>=60,key+' has separated entry and exit ports');
 }
 const circuitPreparation=whole.routes.find(r=>r.from==='prepare-circuit'&&r.to==='prepare-join');
 assert.equal(circuitPreparation.points[0][0],whole.nodes['prepare-circuit'].x,'Circuit preparation exits the left edge');
 for(const [from,to]of [['admin','faculty-handoff'],['faculty-handoff','classrep-receive'],['classrep-receive','classrep-login']])assert(whole.routes.some(r=>r.from===from&&r.to===to),'Explicit account hand-off: '+from+' → '+to);
 assert.equal(whole.nodes['classrep-receive'].lane,0);
 assert.equal(whole.nodes['classrep-login'].lane,0);
 for(const [key,n] of Object.entries(whole.nodes)){
  assert(n.x>=whole.laneBounds[n.lane]&&n.x+n.w<=whole.laneBounds[n.lane+1],key+' stays inside the responsible lane');
  assert(n.y>=130&&n.y+n.h<whole.height,key+' stays below lane headings and inside portrait artwork');
 }
 for(const route of whole.routes){
  const finalA=route.points.at(-2),finalB=route.points.at(-1);
  assert(Math.hypot(finalB[0]-finalA[0],finalB[1]-finalA[1])>=30,route.from+' → '+route.to+' keeps a visible shaft before its arrowhead');
  route.points.slice(1).forEach((b,i)=>{
   const a=route.points[i];assert(a[0]===b[0]||a[1]===b[1],'Orthogonal whole-system flow');
   for(const [key,n] of Object.entries(whole.nodes)){
    if(key===route.from||key===route.to)continue;
    const cross=a[0]===b[0]?a[0]>n.x&&a[0]<n.x+n.w&&Math.max(a[1],b[1])>n.y&&Math.min(a[1],b[1])<n.y+n.h:a[1]>n.y&&a[1]<n.y+n.h&&Math.max(a[0],b[0])>n.x&&Math.min(a[0],b[0])<n.x+n.w;
    assert(!cross,route.from+' → '+route.to+' crosses '+key);
   }
  });
 }
 for(const [key,n] of Object.entries(whole.nodes)){
  const incoming=whole.routes.filter(r=>r.to===key),outgoing=whole.routes.filter(r=>r.from===key);
  if(n.kind==='decision'){assert.equal(incoming.length,1,key+' decision has one input');assert.equal(outgoing.length,2,key+' has two guarded alternatives');assert(outgoing.every(r=>r.guard),key+' guard labels');}
  if(n.kind==='fork'){assert.equal(incoming.length,1);assert.equal(outgoing.length,2);}
   if(n.kind==='join'){assert.equal(incoming.length,2);assert.equal(outgoing.length,1);}
  if(n.kind==='merge'||n.kind==='connector')assert.equal(outgoing.length,1,key+' merges exclusive paths');
 }
 assert(whole.routes.some(r=>r.from==='direct-dean'&&r.to==='dean-route'&&r.guard==='[Yes]'),'Out-of-schedule Class Rep goes to Dean only when Faculty is unavailable');
 assert(whole.routes.some(r=>r.from==='direct-dean'&&r.to==='review'&&r.guard==='[No]'),'Other Class Rep requests go to assigned Faculty');
 assert(!whole.nodes['off-schedule'],'No escalation decision after Faculty approval');
 assert.equal(whole.nodes.dean.lane,5,'Dean reviews in own partition');
 assert.equal(whole.nodes['dean-route'].kind,'join','Dean routing uses the requested join bar');
 assert.equal(whole.nodes['dean-route'].joinSpec,'or','Either request proceeds without waiting for both');
 assert.equal(whole.routes.filter(r=>r.to==='dean-route').length,2);
 assert.equal(await swim.locator('[data-swimlane-node="dean-route"] rect').count(),1);
 assert.equal(await swim.locator('[data-control-to="dean-route"][marker-end]').count(),2);
 assert(whole.routes.some(r=>r.from==='dean-route'&&r.to==='dean'));
 assert(whole.routes.some(r=>r.from==='dean'&&r.to==='dean-approved'));
 assert.equal(whole.nodes.approved.kind,'join','Approval alternatives meet only at a visible join');
 assert.equal(whole.nodes.approved.joinSpec,'or');
 assert.equal(whole.nodes['approval-ready'].joinSpec,'or');
 const scheduledYes=whole.routes.find(r=>r.from==='faculty-scheduled'&&r.to==='approved');
 assert(Math.max(...scheduledYes.points.map(p=>p[1]))<whole.nodes['dean-rejected'].y,'On-schedule bypass ends above the lower rejection route');
 for(const [from,to] of [['faculty-request','faculty-scheduled'],['review','faculty-approved'],['faculty-approved','approved']]){
  const r=whole.routes.find(r=>r.from===from&&r.to===to);
  assert(Math.hypot(r.points[1][0]-r.points[0][0],r.points[1][1]-r.points[0][1])>=48,from+' has a visible arrow shaft');
 }
 assert.equal(await swim.locator('[data-swimlane-node="approved"] rect').count(),1,'Visible bar makes convergence explicit');
 assert.equal(await swim.locator('[data-control-to="approved"][marker-end]').count(),2,'Each decision has its own arrowhead');
 const offNo=whole.routes.find(r=>r.from==='faculty-approved'&&r.to==='approved');
 assert.equal(scheduledYes.guard,'[Yes]');assert.equal(offNo.guard,'[Yes]');
 for(let i=1;i<scheduledYes.points.length;i++)for(let j=1;j<offNo.points.length;j++){
  const a=scheduledYes.points[i-1],b=scheduledYes.points[i],c=offNo.points[j-1],d=offNo.points[j];
  const vertical=a[0]===b[0]&&c[0]===d[0]&&a[0]===c[0];
  const horizontal=a[1]===b[1]&&c[1]===d[1]&&a[1]===c[1];
  if(vertical||horizontal){const k=vertical?1:0;assert(Math.min(Math.max(a[k],b[k]),Math.max(c[k],d[k]))<=Math.max(Math.min(a[k],b[k]),Math.min(c[k],d[k])),'Yes and No do not share an arrow segment');}
 }
 assert.equal(whole.routes.filter(r=>r.to==='approved').length,2,'On-schedule approval paths retain their short upper convergence');
 assert.equal(whole.routes.filter(r=>r.to==='approval-ready').length,2,'Dean approval meets the approved flow below the decision');
 const deanYes=whole.routes.find(r=>r.from==='dean-approved'&&r.to==='approval-ready');
 assert(deanYes,'Dean Yes route preserved');
 deanYes.points.slice(1).forEach((p,i)=>assert(p[1]>=deanYes.points[i][1],'Dean Yes never routes upward'));
 assert.equal(whole.nodes['dean-approved'].lane,5,'Dean decision stays in own partition');
 assert(!whole.nodes['requester-ready'],'Requester diamond removed');
 assert.equal(whole.nodes['prepare-join'].joinSpec,'or');
 assert(whole.routes.some(r=>r.from==='requester-prepared'&&r.to==='lab'),'Requester preparation precedes staff selection');
 assert.equal(whole.nodes.returns.kind,'join');
 assert.equal(whole.nodes.returns.joinSpec,'or','Only the selected laboratory return path is required');
 assert.equal(whole.nodes['request-ready'].kind,'join','Optional Q&A paths enter a join bar');
 assert.equal(whole.nodes['request-ready'].joinSpec,'or');
 assert.equal(whole.nodes['type-merge'].kind,'join','Reservation Type alternatives enter the requested join bar');
 assert.equal(whole.nodes['type-merge'].joinSpec,'or');
 assert.equal(whole.nodes.question.kind,'decision','Need Q&A remains a decision');
 assert.equal(whole.nodes.ready.kind,'join');assert.equal(whole.nodes.ready.joinSpec,'or');
 assert.equal(whole.nodes.clearance.lane,4,'Head Lab identifies the student and creates clearance');
 assert.equal(whole.nodes['clearance-view'].lane,0,'Class Rep only receives the status view');
 assert(whole.routes.some(r=>r.from==='clearance'&&r.to==='clearance-view'),'Head-created clearance leads to Class Rep status view');
 assert(whole.nodes['admin-tasks'].y-(whole.nodes.admin.y+whole.nodes.admin.h)>=45,'Head Lab actions have visible separation');
 for(const [id,vertical] of [['ready',false],['dean-route',true],['prepare-join',false],['returns',false],['approved',false],['approval-ready',false],['request-ready',false],['type-merge',false]]){
  const n=whole.nodes[id],incoming=whole.routes.filter(r=>r.to===id),ports=incoming.map(r=>r.points.at(-1));
  assert.equal(n.h>n.w,vertical,id+' bar orientation');
  ports.forEach(([x,y])=>assert(Math.abs(vertical?x-n.x:y-n.y)<1e-6,id+' inputs enter the same broad face'));
  for(const route of incoming){const a=route.points.at(-2),b=route.points.at(-1);assert(vertical?a[1]===b[1]&&a[0]<b[0]:a[0]===b[0]&&a[1]<b[1],id+' arrow approaches perpendicular to the bar');}
  const offsets=ports.map(p=>p[vertical?1:0]).sort((a,b)=>a-b);
  offsets.slice(1).forEach((v,i)=>assert(v-offsets[i]>=80,id+' input ports have visible spacing'));
 }
 assert(await swim.locator('[data-uml-kind="action"] rect').evaluateAll(ns=>ns.every(n=>Number(n.getAttribute('rx'))===Number(n.getAttribute('height'))/2)),'Capsule activity shapes match requested sample');
 assert.deepEqual(whole.routes.filter(r=>r.to==='prepare-join').map(r=>r.name).sort(),['Circuit','Physics']);
 assert(!whole.nodes['staff-ready'],'Staff preparation diamond removed');
 assert(whole.routes.some(r=>r.from==='prepare-physics'&&r.to==='prepare-join'),'Physics preparation connects directly to join');
 const reached=new Set(['start']),ended=new Set(Object.entries(whole.nodes).filter(([,n])=>['final','flow-final'].includes(n.kind)).map(([key])=>key));
 for(let i=0;i<Object.keys(whole.nodes).length;i++)for(const r of whole.routes){if(reached.has(r.from))reached.add(r.to);if(ended.has(r.to))ended.add(r.from);}
 assert.deepEqual([...reached].sort(),Object.keys(whole.nodes).sort(),'Every separate task is reachable from sign-in');
 assert.deepEqual([...ended].sort(),Object.keys(whole.nodes).sort(),'Every branch can reach an outcome');
 const overflow=await swim.locator('[data-swimlane-node]').evaluateAll(groups=>groups.filter(g=>{
  if(!g.querySelector('text'))return false;
  const box=g.querySelector('.flow-shape').getBBox(),t=g.querySelector('text').getBBox();
  return t.x<box.x+4||t.y<box.y+4||t.x+t.width>box.x+box.width-4||t.y+t.height>box.y+box.height-4;
 }).map(g=>g.dataset.swimlaneNode));
 assert.deepEqual(overflow,[],'Every task label stays inside its own shape');
 for(const id of ['activity-system']){
  assert.equal(await page.locator('#'+id+' svg').count(),1,'One complete SVG per overview');
  const covered=await page.locator('#'+id+' [data-process]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.process))].sort());
  assert.deepEqual(covered,['p1','p2','p3','p4','p5']);
 }
 const problems=await page.evaluate(()=>{
  const out=[];
  document.querySelectorAll('.sheet').forEach(sheet=>{
   if(sheet.scrollHeight>sheet.clientHeight+1)out.push([sheet.id,'sheet overflow']);
   const svg=sheet.querySelector('svg');
   const view=svg.viewBox.baseVal;
   for(const group of svg.querySelectorAll('g[data-uml-kind="action"]')){
    const shape=group.querySelector('rect').getBBox();
    for(const t of group.querySelectorAll('text')){const b=t.getBBox();if(b.x<shape.x+3||b.x+b.width>shape.x+shape.width-3||b.y<shape.y+3||b.y+b.height>shape.y+shape.height-3)out.push([sheet.id,'text outside action',t.textContent]);}
   }
   for(const text of svg.querySelectorAll('text')){const b=text.getBBox();if(b.x<0||b.y<0||b.x+b.width>view.width+.5||b.y+b.height>view.height+.5)out.push([sheet.id,'text outside',text.textContent,b.x,b.y,b.width,b.height]);}
   if(Number(svg.dataset.bottom)>675)out.push([sheet.id,'sequence too tall',svg.dataset.bottom]);
   {
    const texts=[...svg.querySelectorAll('text')];
    for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
     const a=texts[i].getBBox(),b=texts[j].getBBox();
     if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>2)out.push([sheet.id,'overlapping labels',texts[i].textContent,texts[j].textContent]);
    }
   }
  });return out;
 });
 console.log('Geometry issues:',JSON.stringify(problems));assert.deepEqual(problems,[]);
 await page.locator('a[href="#deployment"]').click();assert.equal(new URL(page.url()).hash,'#deployment');
 for(const model of l2){await page.locator('.section-nav a[href="#activity-'+model.id+'"]').click();assert.equal(new URL(page.url()).hash,'#activity-'+model.id);}
 await page.setViewportSize({width:390,height:844});assert(await page.locator('.section-nav').isVisible());
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Page-level mobile overflow');
 await page.setViewportSize({width:1440,height:1000});
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.process-reference:visible').count(),0,'Notes and links are excluded from A4 output');
 await page.emulateMedia({media:null});
 if(process.argv.includes('--render')){
  async function exportDiagram(locator,name){
   const output=await locator.evaluate(async source=>{
    const copy=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
    const properties=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style','text-anchor','opacity'];
    clones.forEach((node,i)=>{const style=getComputedStyle(originals[i]);for(const property of properties)node.style.setProperty(property,style.getPropertyValue(property));});
    const width=2400,height=Math.round(width*source.viewBox.baseVal.height/source.viewBox.baseVal.width);
    copy.setAttribute('width',width);copy.setAttribute('height',height);copy.style.removeProperty('width');copy.style.removeProperty('height');
    const svg=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);return{svg,png:canvas.toDataURL('image/png').split(',')[1]};}finally{URL.revokeObjectURL(url);}
   });
   fs.writeFileSync(path.join(root,'assets/system-diagrams/'+name+'.svg'),output.svg);
   fs.writeFileSync(path.join(root,'assets/system-diagrams/'+name+'.png'),Buffer.from(output.png,'base64'));
  }
  await page.pdf({path:path.join(root,'assets/system-diagrams/diagrams.pdf'),preferCSSPageSize:true,printBackground:true});
  const pdf=fs.readFileSync(path.join(root,'assets/system-diagrams/diagrams.pdf')).toString('latin1');assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,7+sequences.length);
  const pageBoxes=[...pdf.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  assert.equal(pageBoxes.filter(([w,h])=>Math.abs(w-595.28)<1&&Math.abs(h-841.89)<1).length,7+sequences.length,'All diagrams are A4 portrait');
  assert.equal(pageBoxes.filter(([w,h])=>Math.abs(w-841.89)<1&&Math.abs(h-595.28)<1).length,0,'No landscape pages remain');
  await page.pdf({path:path.join(root,'assets/system-diagrams/swimlane-system.pdf'),preferCSSPageSize:true,printBackground:true,pageRanges:'1'});
  const swimPdf=fs.readFileSync(path.join(root,'assets/system-diagrams/swimlane-system.pdf')).toString('latin1');
  assert.equal((swimPdf.match(/\/Type \/Page\b/g)||[]).length,1,'Standalone Swimlane PDF is one page');
  await page.setViewportSize({width:1440,height:1600});
  for(const model of l2){
   const section=page.locator('#activity-'+model.id),svg=section.locator('svg');
   await section.evaluate(n=>window.scrollTo({top:n.getBoundingClientRect().top+window.scrollY-120,behavior:'instant'}));
   await section.screenshot({path:path.join(root,'assets/system-diagrams/preview-activity-'+model.id+'.png')});
   await exportDiagram(svg,'activity-'+model.id);
  }
  await page.locator('#activity-system').screenshot({path:path.join(root,'assets/system-diagrams/preview-activity.png')});
  await exportDiagram(page.locator('#activity-system svg'),'swimlane-system');
  if(!process.argv.includes('--activities-only')){
   await page.locator('#activity-system').screenshot({path:path.join(root,'assets/system-diagrams/preview-activity.png')});
   const swimlane=page.locator('#activity-system svg');
   await exportDiagram(swimlane,'swimlane-system');
   for(const [i,sequence]of sequences.entries()){
    await exportDiagram(page.locator('#sequence-'+sequence.id+' svg'),'sequence-'+sequence.id);
    const pdfPath=path.join(root,'assets/system-diagrams/sequence-'+sequence.id+'.pdf');
    await page.pdf({path:pdfPath,preferCSSPageSize:true,printBackground:true,pageRanges:String(7+i)});
    assert.equal((fs.readFileSync(pdfPath).toString('latin1').match(/\/Type \/Page\b/g)||[]).length,1,'One sequence per PDF');
   }
   await page.pdf({path:path.join(root,'assets/system-diagrams/sequences.pdf'),preferCSSPageSize:true,printBackground:true,pageRanges:'7-'+(6+sequences.length)});
   assert.equal((fs.readFileSync(path.join(root,'assets/system-diagrams/sequences.pdf')).toString('latin1').match(/\/Type \/Page\b/g)||[]).length,sequences.length);
    await page.locator('#sequence-p2').screenshot({path:path.join(root,'assets/system-diagrams/preview-sequence.png')});
   await exportDiagram(page.locator('#deployment-view svg'),'deployment');
   await page.pdf({path:path.join(root,'assets/system-diagrams/deployment.pdf'),preferCSSPageSize:true,printBackground:true,pageRanges:'12'});
   await page.locator('#deployment-view').screenshot({path:path.join(root,'assets/system-diagrams/preview-deployment.png')});
  }
 }
 console.log('PASS: five activities, overall Swimlane, '+sequences.length+' major-process sequences and deployment; '+(7+sequences.length)+' portrait A4 pages.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
