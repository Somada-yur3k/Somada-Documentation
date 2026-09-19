// Reproducible design audit. Reads local sources; never signs in or syncs Google Docs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),http=require('node:http');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const L1='assets/figures-v2/dfd-level1/dfd-level1-model.json',L2='assets/figures-v2/dfd-level2-compact/dfd-level2-model.json';
const UC='assets/figures-v2/usecase-diagram-source.html',L0='assets/figures-v2/dfd-level0/dfd-level0-source.html';
const sorted=a=>[...new Set(a)].sort(),same=(a,b)=>JSON.stringify(sorted(a))===JSON.stringify(sorted(b));
const roles={classrep:'Class Representative',faculty:'Faculty',dean:'Dean',headlab:'Head Laboratory',physics:'Physics Laboratory Staff',circuits:'Circuits Laboratory Staff'};
// Explicit design mappings, not a name-similarity score. Each row declares required child exchanges.
const mapping={
 login:{steps:['p1.1','p1.2'],backlog:['01'],exchange:[['in','Credentials','p1.1']]},
 issueacct:{steps:['p1.3'],backlog:['02'],exchange:[['in','Account Management Details','p1.3']]},
 chooselab:{steps:['p2.1'],backlog:['03'],exchange:[['out','Schedule & Availability','p2.1']],note:'Laboratory choice is a UI filter carried into the schedule/request, not a separate persisted record.'},
 viewsched:{steps:['p2.1'],backlog:['03'],exchange:[['out','Schedule & Availability','p2.1']]},
 submitscheduled:{steps:['p2.2'],backlog:['04A'],exchange:[['in','Scheduled Laboratory Activity','p2.2']]},
 submitcombined:{steps:['p2.2','p2.3'],backlog:['04B','04C'],exchange:[['in','Out-of-Schedule Request','p2.2']]},
 cancelres:{steps:['p2.2','p2.4'],backlog:['05'],exchange:[['in','Reservation Change Request','p2.2']]},
 reschedres:{steps:['p2.2','p2.4'],backlog:['05'],exchange:[['in','Reservation Change Request','p2.2']]},
 viewstatus:{steps:['p2.4'],backlog:['08'],exchange:[['out','Reservation Status','p2.4']]},
 viewhistory:{steps:['p2.4'],backlog:['08'],exchange:[['out','Reservation History','p2.4']]},
 clearstatus:{steps:['p5.3'],backlog:['08'],exchange:[['out','Clearance Status','p5.3']]},
 approve:{steps:['p2.3'],backlog:['06','07'],exchange:[['in','Approval Decision','p2.3'],['out','Routed Approval Request','p2.3']]},
 askq:{steps:['p3.1','p3.2','p3.3','p3.4'],backlog:['09'],exchange:[['in','Inquiry','p3.1'],['out','Answer','p3.3']]},
 mgminv:{steps:['p4.1'],backlog:['10'],exchange:[['in','Inventory Update','p4.1']]},
 issueeq:{steps:['p4.2','p4.3'],backlog:['11'],exchange:[['in','Equipment Transaction','p4.3']]},
 procret:{steps:['p4.4'],backlog:['11','12'],exchange:[['in','Equipment Transaction','p4.4']]},
 procclear:{steps:['p5.3'],backlog:['13'],exchange:[['in','Clearance Action','p5.3']]},
 wastedisp:{steps:['p4.5'],backlog:['14'],exchange:[['in','Disposal Entry','p4.5']]},
 mgmlogs:{steps:['p5.1','p5.2'],backlog:['15'],exchange:[['in','Schedule Update','p5.1'],['in','Usage Entry','p5.2'],['in','Daily Task Entry','p5.2']]},
 endterm:{steps:['p5.4','p5.5'],backlog:['17'],exchange:[['in','Report Request','p5.5'],['out','End-Term Report','p5.5']]}
};
const findings=[
 ['fixed','RES-01','Required Reservation Type','Class Representatives must choose Group or Student Only for both schedule variants. Table 7, events, backlog, form preview, Use Case, DFD 0–2, ERD, Activity 2, Sequence 05 and Swimlane now carry the same requirement. Student Only uses the signed-in representative. Production reservation persistence remains an implementation task; the repository contains a documentation/UI preview.','Reservation-Form.html'],
 ['pending','POL-08','Dean account provisioning','Head Laboratory is confirmed to create Class Representative and Faculty accounts. Dean retains a pre-assigned account; who provisions it is still awaiting confirmation. No Dean-creation permission is inferred.','Docs.html#uc-issueacct'],
 ['fixed','L2-01','Approval and availability reads','Added D2 reads to 2.1 (active holds) and 2.3 (the stored pending request).','Docs.html#uc-viewsched'],
 ['fixed','L2-02','Return transaction inputs','Added separate Head Laboratory, Physics Staff and Circuits Staff inputs to 4.4; previously they reached issuance only.','assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process=p4'],
 ['fixed','L2-03','Live stock at issuance','Added D4 → 4.3 to verify stock before releasing items.','Docs.html#uc-issueeq'],
 ['fixed','L2-04','Borrower evidence for clearance','Added D5 → 5.3. Renamed the matching L1/L2 exchange to Borrowing Slip Data: clearance needs student and return details, not only aggregate totals.','Docs.html#uc-procclear'],
 ['fixed','DOC-01','Login backlog coverage','Backlog 01 now covers all six diagram actors, not just the two requester roles.','Docs.html#backlog'],
 ['fixed','DOC-02','Reschedule validation','Revalidate role, schedule category and resources; an old approval must not authorize a different request category.','Docs.html#uc-reschedres'],
 ['fixed','DOC-03','Disposal accounting','Only physically present items/waste are disposed of; never deduct already-written-off quantities twice. BLC logs are views of source records, not an undeclared extra DFD store.','Docs.html#uc-wastedisp'],
 ['fixed','DOC-04','Lab End-Term Report clarified','Three summary tables plus Recent Activity, separately for Physics and Circuits. Item-use ratios and distinct-session frequency percentages are non-AI. Removed D7/D10 reporting reads and the clearance-to-metrics flow; other record-management features remain.','Docs.html#uc-endterm'],
 ['fixed','PUB-01','Current model publication','Corrected the Home flow count to 74 and removed the legacy ERD image/reference from the current paper. Archived source files are retained.','Docs.html#erd'],
 ['fixed','DOC-05','Document reference cleanup','Corrected MSYADD1 spelling, removed the duplicate Figure 1 label from the methodology illustration, and clarified that gap rows are not one-to-one backlog IDs.','Docs.html#gap-analysis'],
 ['pending','ERD-01','Logical ERD draft requires consultation','A draft maps all 10 stores to 25 entities and 51 PK–FK relationships. Review the proposed revision history, partial returns, inventory ledger and cross-record constraints before approval. No schema completeness percentage is claimed.','ERD.html'],
 ['fixed','POL-01','Class Representative → Dean routing','Confirmed: on-schedule Class Representative requests require Faculty; out-of-schedule requests require Faculty then Dean. Intermediate Faculty approval retains Pending and the hold; rejection stops routing. Faculty out-of-schedule requests go directly to Dean.','Docs.html#uc-approve'],
 ['pending','POL-02','Two-day advance rule','Gap 10 requires two days; calendar/business days, cutoff time, exceptions and reschedule handling still need consultation and matching acceptance criteria.','Docs.html#gap-analysis'],
 ['pending','POL-03','Recurring reservations','Define per-session approval, cancellation, rescheduling, borrowing and completion for whole-term requests before finalizing recurrence.','Docs.html#gap-analysis'],
 ['pending','POL-04','Room-only session lifecycle','Requests can use a room without items, but Ongoing/Completed transitions currently rely on issuance/return. Confirm the responsible role and trigger for room-only sessions.','Docs.html#uc-submitres'],
 ['pending','POL-05','Completion after clearance settlement','Returns with broken/lost balances remain Ongoing, while clearance settlement only closes the clearance. Confirm who updates the borrowing/reservation and when.','Docs.html#uc-procclear'],
 ['pending','POL-06','Quantity ledger and reservation holds','Specify atomic hold/release rules and equations for existing, available, reserved and in-use stock, including partial issue, return and replacement.','Docs.html#uc-inventory'],
 ['pending','POL-07','Knowledge base ownership','Q&A assumes D8 is populated. Confirm who maintains approved operating hours/content and how updates are authorized; do not invent a new actor permission yet.','Docs.html#uc-askq']
].map(([status,id,title,detail,href])=>({status,id,title,detail,href}));

async function captureContext(){
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
 const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(p,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[path.extname(p)]||'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage();await p.goto(`http://127.0.0.1:${server.address().port}/${L0}?export=1`);await p.waitForFunction(()=>window.__done||window.__error);return await p.evaluate(()=>({flows:window.FLOWS,nodes:Object.keys(window.__level0.nodes),error:window.__error}));}
 finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
async function build(){
 const html=read('Docs.html'),diagram=read(UC);
 const data=vm.runInNewContext(html.match(/<script>\s*\/\*[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'')+'; DATA');
 const uc=vm.runInNewContext(diagram.slice(diagram.indexOf('const ACTORS ='),diagram.indexOf('const CANVAS_W'))+'; ({ACTORS,BASE_UC,SUPPORT_UC,RELATIONSHIPS})');
 const l1=JSON.parse(read(L1)),l2=JSON.parse(read(L2)),context=await captureContext();
 const checks=[];const add=(group,id,label,pass,href)=>checks.push({group,id,label,status:pass?'pass':'fail',href});
 add('documentation','inventory','No duplicate or orphaned full descriptions',same(data.useCases.map(d=>d.diagramId),uc.BASE_UC.map(u=>u.id))&&new Set(data.useCases.map(d=>d.diagramId)).size===data.useCases.length,'Docs.html#usecase-full');
 add('documentation','table-order','Full-description table numbers are consecutive',data.useCases.every((d,i)=>d.table===i+3),'Docs.html#usecase-full');
 add('usecase','support-coverage','Every supporting use case participates in a dependency',uc.SUPPORT_UC.every(u=>uc.RELATIONSHIPS.some(r=>r.from===u.id||r.to===u.id)),UC);
 const names=new Map([...uc.BASE_UC,...uc.SUPPORT_UC].map(u=>[u.id,u.label.join(' ')]));
 const features=uc.BASE_UC.map(n=>{
  const d=data.useCases.find(d=>d.diagramId===n.id),m=mapping[n.id],actors=uc.ACTORS.filter(a=>a.uses.includes(n.id)).map(a=>a.id),events=data.events.filter(e=>e.diagramId===n.id);
  const parent=m?.steps[0].split('.')[0],child=l2.find(p=>p.id===parent);
  const flows=(child?.flows||[]).filter(f=>m?.steps.includes(f.source)||m?.steps.includes(f.target));
  const matchingRoles=d&&same(d.actors.split(',').map(s=>s.trim()),actors.map(a=>roles[a]));
  const full=d&&['scenario','triggeringEvent','briefDescription','preconditions','postconditions','flowActor','flowSystem','exceptions'].every(k=>d[k]?.length);
  const eventMatch=events.length&&same(events.flatMap(e=>e.source.split(',').map(s=>s.trim())),actors.map(a=>roles[a]))&&events.every(e=>e.useCase===names.get(n.id));
  const flowMatch=m&&actors.every(actor=>m.exchange.every(([dir,label,step])=>{
   const expected=n.id==='submitcombined'&&actor==='classrep'?label+' including Reservation Type':label;
   return flows.some(f=>f.label===expected&&(dir==='in'?f.source===actor&&f.target===step:f.target===actor&&f.source===step));
  }));
  const linked=Boolean(full&&matchingRoles&&eventMatch&&flowMatch&&d.useCaseName===names.get(n.id)&&m.backlog.every(id=>data.backlog.some(b=>b.id===id)));
  add('documentation','doc-'+n.id,names.get(n.id)+' — full specification',Boolean(full&&matchingRoles&&d.useCaseName===names.get(n.id)),'Docs.html#'+(d?.id||'usecase-full'));
  add('usecase','trace-'+n.id,names.get(n.id)+' — role / event / DFD trace',linked,'Docs.html#'+(d?.id||'usecase-full'));
  return{id:n.id,name:names.get(n.id),docId:d?.id,table:d?.table,actors:actors.map(a=>roles[a]),events:events.length,backlog:m?.backlog||[],parent,steps:m?.steps||[],stores:sorted(flows.flatMap(f=>[f.source,f.target]).filter(s=>l1.stores.some(store=>store.id===s))),flowIds:flows.map(f=>f.id),status:linked?'pass':'fail',note:m?.note||''};
 });
 data.events.forEach((e,i)=>add('documentation','event-'+i,e.event,Boolean(features.some(f=>f.id===e.diagramId)&&e.useCase===names.get(e.diagramId)),'Docs.html#events'));
 data.backlog.forEach(b=>add('documentation','backlog-'+b.id,'Backlog '+b.id+' — mapped scope',features.some(f=>f.backlog.includes(b.id))||b.id==='16','Docs.html#backlog'));
 uc.RELATIONSHIPS.forEach((r,i)=>add('usecase','dependency-'+i,`${r.type}: ${names.get(r.from)} → ${names.get(r.to)}`,data.useCases.some(d=>d.dependencies.some(e=>e.type===r.type&&(e.type==='include'?d.diagramId===r.from&&e.diagramId===r.to:d.diagramId===r.to&&e.diagramId===r.from))),'Docs.html#usecase-full'));
 const entityIds=new Set(l1.entities.map(e=>e.id)),processIds=new Set(l1.processes.map(p=>p.id)),storeIds=new Set(l1.stores.map(s=>s.id));
 add('dfd1','admin-scope','Only Head Laboratory sends logs, schedule, task and clearance actions',l1.flows.filter(f=>['Schedule Update','Usage Entry','Daily Task Entry','Clearance Action'].includes(f.label)).every(f=>f.source==='headlab'),'Docs.html#uc-mgmlogs');
 const reservationFlows=['p2-cr-onschedule','p2-cr-outschedule','p2-d2-write','p2-d2-read'];
 add('dfd1','reservation-type-payload','Both Class Representative schedule variants and D2 exchanges carry Reservation Type',reservationFlows.every(id=>l1.flows.find(f=>f.id===id)?.label.includes('Reservation Type')&&l2.find(p=>p.id==='p2').flows.filter(f=>f.parentFlow===id).every(f=>f.label===l1.flows.find(row=>row.id===id).label)),'Docs.html#uc-submitres');
 add('documentation','reservation-type-validation','Table 7 and the form require an unselected Group / Student Only choice before submission',read('Docs.html').includes('No option is preselected')&&read('Reservation-Form.html').includes('name="reservation_type" value="GROUP" required')&&read('Reservation-Form.html').includes('name="reservation_type" value="STUDENT_ONLY" required'),'Reservation-Form.html');
 add('dfd1','dean-scope','Dean exchanges only login and approval data',l1.flows.filter(f=>f.source==='dean'||f.target==='dean').every(f=>['Credentials','Approval Decision','Routed Approval Request'].includes(f.label)),'Docs.html#uc-approve');
 add('dfd1','qa-scope','Q&A is requester-only and writes only its conversation log',l1.flows.filter(f=>f.source==='p3'||f.target==='p3').every(f=>f.kind==='external'?['classrep','faculty'].includes(f.source==='p3'?f.target:f.source):f.source!=='p3'||f.target==='d9'),'Docs.html#uc-askq');
 add('dfd2','parent-inventory','Exactly one decomposition for every parent',same(l1.processes.map(p=>p.id),l2.map(p=>p.id))&&new Set(l2.map(p=>p.id)).size===l2.length,'Docs.html#dfd');
 add('dfd2','unique-child-flows','Every child flow has a unique identity',new Set(l2.flatMap(m=>[...m.flows,...m.internal].map(f=>f.id))).size===l2.reduce((n,m)=>n+m.flows.length+m.internal.length,0),'Docs.html#dfd');
 add('dfd0','actors','Exactly six canonical external entities',!context.error&&same(context.nodes.filter(n=>n!=='system'),[...entityIds]),L0);
 const external=l1.flows.filter(f=>f.kind==='external');
 external.forEach(f=>add('dfd0',f.id,f.label+' — '+f.source+' → '+f.target,context.flows.filter(c=>c.id===f.id&&c.label===f.label&&c.entity===(entityIds.has(f.source)?f.source:f.target)&&c.dir===(entityIds.has(f.source)?'in':'out')).length===1,L0));
 add('dfd0','no-extra-flows','No extra context exchanges',context.flows.length===external.length,L0);
 for(const [kind,nodes]of [['entities',l1.entities],['processes',l1.processes],['stores',l1.stores]])add('dfd1',kind,'Unique '+kind,new Set(nodes.map(n=>n.id)).size===nodes.length&&new Set(nodes.map(n=>n.name.toLowerCase())).size===nodes.length,'assets/figures-v2/dfd-level1/dfd-level1-source.html');
 l1.flows.forEach(f=>add('dfd1',f.id,f.label+' — valid endpoints',Boolean(f.label&&f.source!==f.target&&((processIds.has(f.source)&&(entityIds.has(f.target)||storeIds.has(f.target)))||(processIds.has(f.target)&&(entityIds.has(f.source)||storeIds.has(f.source)))))&&l1.flows.filter(x=>x.id===f.id).length===1,'assets/figures-v2/dfd-level1/dfd-level1-source.html'));
 l1.entities.forEach(e=>add('dfd1','role-'+e.id,e.name+' — canonical use-case role',uc.ACTORS.some(a=>a.id===e.id)&&roles[e.id]===e.name,UC));
 l2.forEach(m=>{
  const parent=l1.processes.find(p=>p.id===m.id),expected=l1.flows.filter(f=>f.source===m.id||f.target===m.id),href='assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process='+m.id;
  add('dfd2',m.id+'-parent',m.id+' — named parent and complete boundary',parent?.name===m.name&&same(expected.map(f=>f.id),m.flows.map(f=>f.parentFlow)),href);
  const steps=m.steps.map((_,i)=>m.id+'.'+(i+1));
  m.flows.forEach(f=>{const p=expected.find(p=>p.id===f.parentFlow);add('dfd2',f.id,f.label+' — '+f.source+' → '+f.target,Boolean(p&&p.label===f.label&&p.source===(steps.includes(f.source)?m.id:f.source)&&p.target===(steps.includes(f.target)?m.id:f.target)),href);});
  m.internal.forEach(f=>add('dfd2',f.id,f.label+' — valid child exchange',steps.includes(f.source)&&steps.includes(f.target)&&f.source!==f.target&&Boolean(f.label),href));
 });
 const required=[['d2','p2.1'],['d2','p2.3'],['headlab','p4.4'],['physics','p4.4'],['circuits','p4.4'],['d4','p4.3'],['d5','p5.3']];
 required.forEach(([source,target])=>add('dfd2','required-'+source+'-'+target,'Required workflow input '+source+' → '+target,l2.some(m=>m.flows.some(f=>f.source===source&&f.target===target)),'Docs.html#dfd'));
 // Pending decisions are intentionally not marked as passing automated checks.
 const groups=[['documentation','Documentation','Docs.html'],['usecase','Use Case',UC],['dfd0','DFD Level 0',L0],['dfd1','DFD Level 1','assets/figures-v2/dfd-level1/dfd-level1-source.html'],['dfd2','DFD Level 2','assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html'],['erd','ERD','Docs.html#erd']].map(([id,name,href])=>{const rows=checks.filter(c=>c.group===id),passed=rows.filter(c=>c.status==='pass').length;return{id,name,href,passed,total:rows.length,percent:rows.length?Math.round(100*passed/rows.length):null,status:id==='erd'?'pending':passed===rows.length?'pass':'fail'};});
 const sourcePaths=['Docs.html',UC,L1,L2,'assets/figures-v2/dfd-level0/dfd-level0-portrait.js','assets/figures-v2/dfd-level1/dfd-level1-portrait.js','assets/figures-v2/dfd-level2-compact/dfd-level2-renderer.js','integrations/system-audit/build.cjs','assets/erd/model.js','assets/erd/render.js','Reservation-Form.html','assets/reservation-type.js','assets/system-diagrams/process-activities.js','assets/system-diagrams/sequence-models.js','assets/system-diagrams/swimlane.js'];
 groups.forEach(g=>{g.available=g.id==='erd'?fs.existsSync(path.join(root,'assets/erd/erd.pdf')):g.status!=='pending';if(g.id==='erd')g.href='ERD.html';});
 const sources=sourcePaths.map(p=>({path:p,sha256:crypto.createHash('sha256').update(read(p).replace(/\r\n/g,'\n')).digest('hex')}));
 return{version:1,generatedAt:new Date().toISOString(),title:data.meta.title,sources,groups,features,checks,findings,
  counts:{actors:uc.ACTORS.length,mainUseCases:uc.BASE_UC.length,supportingUseCases:uc.SUPPORT_UC.length,associations:uc.ACTORS.reduce((n,a)=>n+a.uses.length,0),dependencies:uc.RELATIONSHIPS.length,backlog:data.backlog.length,events:data.events.length,l0:context.flows.length,l1:l1.flows.length,stores:l1.stores.length,parents:l1.processes.length,children:l2.reduce((n,p)=>n+p.steps.length,0),l2:l2.reduce((n,p)=>n+p.flows.length,0)},
  backlog:data.backlog.map(b=>({id:b.id,status:b.status,features:features.filter(f=>f.backlog.includes(b.id)).map(f=>f.name),note:b.id==='16'?'Presentation-only dashboard: supported by inventory/reservation/log data; no standalone use case or DFD arrow, as requested.':''})),
  stores:l1.stores.map(s=>({...s,readers:l1.flows.filter(f=>f.source===s.id).map(f=>f.target),writers:l1.flows.filter(f=>f.target===s.id).map(f=>f.source),schemaStatus:'Logical draft — review pending'}))};
}
if(require.main===module)build().then(report=>{
 const target=path.join(root,'assets/system-audit.json');
 if(process.argv.includes('--write'))fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
 if(process.argv.includes('--check')){const previous=JSON.parse(fs.readFileSync(target,'utf8'));report.generatedAt=previous.generatedAt;if(JSON.stringify(previous)!==JSON.stringify(report))throw Error('Audit snapshot is stale. Run build.cjs --write.');}
 const failed=report.checks.filter(c=>c.status==='fail');console.log(JSON.stringify({counts:report.counts,groups:report.groups,failed,pending:report.findings.filter(f=>f.status==='pending').length},null,2));if(failed.length)process.exitCode=1;
}).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={build};
