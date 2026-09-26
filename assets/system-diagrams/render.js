(async function(){
'use strict';
const deployment=id=>window.SystemDeploymentDiagram(id);
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
 paper.append(html('p','sheet-note',type==='deployment'?'Proposed Next.js / React / TypeScript / Tailwind CSS Frontend and Node.js Backend with PostgreSQL. The browser uses HTTPS; only the Backend connects to the database using TLS. AI Chatbot and Inventory Forecasting remain Backend components. Hosting and an external AI provider are not selected. Deployment and browser compatibility still require implementation testing.':s.note));
 const foot=html('footer','sheet-foot');const link=html('a','',type==='deployment'?'Sources: Project Overview · Tables 3–22 · DFD 1.0–5.0':'Whole system · DFD 1.0–5.0 · Tables 3–22 · D1–D10');link.href=type==='deployment'?'Docs.html#overview':'assets/figures-v2/dfd-level1/dfd-level1-source.html';
 if(processPage){link.textContent='DFD Level 2 · Process '+s.id.slice(1)+'.0 · Canonical subprocesses';link.href='assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process='+s.id;}
 if(type==='sequence'){link.textContent='Matching Activity '+s.processes[0].split('.')[0].slice(1)+'.0';link.href='#activity-'+s.processes[0].split('.')[0];}
 foot.append(link);if(type!=='deployment'){const pair=html('a','',type==='activity'?'Sequence workflows →':'← Whole-system Swimlane');pair.href=type==='activity'?'#sequence':'#activity-system';foot.append(pair);}foot.append(html('span','','A4 '+'portrait'+' · '+(++pageNo)));paper.append(foot);wrap.append(paper);
 if(type==='activity'||type==='deployment'){
  const name=type==='activity'?'Swimlane':'Deployment';
  const actions=html('nav','diagram-export-actions');actions.setAttribute('aria-label',name+' PDF export');
  const button=html('a','diagram-export-button','Export PDF');button.setAttribute('aria-label','Export '+name+' PDF');
  button.href='assets/system-diagrams/'+(type==='activity'?'swimlane-system.pdf':'deployment.pdf');
  button.download=type==='activity'?'swimlane-a4.pdf':'deployment-a4.pdf';
  actions.append(button);wrap.prepend(actions);
 }
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
sheet('activity','activity',{...whole,actors:['Class Representative','Faculty','Circuit Staff','Physics Staff','Head Lab','Dean'],note:'Laboratory service lifecycle with six actor lanes. Head Laboratory creates Faculty access first. Faculty supplies verified Class Representative details, receives the new credentials from Head Laboratory, and hands them to the Class Representative. Faculty and Class Representatives log in and start their respective reservation workflows. Head Laboratory schedule, daily-task and forecast activities remain independent of requester login. After optional Q&A, Class Representative chooses Physics or Circuits, then Group or Student Only, then Schedule Type. The request-type alternatives converge at an OR Join. Step 3 previews the automatic approval rule; after choosing the class, select its eligible students and schedule/room, then choose Equipment / Materials and requested quantities, then review the actual non-editable route and submit. The submission fork independently displays Pending / Current Reviewer and delivers the routed request. Status-view Flow Finals end only the view, not the reservation. Faculty chooses the laboratory, then Laboratory Activity or Non-Laboratory Activity. Laboratory Activity carries over the assigned class, room, date, time and block and proceeds directly to equipment/materials and review. Non-Laboratory Activity collects Schedule Type with class, room, date, time and block, then proceeds to equipment/materials and review. Neither Faculty alternative has a separate Schedule & Room Availability page; schedule and stock validation still run before saving. Validated Faculty on-schedule requests are Approved without an approval row; only out-of-schedule requests are Pending for Dean. Laboratory Activity cannot bypass assigned-schedule validation. Class Representative on-schedule requests go to assigned Faculty; out-of-schedule requests go to available assigned Faculty or directly to Dean when that Faculty is unavailable. The selected reviewer makes the final decision; Faculty approval does not escalate to Dean. Final approval independently updates requester status and sends the request to the saved laboratory for staff processing; opening the status page is not a staff-processing gate. Selected Lab decisions read the earlier choice rather than asking for a new laboratory. Circuit and Physics are exclusive assignments. Issuance creates the Borrowing Slip in D5 for the saved laboratory and sets Ongoing. Head Laboratory can access borrowing slips for both Physics and Circuits independently of return processing. The assigned laboratory Staff or Head Laboratory physically checks each item, validates and records Returned (good), Broken, Lost and Consumed quantities, then saves return and stock records. Only consumables may be recorded as consumed; cumulative outcomes cannot exceed issued quantities. Broken or lost outcomes go to Head Laboratory to identify the accountable student and create clearance. Partial returns remain Ongoing. Completed status and D11 usage are saved only after all issued quantities are accounted for and no broken/lost accountability remains unresolved. Invalid forms display a correction without creating a new request or hold. Faculty Pending status with Dean as reviewer is shown independently of review. Eligible edit/reschedule and cancellation are summarized in the owned status references; Activity 2 contains their detailed flows. Rejected and Completed status are displayed to the actual requester. Only an explicit rejection follows the rejection branch. Completed reservations populate Usage Logs automatically. Head Laboratory identifies the accountable student before creating clearance; Class Representatives only view its status. Clearance settlement does not silently complete an unresolved reservation. Activities 1–5 contain the detailed entry points and validation.'});
for(const model of window.SystemDiagramChildProcesses){
 const evidence=window.SystemDiagramModels.filter(s=>s.processes.some(p=>p.startsWith(model.id+'.')));
 const actors=[...new Set(evidence.flatMap(s=>s.actors))];
 const notes={
  p1:'Login and account issuance are alternative operations. Only an already signed-in Head Laboratory creates Class Representative and Faculty accounts. Faculty receives its own credentials or passes representative credentials outside the system. Dean remains pre-assigned; its provisioning authority is pending. Invalid credentials create no session; invalid account details create no account.',
  p2:'The Class Representative form has six steps: Choose Laboratory; Choose Request Type; Choose Schedule Type; Schedule & Room Availability; Equipment & Materials; and Review Information & Submit. Request Type is Group or Student Only; Faculty skips this choice and rescheduling retains the saved type. After class selection, select group members or exactly one class student. Step 3 explains the automatic route; Step 6 shows the actual read-only reviewer. Availability and route previews create no hold. Only a valid final submission saves the request and holds; show Pending and Current Reviewer when approval is required. Faculty chooses Laboratory Activity or Non-Laboratory Activity after the laboratory. Laboratory Activity automatically uses the assigned class, room, date, time and block and proceeds directly to Equipment & Materials, then Review Information & Submit. Non-Laboratory Activity collects On- / Out-of-Schedule and the class, room, date, time and block together, then proceeds to equipment and review. Faculty skips the separate Schedule & Room Availability page, while backend validation still checks schedule and stock. The Class Representative form remains six steps; its Group / Student Only choices join before Schedule Type, and its room stage joins the Faculty alternatives before equipment. Both validated Faculty on-schedule modes are Approved without academic review or an approval row. Class Representative on-schedule requests go to assigned Faculty; out-of-schedule requests go to available assigned Faculty OR directly to Dean when that Faculty is unavailable. Faculty out-of-schedule requests require Dean only. The selected reviewer makes the final decision, without Faculty-to-Dean escalation. Final approval permits issuance; rejection releases the hold. Invalid rescheduling keeps the saved request and original hold. A saved submission continues automatically into routing, rather than ending before review. A routed Faculty or Dean can also open an existing Pending request; the OR Join accepts either entry without requiring a new submission. Review and final-status saving map to Processes 2.3 and 2.4. Pending waits for a decision, without automatic rejection. Approved records are eligible for Process 4.2 after issuance and stock checks. The menu offers Submit Form, View Status, Routed Reviewer and View Clearance. Schedule availability is part of the form. View Status shows owned records and Current Reviewer, with eligible edit/reschedule and cancellation actions inside this flow. Eligible edits return to the form for validation; cancellation releases holds and saves Cancelled status. Only the assigned Faculty or Dean can open a routed Pending request. View Clearance is a read-only Class Representative navigation reference to Process 5.3; Faculty and Dean do not receive clearance access.',
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
// Measure labels only after all SVGs are attached and their shapes exist.
window.SystemArrowLabels.layout(document.querySelector('#activity-system svg'),window.SystemSwimlaneGeometry,{fontSize:32});
for(const [id,geometry] of Object.entries(window.SystemActivityGeometry))window.SystemArrowLabels.layout(document.querySelector('#activity-'+id+' svg'),geometry);
document.getElementById('print').onclick=()=>window.print();
window.__systemDiagramsReady=true;
})().catch(error=>{
 window.__systemDiagramsError=error.message;
 document.getElementById('activity').textContent='Cannot prepare diagrams: '+error.message+'. Serve this page through the website or Live Server, or open the exported PDF.';
});
