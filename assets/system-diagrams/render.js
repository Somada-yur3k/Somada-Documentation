(async function(){
'use strict';
const NS='http://www.w3.org/2000/svg',W=1200,H=700;
const el=(tag,attrs={},parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.append(n);return n;};
function lines(value,max=33){const out=[];for(const part of String(value).split('\n')){let row='';for(const word of part.split(' ')){if(row&&(row+' '+word).length>max){out.push(row);row=word;}else row+=(row?' ':'')+word;}out.push(row);}return out;}
function text(parent,x,y,value,opts={}){
 const rows=lines(value,opts.max||33),font=opts.font||19,step=font*1.13;
 const t=el('text',{x,y,'text-anchor':opts.anchor||'middle','font-size':font,'font-weight':opts.bold?'700':'400',class:opts.class||''},parent);
 rows.forEach((r,i)=>{const s=el('tspan',{x,y:y+(i-(rows.length-1)/2)*step},t);s.textContent=r;});return t;
}
function svg(title,id){const s=el('svg',{xmlns:NS,viewBox:`0 0 ${W} ${H}`,role:'img','aria-labelledby':id+'-title'});el('title',{id:id+'-title'},s).textContent=title;
 const defs=el('defs',{},s);
 for(const [name,filled]of [['filled',true],['open',false]]){const marker=el('marker',{id:id+'-'+name,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs);el('path',{d:'M1 1 L9 5 L1 9'+(filled?' Z':''),fill:filled?'#253f58':'none',stroke:'#253f58','stroke-width':1.4},marker);}
 return s;
}
function path(s,points,id,{open=false,dashed=false,head=true}={}){return el('path',{d:points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' '),class:'line'+(dashed?' return':''),...(head?{'marker-end':`url(#${id}-${open?'open':'filled'})`}:{})},s);}
function deployment(id){
 const v=svg('Proposed deployment architecture',id);v.setAttribute('viewBox','0 0 1200 1697');
 const box=(p,x,y,w,h)=>el('rect',{x,y,width:w,height:h,fill:'#fff',stroke:'#000','stroke-width':2},p);
 function node(x,y,w,h,label,key){
  const g=el('g',{'data-node':key},v);
  el('path',{d:'M'+x+' '+y+' l14 -14 h'+w+' v'+h+' l-14 14 M'+(x+w)+' '+y+' l14 -14',fill:'#fff',stroke:'#000','stroke-width':2},g);
  box(g,x,y,w,h);text(g,x+w/2,y+34,label,{font:key==='staff'?19:22,bold:true,max:key==='staff'?30:45});return g;
 }
 function artifact(p,x,y,w,h){
  el('path',{d:'M'+x+' '+y+' H'+(x+w-16)+' L'+(x+w)+' '+(y+16)+' V'+(y+h)+' H'+x+' Z M'+(x+w-16)+' '+y+' V'+(y+16)+' H'+(x+w),fill:'#fff',stroke:'#000','stroke-width':1.5},p);
 }
 function icon(p,x,y,phone){
  const g=el('g',{fill:'none',stroke:'#000','stroke-width':3,'data-device-icon':phone?'mobile':'desktop'},p);
  if(phone){el('rect',{x:x-13,y,width:26,height:41,rx:4},g);el('path',{d:'M'+(x-5)+' '+(y+34)+' h10'},g);}
  else{el('rect',{x:x-28,y,width:56,height:34,rx:2},g);el('path',{d:'M'+x+' '+(y+34)+' v10 m-15 0 h30'},g);}
 }
 text(v,600,30,'Physics and Circuits Laboratory Management System',{font:28,bold:true,max:90});
 text(v,600,65,'Deployment Diagram · Proposed architecture',{font:22,max:90});
 const roles=[['classrep','Class Representative'],['faculty','Faculty'],['dean','Dean'],['staff','Circuit Staff / Physics Staff'],['head','Head Lab']];
 roles.forEach(([key,label],i)=>{
  const y=110+i*296,g=node(25,y,340,274,'«device» '+label,key);
  box(g,42,y+65,306,133);
  text(g,195,y+88,'«executionEnvironment»',{font:18,max:40});
  text(g,195,y+116,'Web Browser',{font:23,bold:true});
  artifact(g,57,y+135,276,48);
  text(g,195,y+160,'«artifact» Web interface',{font:19,max:40});
  icon(g,125,y+205,false);
  icon(g,265,y+205,true);
  text(g,125,y+265,'Desktop',{font:16});
  text(g,265,y+265,'Mobile',{font:16});
 });
 const app=node(535,290,625,470,'«device» Application Server','application');
 box(app,555,353,585,386);
 text(app,847,380,'«executionEnvironment» Node.js Runtime',{font:23,max:50});
 artifact(app,575,408,545,302);
 text(app,847,441,'«artifact» Laboratory Web Application',{font:24,bold:true,max:50});
 text(app,847,480,'Next.js · React · TypeScript',{font:24,max:45});
 text(app,847,580,'Authentication / roles / account management\nReservations / approvals / schedules\nInventory / borrowing / returns\nClearance / tasks / disposal / reports\nAI Chatbot / Inventory Forecasting',{font:22,max:52});
 text(app,847,681,'Forecast recommendations: Head Lab review only',{font:19,max:55});
 roles.forEach(([key],i)=>{
  const sy=247+i*296,ey=390+i*65;
  el('path',{d:'M379 '+sy+' L535 '+ey,fill:'none',stroke:'#000','stroke-width':2,'data-connection':key+'-application'},v);
  const caption=text(v,419,sy+(ey<sy?20:-24),'HTTPS',{font:17,max:15});
  caption.setAttribute('stroke','#fff');caption.setAttribute('stroke-width','5');caption.setAttribute('paint-order','stroke');
 });
 const stores=[...window.SystemDeploymentStores].sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
 const storesBottom=994+(stores.length-1)*55+44;
 const database=node(535,855,625,storesBottom+41-855,'«device» Database Server','database');
 box(database,555,916,585,storesBottom+20-916);
 text(database,847,943,'«executionEnvironment» PostgreSQL DBMS',{font:23,bold:true,max:55});
 text(database,847,973,'«artifact» Relational schema — logical data stores',{font:19,max:60});
 stores.forEach((store,i)=>{
  const y=994+i*55,g=el('g',{'data-store':store.id},database);
  box(g,573,y,550,44);
  text(g,848,y+27,store.number+' — '+store.name,{font:21,max:55});
 });
 el('line',{x1:847,y1:760,x2:847,y2:841,stroke:'#000','stroke-width':2,'data-connection':'application-database'},v);
 text(v,1000,804,'Database connection · TLS',{font:19,max:35});
 v.querySelectorAll('text,tspan').forEach(n=>n.style.setProperty('fill','#000'));
 return v;
}
function html(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n;}
let pageNo=0;
function sheet(group,type,s){
 const processPage=type==='process';
 const code=processPage?'ACT-0'+s.id.slice(1):type==='deployment'?'DEP-01':type==='activity'?'SWIM-01':s.code;
 const id=type==='deployment'?'deployment-view':(processPage?'activity':type)+'-'+s.id;
 const wrap=html('div','sheet-scroll'),paper=html('article','sheet');paper.id=id;
 const header=html('header','sheet-head'),titles=html('div');titles.append(html('small','',(processPage?'activity':type==='activity'?'whole-system swimlane':type)+' diagram · NU Fairview laboratory system'),html('h2','',type==='deployment'?'Deployment — proposed architecture':s.title));header.append(titles,html('span','page-code',code));paper.append(header);
 const subtitle=type==='deployment'?'Shared browser access, application runtime and one relational database; proposed deployment.':s.actors.join(' · ')+(s.recipient?' | Recipient: '+s.recipient:'');
 paper.append(html('p','sheet-subtitle',subtitle));const canvas=html('div','canvas');canvas.append(processPage?window.SystemProcessActivity(s.model):type==='deployment'?deployment(id):type==='sequence'?window.SystemSequenceDiagram(s):window.SystemDiagramOverview[type](id));paper.append(canvas);
 paper.append(html('p','sheet-note',type==='deployment'?'Proposed Next.js / React / TypeScript application on Node.js with PostgreSQL. Backend AI modules support informational Q&A and read-only forecasts. Deployment and browser compatibility still require implementation testing.':s.note));
 const foot=html('footer','sheet-foot');const link=html('a','',type==='deployment'?'Sources: Project Overview · Tables 3–22 · DFD 1.0–5.0':'Whole system · DFD 1.0–5.0 · Tables 3–22 · D1–D10');link.href=type==='deployment'?'Docs.html#overview':'assets/figures-v2/dfd-level1/dfd-level1-source.html';
 if(processPage){link.textContent='DFD Level 2 · Process '+s.id.slice(1)+'.0 · Canonical subprocesses';link.href='assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process='+s.id;}
 if(type==='sequence'){link.textContent='Matching Activity '+s.processes[0].split('.')[0].slice(1)+'.0';link.href='#activity-'+s.processes[0].split('.')[0];}
 foot.append(link);if(type!=='deployment'){const pair=html('a','',type==='activity'?'Sequence workflows →':'← Whole-system Swimlane');pair.href=type==='activity'?'#sequence':'#activity-system';foot.append(pair);}foot.append(html('span','','A4 '+'portrait'+' · '+(++pageNo)));paper.append(foot);wrap.append(paper);
 if(processPage||type==='activity'||type==='sequence'||type==='deployment'){
  paper.classList.add('process-sheet');header.remove();
  if(type==='sequence')paper.classList.add('sequence-sheet');
  const reference=html('details','process-reference');reference.append(html('summary','','Notes and DFD reference (not printed)'));
  const downloads=html('p','');
  for(const ext of (processPage?['png','svg']:['png','svg','pdf'])){const name=processPage?'activity-'+s.id:type==='sequence'?'sequence-'+s.id:type==='deployment'?'deployment':'swimlane-system';const asset=html('a','','Download '+ext.toUpperCase());asset.href='assets/system-diagrams/'+name+'.'+ext;asset.download=name+'.'+ext;downloads.append(asset,document.createTextNode(' · '));}
  reference.append(downloads);
  for(const selector of ['.sheet-subtitle','.sheet-note','.sheet-foot'])reference.append(paper.querySelector(selector));
  if(type==='sequence'){
   const refs=html('p','sequence-related');
   const tableRefs={login:3,chooselab:4,viewsched:5,submitscheduled:6,submitcombined:7,cancelres:8,reschedres:9,viewstatus:10,viewhistory:11,clearstatus:12,approve:13,askq:14,issueacct:15,mgminv:16,issueeq:17,procret:18,procclear:19,wastedisp:20,mgmlogs:21,endterm:22};
   for(const use of s.uses){const a=html('a','','Table '+tableRefs[use]);a.href='Docs.html#'+({submitcombined:'uc-submitres',mgminv:'uc-inventory'}[use]||'uc-'+use);refs.append(a,document.createTextNode(' · '));}
   const dfd=html('a','','DFD Level 2 '+s.processes.join(', '));dfd.href='assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process='+s.processes[0].split('.')[0];refs.append(dfd);
   for(const target of s.links){const next=window.SystemSequenceModels.find(m=>m.id===target),a=html('a','',next.code+' '+next.title);a.href='#sequence-'+target;refs.append(document.createElement('br'),a);}
   reference.append(refs);
  }
  wrap.append(reference);
 }
 document.getElementById(group).append(wrap);
}
const whole={id:'system',title:'Whole-system workflow',actors:['Class Representative','Faculty','Dean','Head Laboratory','Physics Laboratory Staff','Circuits Laboratory Staff'],note:'Branches are alternative authorized operations, not mandatory sequential stages. Validate before saving; errors do not create valid transactions. Faculty scheduled activities need no extra approval; routed requests stay Pending until decided. Only Head manages logs/tasks/clearance; Class Representative only views assigned-class student clearance. Full conditions remain in Tables 3–22.'};
const decompositionResponse=await fetch('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json');
const deploymentResponse=await fetch('assets/figures-v2/dfd-level1/dfd-level1-model.json');
if(!deploymentResponse.ok)throw Error('Cannot load deployment data stores');
window.SystemDeploymentStores=(await deploymentResponse.json()).stores;
if(!decompositionResponse.ok)throw new Error('Cannot load the canonical DFD Level 2 subprocesses.');
window.SystemDiagramChildProcesses=await decompositionResponse.json();
sheet('activity','activity',{...whole,actors:['Class Representative','Faculty','Circuit Staff','Physics Staff','Head Lab','Dean'],note:'Laboratory service lifecycle with six actor lanes. Head Laboratory creates Faculty access first. Faculty supplies verified Class Representative details, receives the new credentials from Head Laboratory, and hands them to the Class Representative. Faculty and Class Representatives log in and start their respective reservation workflows. Head Laboratory schedule, daily-task and forecast activities remain independent of requester login. After optional Q&A, Class Representative chooses Physics or Circuits, then Group or Student Only, then Schedule Type. The request-type alternatives converge at an OR Join. Step 3 previews the automatic approval rule; after choosing the class, select its eligible students, slot and items, then review the actual non-editable route and submit. The submission fork independently displays Pending / Current Reviewer and delivers the routed request. Status-view Flow Finals end only the view, not the reservation. Faculty chooses the laboratory, then Laboratory Activity or Non-Laboratory Activity. Laboratory Activity uses the assigned class schedule; Non-Laboratory Activity asks for Schedule Type before the common schedule/room, equipment/materials and review stages. Validated Faculty on-schedule requests are Approved without an approval row; only out-of-schedule requests are Pending for Dean. Laboratory Activity cannot bypass assigned-schedule validation. Class Representative on-schedule requests go to assigned Faculty; out-of-schedule requests go to available assigned Faculty or directly to Dean when that Faculty is unavailable. The selected reviewer makes the final decision; Faculty approval does not escalate to Dean. Final approval independently updates requester status and sends the request to the saved laboratory for staff processing; opening the status page is not a staff-processing gate. Selected Lab decisions read the earlier choice rather than asking for a new laboratory. Circuit and Physics are exclusive assignments. Only an explicit rejection follows the rejection branch. Completed reservations populate Usage Logs automatically. Head Laboratory identifies the accountable student before creating clearance; Class Representatives only view its status. Clearance settlement does not silently complete an unresolved reservation. Activities 1–5 contain the detailed entry points and validation.'});
for(const model of window.SystemDiagramChildProcesses){
 const evidence=window.SystemDiagramModels.filter(s=>s.processes.some(p=>p.startsWith(model.id+'.')));
 const actors=[...new Set(evidence.flatMap(s=>s.actors))];
 const notes={
  p1:'Login and account issuance are alternative operations. Only an already signed-in Head Laboratory creates Class Representative and Faculty accounts. Faculty receives its own credentials or passes representative credentials outside the system. Dean remains pre-assigned; its provisioning authority is pending. Invalid credentials create no session; invalid account details create no account.',
  p2:'The Class Representative form has six steps: Choose Laboratory; Choose Request Type; Choose Schedule Type; Schedule & Room Availability; Equipment & Materials; and Review Information & Submit. Request Type is Group or Student Only; Faculty skips this choice and rescheduling retains the saved type. After class selection, select group members or exactly one class student. Step 3 explains the automatic route; Step 6 shows the actual read-only reviewer. Availability and route previews create no hold. Only a valid final submission saves the request and holds; show Pending and Current Reviewer when approval is required. Faculty chooses Laboratory Activity or Non-Laboratory Activity after the laboratory. Laboratory Activity uses the assigned schedule; Non-Laboratory Activity asks for On- / Out-of-Schedule before the shared schedule/room, equipment/materials and review steps. Both validated Faculty on-schedule modes are Approved without academic review or an approval row. Class Representative on-schedule requests go to assigned Faculty; out-of-schedule requests go to available assigned Faculty OR directly to Dean when that Faculty is unavailable. Faculty out-of-schedule requests require Dean only. The selected reviewer makes the final decision, without Faculty-to-Dean escalation. Final approval permits issuance; rejection releases the hold. Invalid rescheduling keeps the saved request and original hold. Cancellation and own status/history are separate operations.',
  p3:'Class Representative and Faculty only. Question scope determines which records are read; no reservation is submitted, changed or approved. Unsupported questions are declined and missing evidence is reported as unavailable. Knowledge-base ownership remains pending.',
  p4:'Branches are independently selected operations, not a mandatory inventory → issue → return → disposal → forecast chain. Only Head Lab requests the optional read-only forecast. D4 stock, D5 actual consumption / borrowing / returns and D2 item references support next-month consumable restock or concurrent equipment-shortage estimates. Missing history shows Insufficient history. No purchase or stock write occurs. Other operations retain their existing validations and clearance responsibilities.',
  p5:'Schedule, usage / daily tasks, clearance and reporting are independently selected operations. Only Head Laboratory manages or settles records; Class Representative only views assigned-class student clearance. Faculty and Laboratory Staff do not access these administration actions. Reporting is non-AI; completion after clearance settlement remains pending.'
 };
 sheet('process-activities','process',{id:model.id,title:'Process '+model.id.slice(1)+'.0 — '+model.name,model,actors,note:notes[model.id]});
}
const index=html('nav','sequence-index');index.id='sequence-index';index.setAttribute('aria-label','Sequence workflows');
const overviewLink=html('a','','Whole-system sequence — two connected pages');overviewLink.href='Sequence-Overview.html';index.append(overviewLink);
index.append(html('h2','','Sequence Diagrams — five major processes'),html('p','','One A4 portrait page per DFD Level 1 major process. Related use cases are summarized with guarded fragments. Calls are solid; replies are dashed. Database labels identify logical DFD record groups, not a selected DBMS.'));
const catalog=html('a','','Grouping decisions and evidence');catalog.href='assets/system-diagrams/SEQUENCE-PLAN.md';index.append(catalog);
const sequenceDownload=html('a','','Download sequence-only PDF');sequenceDownload.href='assets/system-diagrams/sequences.pdf';sequenceDownload.download='sequences.pdf';index.append(document.createTextNode(' · '),sequenceDownload);
const groups=html('div','sequence-groups');
for(const parent of window.SystemDiagramChildProcesses){
 const group=html('section',''),heading=html('h3','',parent.id.slice(1)+'.0 '+parent.name),list=html('ul','');group.append(heading,list);
 for(const m of window.SystemSequenceModels.filter(m=>m.processes[0].startsWith(parent.id+'.'))){const li=html('li',''),a=html('a','',m.code+' · '+m.title);a.href='#sequence-'+m.id;li.append(a);list.append(li);}
 groups.append(group);
}
index.append(groups);document.getElementById('sequence').append(index);
for(const model of window.SystemSequenceModels)sheet('sequence','sequence',model);
sheet('deployment','deployment');
document.getElementById('print').onclick=()=>window.print();
window.__systemDiagramsReady=true;
})().catch(error=>{
 window.__systemDiagramsError=error.message;
 document.getElementById('activity').textContent='Cannot prepare diagrams: '+error.message+'. Serve this page through the website or Live Server, or open the exported PDF.';
});
