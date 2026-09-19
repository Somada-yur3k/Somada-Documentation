/* Five A4 sequence diagrams aligned one-to-one with the five DFD Level 1 and
 * Activity Diagram major processes. Minor use cases are summarized with UML
 * combined fragments instead of being repeated as separate pages. */
(function(root){
'use strict';
const diagrams=[];
const call=(from,to,label,extra={})=>({kind:'call',from,to,label,...extra});
const reply=(from,to,label)=>({kind:'reply',from,to,label});
const self=label=>({kind:'self',from:'system',to:'system',label});
const signal=(to,label)=>({kind:'signal',from:'system',to,label});
const db=(label,result,stores,write=false)=>[call('system','db',label,{stores,write}),reply('db','system',result)];
const branch=(guard,steps)=>({guard,steps});
const alt=(...operands)=>({kind:'alt',operands});
const par=(...operands)=>({kind:'par',operands});
const opt=(guard,steps)=>({kind:'opt',operands:[branch(guard,steps)]});
const add=model=>diagrams.push({links:[],...model,code:'SEQ-'+String(diagrams.length+1).padStart(2,'0')});

add({id:'p1',title:'User Access and Account Management',source:'p1',
 actors:['Class Representative','Faculty','Dean','Head Laboratory','Physics Laboratory Staff','Circuits Laboratory Staff'],
 uses:['login','issueacct'],processes:['p1.1','p1.2','p1.3'],stores:['d1'],
 participants:[
  {id:'actor',kind:'actor',label:'Authorized\nUser',roles:['Class Representative','Faculty','Dean','Head Laboratory','Physics Laboratory Staff','Circuits Laboratory Staff']},
  {id:'head',kind:'actor',label:'Head Lab',roles:['Head Laboratory']},
  {id:'system',kind:'system',label:'Laboratory\nWeb System'},
  {id:'db',kind:'database',label:'Database\nD1'}],
 precondition:'Login uses an issued account; account administration requires a signed-in Head Laboratory.',
 steps:[alt(
  branch('Log in',[call('actor','system','Submit credentials'),...db('Read account and role scope','Account result',['d1']),self('Validate; establish scoped session'),reply('system','actor','Login result')]),
  branch('Create Faculty / Class Rep. account',[call('head','system','Submit new account'),self('Authorize Head; validate target role'),...db('Create valid account','Account created / refused',['d1'],true),reply('system','head','Creation result; send new credentials')]),
  branch('Update existing Faculty / Class Rep. account',[call('head','system','Submit account update'),self('Authorize Head; retain target role'),...db('Update details / active status','Account updated / refused',['d1'],true),reply('system','head','Update result')])
 )],
 note:'Faculty and Class Representatives never self-register. Head Laboratory creates and manages only those two account roles. Updates retain the role and linked history. Dean remains pre-assigned.'});

add({id:'p2',title:'Reservations, Availability and Approvals',source:'p2',actors:['Class Representative','Faculty','Dean'],
 uses:['chooselab','viewsched','submitscheduled','submitcombined','cancelres','reschedres','viewstatus','viewhistory','approve'],processes:['p2.1','p2.2','p2.3','p2.4'],stores:['d2','d3','d4'],
 participants:[
  {id:'requester',kind:'actor',label:'Class Rep. /\nFaculty',roles:['Class Representative','Faculty']},
  {id:'faculty',kind:'actor',label:'Assigned\nFaculty',roles:['Faculty']},
  {id:'dean',kind:'actor',label:'Dean',roles:['Dean']},
  {id:'system',kind:'system',label:'Laboratory\nWeb System'},
  {id:'db',kind:'database',label:'Database\nD2, D3, D4'}],
 precondition:'Signed in requester or routed reviewer; operations are limited to owned, assigned or routed records.',
 steps:[
  call('requester','system','View / submit / change own reservation'),...db('Read schedule, holds, stock and owned records','Scoped evidence',['d2','d3','d4']),self('Validate operation, type, block, items and route'),
  ...db('Save valid request / change; keep reads unchanged','Current reservation result',['d2'],true),signal('faculty','Notify if Faculty review is required'),reply('system','requester','Availability, status or saved request result'),
  opt('Faculty review is required',[call('faculty','system','Approve / reject routed request'),self('Validate reviewer; choose final, rejected or Pending Dean'),...db('Save Faculty decision and route','Decision saved',['d2'],true),signal('requester','Notify status / next reviewer'),reply('system','faculty','Decision confirmed')]),
  opt('Pending Dean review is required',[call('dean','system','Approve / reject eligible request'),self('Validate prior Faculty decision and Dean route'),...db('Save final Approved or Rejected','Final decision saved',['d2'],true),signal('requester','Notify final decision'),reply('system','dean','Final decision confirmed')])
 ],
 note:'Class Representative selects GROUP or STUDENT_ONLY for both request variants. On-schedule Class Representative requests go to Faculty; out-of-schedule requests go to Faculty then Dean. Faculty out-of-schedule requests go to Dean; Faculty scheduled activities need no academic approval.'});

add({id:'p3',title:'Laboratory Questions',source:'p3',actors:['Class Representative','Faculty'],uses:['askq'],processes:['p3.1','p3.2','p3.3','p3.4'],stores:['d2','d3','d4','d8','d9'],
 participants:[{id:'actor',kind:'actor',label:'Class Rep. /\nFaculty',roles:['Class Representative','Faculty']},{id:'system',kind:'system',label:'Laboratory\nQ&A System'},{id:'db',kind:'database',label:'Database\nD2, D3, D4, D8, D9'}],
 precondition:'Signed in Class Representative or Faculty; Q&A is informational and scope-limited.',
 steps:[call('actor','system','Submit laboratory question'),self('Classify intent and permitted scope'),alt(
  branch('permitted informational question',[...db('Read relevant scoped evidence','Evidence / unavailable',['d2','d3','d4','d8']),self('Prepare evidence-based answer'),...db('Save Q&A exchange','History saved',['d9'],true),reply('system','actor','Answer / information unavailable')]),
  branch('else: unsupported action request',[self('Prepare scope refusal'),...db('Save question and refusal','History saved',['d9'],true),reply('system','actor','Refusal and allowed scope')]))],
 note:'The system reads only the record group relevant to the question. It never changes a reservation and never invents missing evidence.'});

add({id:'p4',title:'Equipment and Borrowing Management',source:'p4',actors:['Head Laboratory','Physics Laboratory Staff','Circuits Laboratory Staff'],
 uses:['mgminv','issueeq','procret','wastedisp'],processes:['p4.1','p4.2','p4.3','p4.4','p4.5'],stores:['d2','d4','d5','d10'],
 participants:[{id:'actor',kind:'actor',label:'Head Lab /\nassigned Staff',roles:['Head Laboratory','Physics Laboratory Staff','Circuits Laboratory Staff']},{id:'system',kind:'system',label:'Laboratory\nWeb System'},{id:'db',kind:'database',label:'Database\nD2, D4, D5, D10'}],
 precondition:'Signed in Head Laboratory or assigned laboratory Staff; laboratory scope is enforced.',
 steps:[
  call('actor','system','Select equipment operation'),...db('Read scoped reservation, stock and borrowing records','Operation evidence',['d2','d4','d5']),self('Validate role, laboratory, status and quantities'),
  alt(
   branch('Inventory search / valid change',[...db('Read or save inventory result','Inventory result',['d4'],true),reply('system','actor','Inventory result')]),
   branch('Issue after final approval',[...db('Create borrowing slip after final approval; deduct stock','Issue saved',['d4','d5'],true),reply('system','actor','Issuance result')]),
   branch('Return reconciliation',[...db('Save return and completed usage logs','Return saved',['d2','d4','d5'],true),reply('system','actor','Return result')]),
   branch('Eligible waste disposal',[...db('Save disposal and stock adjustment','Disposal saved',['d4','d10'],true),reply('system','actor','Disposal result')])
  )
 ],
 note:'Staff operate only within their assigned laboratory. Issuance requires final approval. Return reconciliation produces completed usage evidence automatically; disposal is limited to physically present nonrepairable waste.'});

add({id:'p5',title:'Laboratory Administration and Reporting',source:'p5',actors:['Head Laboratory','Class Representative'],uses:['procclear','clearstatus','mgmlogs','endterm'],processes:['p5.1','p5.2','p5.3','p5.4','p5.5'],stores:['d2','d3','d4','d5','d6','d7'],
 participants:[{id:'head',kind:'actor',label:'Head Lab',roles:['Head Laboratory']},{id:'rep',kind:'actor',label:'Class\nRepresentative',roles:['Class Representative']},{id:'system',kind:'system',label:'Laboratory\nWeb System'},{id:'db',kind:'database',label:'Database\nD2-D7'}],
 precondition:'Signed in Head Laboratory, except Class Representative read-only own-group clearance view.',
 steps:[alt(
  branch('Head administration: schedule / daily task / clearance',[call('head','system','Submit valid administration action'),...db('Read and save scoped administration record','Update result',['d2','d3','d5','d6','d7'],true),reply('system','head','Schedule / task / clearance result')]),
  branch('Class Rep. views own-group clearance',[call('rep','system','Request own-group clearance'),...db('Read scoped clearance','Clearance status',['d6']),reply('system','rep','Display own-group status')]),
  branch('Head views / exports end-term report',[call('head','system','Open term logs'),par(
   branch('Completed usage',[...db('Read completed sessions','Usage evidence',['d2','d3'])]),branch('Inventory evidence',[...db('Read item quantities','Item evidence',['d4','d5'])])
  ),reply('system','head','Display summaries / Recent Activity; export if requested')])
 )],
 note:'End-term reporting includes Average Equipment Use, Top 5 Equipment & Consumables, Laboratory Frequency Usage and Recent Activity. Daily tasks, disposal, outstanding clearances and appendix are excluded.'});

root.SystemSequenceModels=diagrams;
if(typeof module!=='undefined')module.exports=diagrams;
})(typeof window==='undefined'?globalThis:window);
