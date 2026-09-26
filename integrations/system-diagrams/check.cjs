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
// Class Rep on-schedule goes to Faculty; out-of-schedule goes to available
// Faculty, or directly to Dean only when the assigned Faculty is unavailable;
// Faculty on-schedule → regular schedule; Faculty out-of-schedule → Dean.
const p2Activity=read('assets/system-diagrams/process-activities.js');
assert.match(p2Activity,/decision\('approval-requester',\d+,\d+,'Class Rep\.\?'/);
assert.match(p2Activity,/decision\('classrep-schedule',\d+,\d+,'On-schedule\?'/);
assert.match(p2Activity,/decision\('faculty-available',\d+,\d+,'Faculty\\navailable\?'/);
assert.match(p2Activity,/approvalJoin\('faculty-merge',\d+,\d+\)/);
assert.match(p2Activity,/action\('classrep-faculty-review',\d+,\d+,'Faculty: review\\nApprove or Reject'/);
assert.match(p2Activity,/action\('classrep-final',\d+,\d+,'Save final\\nApproved \/ Rejected'/);
assert.match(p2Activity,/decision\('faculty-schedule',\d+,\d+,'On-schedule\?'/);
assert.match(p2Activity,/action\('faculty-regular',\d+,\d+,'Confirm Approved;\\nno academic approval'/);
assert.match(p2Activity,/approvalJoin\('dean-merge',\d+,\d+\)/);
assert.match(p2Activity,/action\('dean-review',\d+,\d+,'Dean: final\\nApprove or Reject'/);
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
  assert(geometry.routes.every(r=>!r.guard||!/[\[\]]/.test(r.displayGuard)),'Displayed activity guards omit brackets: '+model.id);
  const finalKeys={p1:'account-end',p2:'other-end',p3:'end',p4:'other-end',p5:'report-end'};
  assert.deepEqual(Object.entries(geometry.nodes).filter(([,n])=>n.kind==='final').map(([k])=>k),[finalKeys[model.id]],'One retained lower Activity Final under the adviser convention');
  assert(Object.values(geometry.nodes).some(n=>n.kind==='flow-final'),'Branch endings use Flow Final');
  assert.equal(await section.locator('svg').getAttribute('viewBox'),model.id==='p2'?'0 0 1800 2550':model.id==='p4'?'0 0 1200 2300':'0 0 1200 1697','Portrait activity artwork');
  if(model.id==='p4'){
   const route=(from,guard)=>geometry.routes.find(r=>r.from===from&&r.guard===guard)?.to;
   assert.equal(route('forecast-choice','[Yes: Head Lab]'),'forecast-input');
   assert.equal(route('forecast-valid','[Yes]'),'forecast-estimate');
   assert.equal(route('forecast-valid','[No]'),'forecast-unavailable');
   assert.equal(route('forecast-show',null),'forecast-review');
   assert.equal(geometry.nodes['forecast-end'].kind,'flow-final');
   assert.equal(geometry.nodes['other-end'].kind,'final');
  }
  if(['p4','p5'].includes(model.id)){
   const rows=model.id==='p4'?['inventory','issue','return','disposal']:['schedule','logs','clearance'];
   const route=(from,guard)=>geometry.routes.find(r=>r.from===from&&r.guard===guard)?.to;
   for(const key of rows){
    assert.equal(route(key+'-valid','[Yes]'),key+'-save','Valid branch is below: '+key);
    assert.equal(route(key+'-valid','[No]'),key+'-error','Correction branch is right: '+key);
    assert.equal(route(key+'-save',null),key+'-end','Success arrow enters Flow Final: '+key);
    assert.equal(route(key+'-error',null),key+'-end','Correction arrow enters Flow Final: '+key);
   }
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
  assert.equal(joins.filter(([,n])=>n.joinSpec==='or').length,model.id==='p2'?5:0,'P2 uses OR joins for form entries, routing and approval alternatives');
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
   if(n.kind==='join'){assert.equal(incoming.length,key==='equipment-ready'?3:2);assert.equal(outgoing.length,1);}
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
   assert(geometry.nodes['group-info'].x<geometry.nodes['individual-info'].x,'Type alternatives have separate columns');
   assert(geometry.nodes['group-info'].y<geometry.nodes['individual-info'].y,'Group confirmation is above Student Only selection');
   const facultyRoute=geometry.routes.find(r=>r.from==='request-role'&&r.guard==='[No: Faculty]');
   const incomingRole=geometry.routes.find(r=>r.to==='request-role');
   assert(facultyRoute.points[0][0]<geometry.nodes['request-role'].x+geometry.nodes['request-role'].w/2&&
    facultyRoute.points[0][1]>incomingRole.points.at(-1)[1],
    'Faculty bypass leaves the lower-left edge, below the incoming request arrow');
   assert(facultyRoute.points[2][1]-incomingRole.points.at(-1)[1]>=60,
    'Faculty line has its own lower horizontal corridor');
   const classRepRoute=geometry.routes.find(r=>r.from==='request-role'&&r.to==='select-type');
   assert.equal(classRepRoute.points.length,2,'Class Rep. arrow goes straight down to Reservation Type selection');
   assert.equal(classRepRoute.points[0][0],classRepRoute.points[1][0]);
   assert.equal(classRepRoute.points[0][1],geometry.nodes['request-role'].y+geometry.nodes['request-role'].h);
   assert.deepEqual(geometry.routes.filter(r=>r.to==='type-merge').map(r=>r.points.at(-1)[0]).sort((a,b)=>a-b),[1040,1280],
    'Group and Student Only have separate entry arrows into the Class Representative OR Join');
   assert.equal(facultyRoute.to,'faculty-activity');
   assert.equal(route('faculty-activity','[Laboratory Activity]'),'equipment-ready');
   assert.equal(route('faculty-activity','[Non-Laboratory Activity]'),'faculty-request-options');
   assert.equal(route('faculty-request-options',null),'equipment-ready');
   assert.equal(route('request-room',null),'equipment-ready');
   assert.equal(route('equipment-ready',null),'request-items');
   assert.equal(route('type-merge',null),'request-schedule-type','Type alternatives join before Schedule Type');
   const form=['request-input','select-type','request-schedule-type','request-room','request-items','request-review'];
   for(const [i,key] of form.slice(0,4).entries())assert(geometry.nodes[key].title.startsWith(String(i+1)+' '),'Class Representative numbered form steps');
   assert.match(geometry.nodes['request-items'].title,/^Equipment \/ Materials/);assert.match(geometry.nodes['request-review'].title,/^Review Information/);
   assert.equal(route('request-review',null),'request-valid','Final Submit precedes validation and saving');
   assert.equal(route('request-valid','[Yes]'),'request-save');assert.equal(route('request-valid','[No]'),'request-error');
   assert.equal(route('request-save',null),'request-confirm','Saved status and reviewer are returned after saving');
   assert.match(geometry.nodes['request-confirm'].title,/Current Reviewer/);
   assert.deepEqual(['request-choice','status-choice','approval-choice','clearance-choice'].map(k=>geometry.nodes[k].title.replace(/\n/g,' ')),['Submit Form?','View Status?','Routed Reviewer?','View Clearance?']);
   assert.equal(route('status-action','[Edit / reschedule]'),'edit-valid');assert.equal(route('edit-valid','[Eligible edit]'),'form-ready');
   assert.equal(route('status-action','[Cancel request]'),'cancel-check');assert.equal(route('cancel-valid','[Eligible]'),'cancel-save');
   assert.equal(route('clearance-role','[Class Representative]'),'clearance-view');assert.equal(geometry.nodes['clearance-view'].processReference,'p5.3');
   assert.equal(route('approval-requester','[Yes: Class Rep.]'),'classrep-schedule','Requester type is checked before applying Class Rep rules');
   assert.equal(route('approval-requester','[No: Faculty]'),'faculty-schedule','Requester type is checked before applying Faculty rules');
   assert.equal(route('classrep-schedule','[Yes]'),'faculty-merge','On-schedule Class Rep requests go to Faculty');
   assert.equal(route('classrep-schedule','[No]'),'faculty-available','Out-of-schedule Class Rep requests first check Faculty availability');
   assert.equal(route('faculty-available','[Yes]'),'faculty-merge','Available Faculty reviews the Class Rep out-of-schedule request');
   assert.equal(route('faculty-available','[No]'),'dean-merge','Only an unavailable Faculty permits direct Dean review');
   assert.equal(route('faculty-merge',null),'classrep-faculty-review','Faculty review follows either eligible Class Rep route');
   assert.equal(route('classrep-faculty-review',null),'classrep-final','Available Faculty makes the final decision');
   assert.equal(route('faculty-schedule','[Yes]'),'faculty-regular','Regular Faculty class schedules need no approval');
   assert.equal(route('faculty-schedule','[No]'),'dean-merge','Only out-of-schedule Faculty requests go to Dean');
   assert.equal(route('dean-merge',null),'dean-review','Dean reviews both eligible routes');
   const deanFinal=geometry.routes.find(r=>r.from==='dean-final').points;
   assert.equal(deanFinal.length,2,'Dean final arrow is straight into its Flow Final');assert.equal(deanFinal[0][0],deanFinal[1][0]);
   assert.equal(geometry.routes.find(r=>r.from==='faculty-available'&&r.guard==='[No]').points[1][0],850,'Unavailable route stays clear of clearance endpoints');
   assert.match(geometry.nodes['classrep-final'].title,/Save final\nApproved \/ Rejected/);
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
  assert(geometry.routes.every(r=>r.points.at(-1)[1]>=r.points[0][1]||(model.id==='p2'&&r.to==='form-ready')),'Top-to-bottom control flow, except the explicit eligible-edit/form-entry loop');
  const reachesEnd=new Set(Object.entries(geometry.nodes).filter(([,n])=>['final','flow-final'].includes(n.kind)).map(([key])=>key));for(let i=0;i<Object.keys(geometry.nodes).length;i++)for(const r of geometry.routes)if(reachesEnd.has(r.to))reachesEnd.add(r.from);
  assert.deepEqual([...reachesEnd].sort(),Object.keys(geometry.nodes).sort(),'All branches reach an Activity or Flow Final: '+model.id);
 }
 const dep=page.locator('#deployment-view svg'),deploymentText=await dep.locator('tspan').allTextContents().then(rows=>rows.join(' ').replace(/\s+/g,' ').trim());
 assert.deepEqual(await dep.locator('[data-node]').evaluateAll(ns=>ns.map(n=>n.dataset.node).sort()),['ai-services','application','classrep','clients','database','dean','faculty','head','staff']);
 assert.equal(await dep.getAttribute('viewBox'),'0 0 1200 1697');
 assert.equal(await dep.locator('[data-store]').count(),l1.stores.length);
 assert.equal(await dep.locator('[data-device-icon="desktop"]').count(),5);
 assert.equal(await dep.locator('[data-device-icon="mobile"]').count(),5);
 assert(!/All roles:|One application and one database|AI runs in the backend/.test(deploymentText));
 for(const term of ['Desktop','Mobile','Class Representative','Faculty','Dean','Circuit Staff','Physics Staff','Head Lab','Web Browser','Next.js','React','TypeScript','Tailwind CSS','Node.js','PostgreSQL','HTTPS','TLS','AI Chatbot','Inventory Forecasting','RAG','XGBoost','n8n','Model: Gemini 3.5 Flash-Lite','Google Gemini API (Free Tier)'])assert(deploymentText.includes(term),'Deployment missing '+term);
 for(const store of l1.stores)assert(deploymentText.includes(store.number+' — '+store.name),'Deployment missing store '+store.id);
 assert(!/Email infrastructure|Protocol TBD|Not yet selected|SOMADA|\.html/i.test(deploymentText));
 assert.deepEqual(await dep.locator('[data-connection]').evaluateAll(ns=>ns.map(n=>n.dataset.connection).sort()),['application-ai','application-database','clients-application']);
 assert.equal(await dep.locator('[data-component]').count(),9,'Application service components');
 assert.deepEqual(await dep.locator('[data-environment]').evaluateAll(ns=>ns.map(n=>n.dataset.environment).sort()),['ai-runtime','browser','node-runtime','postgresql']);
 assert.deepEqual(await page.locator('#activity-system [data-lane-name]').evaluateAll(ns=>ns.map(n=>n.dataset.laneName)),['Class Representative','Faculty','Circuit Staff','Physics Staff','Head Lab','Dean'],'Six distinct actor partitions');
 // The focused Swimlane regression is shared by full-publication QA.
 // It validates ownership, both role forms, approval routing, all geometry and
 // requester status outcomes without relying on obsolete node counts.
 await new Promise((resolve,reject)=>require('node:child_process').execFile(process.execPath,[path.join(__dirname,'check-swimlane.cjs')],{env:process.env,timeout:120000},(error,stdout,stderr)=>{if(error)reject(new Error(stdout+stderr));else{console.log(stdout.trim());resolve();}}));
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
  assert.equal((swimPdf.match(/\/Type \/Page\b/g)||[]).length,1,'Standalone Swimlane PDF has one page');
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
