/* A4 portrait UML activities. Uniform action/decision symbols; no partitions.
 * Exclusive user operations remain choices, never parallel branches.
 * P5's fork/join models READ-ONLY session and item evidence from D11 usage logs
 * at DFD 5.4. This is logical concurrency, not a claim that
 * an implemented server executes simultaneous database queries. Both reads
 * return evidence or unavailable results; the join cannot mask missing data.
 */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);parent?.append(n);return n;}
function draw(model){
 const id='activity-'+model.id,width=model.id==='p2'?1800:1200,height=model.id==='p2'?2550:model.id==='p4'?2300:1697,ACTION_W=260,ACTION_H=68;
 const svg=el('svg',{xmlns:NS,viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':model.name+' — portrait UML Activity Diagram','data-parent':model.id});
 const defs=el('defs',{},svg),marker=el('marker',{id:id+'-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:8.5,markerHeight:8.5,orient:'auto'},defs);
 el('style',{},defs).textContent='text{font-family:Arial,Helvetica,sans-serif;fill:#000}.line{fill:none;stroke:#000;stroke-width:2.2}';
 el('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#000'},marker);
 const edges=el('g',{},svg),shapes=el('g',{},svg),labels=el('g',{},svg),nodes={},routes=[],mapped=new Set();
 function text(parent,x,y,value,size=22,bold=false){const rows=value.split('\n'),t=el('text',{'text-anchor':'middle','font-size':size,'font-weight':bold?700:400,style:'fill:#000'},parent);rows.forEach((row,i)=>el('tspan',{x,y:y+(i-(rows.length-1)/2)*size*1.16+size*.34},t).textContent=row);return t;}
 const precondition={p1:'Login: any role. Create / update Faculty or Class Rep. accounts: signed-in Head Laboratory only.',p2:'Precondition: signed-in requester or routed Faculty / Dean; permitted operations only.',p3:'Precondition: signed-in Class Representative or Faculty; informational Q&A only.',p4:'Precondition: signed-in Head Laboratory or Staff within the assigned laboratory.',p5:'Precondition: signed-in Head Laboratory; Class Representative: assigned-class student clearance only.'}[model.id];
 if(model.id==='p2') text(labels,900,65,'Class Rep.: Group or Student Only for BOTH schedule variants. Student Only = one selected class student.\nOn-schedule → assigned Faculty. Out-of-schedule → available assigned Faculty, or directly to Dean if unavailable.',22);
 else text(labels,600,83,precondition,20);
 function action(key,x,y,title,child,fontSize=21){
  const g=el('g',{'data-activity-node':key,'data-uml-kind':'action'},shapes);nodes[key]={x:x-ACTION_W/2,y:y-ACTION_H/2,w:ACTION_W,h:ACTION_H,kind:'action',title};
  if(child!==undefined){const ref=model.id+'.'+(child+1);g.setAttribute(mapped.has(ref)?'data-child-ref':'data-child-process',ref);g.setAttribute('data-child-name',model.steps[child]);mapped.add(ref);}
  el('rect',{x:x-ACTION_W/2,y:y-ACTION_H/2,width:ACTION_W,height:ACTION_H,rx:10,fill:'#fff',stroke:'#000','stroke-width':2.2},g);text(g,x,y,title,fontSize,true);
 }
 function decision(key,x,y,title){const w=180,h=92;nodes[key]={x:x-w/2,y:y-h/2,w,h,kind:'decision',title};const g=el('g',{'data-decision':key},shapes);el('path',{d:`M${x} ${y-h/2} L${x+w/2} ${y} L${x} ${y+h/2} L${x-w/2} ${y} Z`,fill:'#fff',stroke:'#000','stroke-width':2.2,'data-activity-node':key,'data-uml-kind':'decision'},g);text(g,x,y,title,18);}
 // Adviser presentation convention: branch outcomes use Flow Finals;
 // retain one connected lower Activity Final per major-process diagram.
 function terminal(key,x,y,final=false){
  const activityFinal={p1:'account-end',p2:'other-end',p3:'end',p4:'other-end',p5:'report-end'}[model.id];
  const flow=final&&key!==activityFinal;
  const kind=flow?'flow-final':final?'final':'initial';nodes[key]={x:x-22,y:y-22,w:44,h:44,kind};
  if(flow){const g=el('g',{'data-activity-node':key,'data-uml-kind':kind},shapes);el('circle',{cx:x,cy:y,r:22,fill:'#fff',stroke:'#000','stroke-width':2.6},g);el('path',{d:`M${x-13} ${y-13} L${x+13} ${y+13} M${x+13} ${y-13} L${x-13} ${y+13}`,fill:'none',stroke:'#000','stroke-width':2.6},g);return;}
  if(final)el('circle',{cx:x,cy:y,r:22,fill:'#fff',stroke:'#000','stroke-width':2.6},shapes);el('circle',{cx:x,cy:y,r:final?14:22,fill:'#000','data-activity-node':key,'data-uml-kind':kind},shapes);
 }
 function bar(key,x,y,kind){nodes[key]={x:x-280,y:y-6,w:560,h:12,kind};el('rect',{x:x-280,y:y-6,width:560,height:12,fill:'#000','data-activity-node':key,'data-uml-kind':kind},shapes);}
 function approvalJoin(key,x,y){const w=210,h=12;nodes[key]={x:x-w/2,y:y-h/2,w,h,kind:'join',joinSpec:'or'};el('rect',{x:x-w/2,y:y-h/2,width:w,height:h,fill:'#000','data-activity-node':key,'data-uml-kind':'join','data-join-spec':'or'},shapes);}
 function point(key,side){if(Array.isArray(side))return side;const n=nodes[key];return side==='l'?[n.x,n.y+n.h/2]:side==='r'?[n.x+n.w,n.y+n.h/2]:side==='t'?[n.x+n.w/2,n.y]:[n.x+n.w/2,n.y+n.h];}
 function label(x,y,value,_size=21,from,to){if(value.includes('joinSpec'))return;const t=text(labels,x,y,value,21);t.setAttribute('style','fill:#000;stroke:#fff;stroke-width:6px;paint-order:stroke;stroke-linejoin:round');t.setAttribute('data-flow-label',from?from+'-to-'+to:'note-'+labels.querySelectorAll('[data-flow-label]').length);t.setAttribute('data-label-text',value);t.setAttribute('data-label-x',x);t.setAttribute('data-label-y',y);if(from){t.setAttribute('data-label-from',from);t.setAttribute('data-label-to',to);}return t;}
 function readableGuard(from,guard){
  if(!guard)return guard;
  const pairs={operation:['Log in','Manage accounts'],scope:['In scope','Out of scope'],'request-role':['Class Rep.','Faculty'],'approval-requester':['Class Rep.','Faculty'],'classrep-schedule':['On-schedule','Out-of-schedule'],'faculty-schedule':['On-schedule','Out-of-schedule'],'faculty-available':['Available','Unavailable'],'forecast-valid':['Sufficient history','Insufficient history'],'records-ready':['Records found','No records'],'login-valid':['Valid credentials','Invalid credentials'],'account-valid':['Valid details','Invalid details'],'request-valid':['Valid request','Invalid request'],'availability-valid':['Allowed','Not allowed'],'cancel-valid':['Eligible','Not eligible'],'tracking-valid':['Own records','Not own records'],'inventory-valid':['Valid change','Invalid change'],'issue-valid':['Approved; stock valid','Not issuable'],'return-valid':['Within issued qty','Invalid return qty'],'disposal-valid':['Disposable','Not disposable'],'schedule-valid':['Valid; no conflict','Invalid / conflict'],'logs-valid':['Valid task','Invalid task'],'clearance-valid':['Authorized; valid','Not allowed / invalid']};
  const yes=/^\[Yes(?:[:\]\s])/.test(guard),no=/^\[No(?:[:\]\s])/.test(guard);if(!yes&&!no)return guard.replace(/^\[|\]$/g,'');
  if(pairs[from])return pairs[from][yes?0:1];
  if(from.endsWith('-choice')){const names={availability:'View slots',request:'Submit / reschedule',cancel:'Cancel request',tracking:'View tracking',approval:'Routed reviewer',inventory:'Catalogue',issue:'Issue items',return:'Return items',disposal:'Disposal',forecast:'Forecast: Head Lab',schedule:'Schedule',logs:'Daily task',clearance:'Clearance'};return yes?names[from.slice(0,-7)]||'Selected':guard.includes('report')?'Report selected':'Other operation';}
  return guard.replace(/^\[(?:Yes|No):\s*/,'').replace(/\]$/,'');
 }
 function link(from,fs,to,ts,bends=[],guard,position){const points=[point(from,fs),...bends,point(to,ts)];el('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),class:'line',style:'fill:none;stroke:#000;stroke-width:2.2','marker-end':'url(#'+id+'-arrow)','data-control-from':from,'data-control-to':to,...(guard?{'data-guard':guard}:{})},edges);routes.push({from,to,points,guard:guard||null,displayGuard:readableGuard(from,guard)||null});if(guard&&position)label(position[0],position[1],readableGuard(from,guard),21,from,to).setAttribute('data-label-guard',guard);}
 function dispatchStart(){terminal('start',200,model.id==='p2'?120:125);action('choose',200,200,'Choose permitted\noperation');link('start','b','choose','t');}
 function row(key,y,question,input,condition,result,child,preChild){
  // The same uncluttered branch layout is used by Head Lab / Staff (P4)
  // and Head Lab reporting (P5): correction right, success below, with
  // separate arrowheads entering two sides of their shared Flow Final.
  decision(key+'-choice',200,y,question);action(key+'-input',480,y,input,preChild);decision(key+'-valid',760,y,condition);
  action(key+'-save',760,y+105,result,child);action(key+'-error',1050,y,'Show correction;\nmake no change');terminal(key+'-end',1050,y+105,true);
   link(key+'-choice','r',key+'-input','l',[],'[Yes]',[320,y+75,14]);link(key+'-input','r',key+'-valid','l');
   link(key+'-valid','r',key+'-error','l',[],'[No]',[885,y-70,14]);
  link(key+'-valid','b',key+'-save','t',[],'[Yes]',[930,y+52,14]);
  link(key+'-error','b',key+'-end','t');link(key+'-save','r',key+'-end','l');
 }
 function dispatch(rows){dispatchStart();rows.forEach((r,i)=>{row(...r);if(i===0)link('choose','b',r[0]+'-choice','t');else link(rows[i-1][0]+'-choice','b',r[0]+'-choice','t',[],'[No]',[280,model.id==='p2'&&rows[i-1][0]==='request'?1000:(rows[i-1][1]+r[1])/2]);});}
 function refuseOther(last,y){action('other',200,y,'No permitted\noperation selected');terminal('other-end',200,y+85,true);link(last+'-choice','b','other','t',[],'[No]',[260,y-60]);link('other','b','other-end','t');}
 if(model.id==='p1'){
  terminal('start',600,165);action('choose',600,260,'Choose access\noperation');link('start','b','choose','t');decision('operation',600,390,'Log in?');link('choose','b','operation','t');
  terminal('error-end',600,1500,true);
  terminal('account-end',600,1600,true);
  for(const [key,x,login]of [['login',350,true],['account',850,false]]){
   action(key+'-input',x,550,login?'Enter credentials':'Enter verified details;\nFaculty / Class Rep.');action(key+'-check',x,710,login?'Validate credentials':'Check role, ID, section;\nclass / Faculty links',login?0:undefined);
   decision(key+'-valid',x,860,'Valid?');action(key+'-save',x,1020,login?'Establish role-scoped\nsession':'Create / update details\nand active status',login?1:2);action(key+'-result',x,1180,login?'View role dashboard':'If new: email Faculty;\nFaculty hands to Rep.');
   action(key+'-error',x,1380,login?'Show login error;\nno session created':'Show correction;\nno account changed');
   link('operation',login?'l':'r',key+'-input','t',[[x,390]],login?'[Yes]':'[No: manage accounts, Head]',[login?260:970,461]);link(key+'-input','b',key+'-check','t');link(key+'-check','b',key+'-valid','t');link(key+'-valid','b',key+'-save','t',[],'[Yes]',[x+110,947]);link(key+'-save','b',key+'-result','t');
   const errorTrack=login?40:1160,successTrack=login?130:1070;
   link(key+'-valid',login?'l':'r',key+'-error',login?'l':'r',[[errorTrack,860],[errorTrack,1380]],'[No]',[login?110:1090,838]);
   link(key+'-result',login?'l':'r','account-end',login?'l':'r',[[successTrack,1180],[successTrack,1600]]);
   link(key+'-error','b','error-end',login?'l':'r',[[x,1500]]);
  }
 }else if(model.id==='p3'){
  terminal('start',600,170);action('ask',600,290,'Ask laboratory\nquestion');action('capture',600,450,'Capture inquiry',0);decision('scope',600,620,'Permitted?');link('start','b','ask','t');link('ask','b','capture','t');link('capture','b','scope','t');
  action('records',350,820,'Read lab knowledge /\ncurrent stock',1);action('answer',350,1030,'Answer from evidence /\nstate unavailable',2);action('history',350,1240,'Record question\nand answer',3);action('result',350,1440,'Read answer');terminal('end',350,1610,true);
   link('scope','l','records','t',[[350,620]],'[Yes]',[275,720]);link('records','b','answer','t');link('answer','b','history','t');link('history','b','result','t');link('result','b','end','t');
   action('decline',850,820,'Decline; explain\nallowed questions');action('refusal-history',850,1240,'Record question\nand refusal',3);action('refusal-result',850,1440,'Read refusal');terminal('refusal-end',850,1610,true);link('scope','r','decline','t',[[850,620]],'[No]',[935,720]);link('decline','b','refusal-history','t');link('refusal-history','b','refusal-result','t');link('refusal-result','b','refusal-end','t');
 }else if(model.id==='p2'){
  // Four navigation entries, not four new DFD subprocesses. Viewing slots
  // belongs to the form; edit/reschedule and cancellation belong to status.
  dispatchStart();
  decision('request-choice',200,300,'Submit Form?');
  decision('status-choice',200,470,'View Status?');
  decision('approval-choice',200,1480,'Routed\nReviewer?');
  decision('clearance-choice',200,1680,'View\nClearance?');
  link('choose','b','request-choice','t');
  link('request-choice','b','status-choice','t',[],'[Other operation]',[100,391],18);
  link('status-choice','b','approval-choice','t',[],'[Other operation]',[100,1380]);
  link('approval-choice','b','clearance-choice','t',[],'[Other operation]',[95,1580]);

  // New forms and eligible edits share the same validated form. The return
  // arrow is an explicit edit loop; it does not overwrite a saved request.
  approvalJoin('form-ready',1040,230);
  link('request-choice','r','form-ready','l',[[350,300],[350,230]],'[Submit Form]',[440,205],20);
  action('request-input',1040,300,'1 Choose Laboratory;\nPhysics or Circuits',0,18);
  link('form-ready','b','request-input','t');
  decision('request-role',1540,300,'Class Rep.?');link('request-input','r','request-role','l');
  action('select-type',1540,410,'2 Choose Request Type;\nretain on reschedule',undefined,18);
  decision('reservation-type',1540,520,'Group or\nStudent Only?');
  link('request-role','b','select-type','t',[],'[Yes]',[1680,354],20);link('select-type','b','reservation-type','t');
  action('group-info',1300,520,'Use Group choice');action('individual-info',1540,630,'Use Student Only choice');
  link('reservation-type','l','group-info','r',[],'[Group]',[1320,490],20);
  link('reservation-type','b','individual-info','t',[],'[Student Only]',[1700,575],20);
  bar('type-merge',1040,730,'join');nodes['type-merge'].joinSpec='or';shapes.querySelector('[data-activity-node="type-merge"]').setAttribute('data-join-spec','or');
  decision('faculty-activity',1040,430,'Laboratory\nActivity?');
  nodes['faculty-activity'].roles=['Faculty'];nodes['faculty-activity'].scheduleSource='assigned-class-schedule';
  link('request-role',[1495,323],'faculty-activity','t',[[1495,360],[1040,360]],'[No: Faculty]',[1320,388],20);
  action('faculty-request-options',1040,630,'Schedule Type; class,\nroom, date and time;\nread route preview',0,17);
  nodes['faculty-request-options'].roles=['Faculty'];
  link('faculty-activity','b','faculty-request-options','t',[],'[Non-Laboratory Activity]',[900,555]);
  link('group-info','b','type-merge',[1040,724],[[1300,690],[1040,690]]);
  link('individual-info','b','type-merge',[1280,724],[[1540,700],[1280,700]]);
  action('request-schedule-type',1100,820,'3 Choose Schedule Type;\nOn- / Out-of-schedule;\nread route preview',2,16);
  action('request-room',1540,820,'4 Class, room, date, time;\nblock & eligible students',0,18);
  approvalJoin('equipment-ready',1540,910);
  action('request-items',1540,980,'Equipment / Materials;\nrequested quantities',undefined,18);
  action('request-review',1100,980,'Review Information;\nroute read-only; Submit',undefined,18);
  link('type-merge','b','request-schedule-type','t',[[1040,750],[1100,750]]);
  link('request-schedule-type','r','request-room','l');link('request-room','b','equipment-ready','t');
  // Faculty Laboratory Activity takes its class/date/time from the assigned
  // schedule. Non-Laboratory Activity collects these in Schedule Type; neither
  // Faculty branch visits the Class Representative request-type / room steps.
  link('faculty-activity','l','equipment-ready','l',[[900,430],[900,674],[1350,674],[1350,910]],'[Laboratory Activity]',[1330,780]);
  link('faculty-request-options','r','equipment-ready',[1610,904],[[1380,630],[1380,872],[1610,872]]);
  link('equipment-ready','b','request-items','t');link('request-items','l','request-review','r');
  decision('request-valid',1100,1090,'Details / route\nvalid?');link('request-review','b','request-valid','t');
  action('request-save',1270,1210,'Save request & holds;\nPending if routed',1,18);
  action('request-confirm',1600,1210,'Show saved status;\nCurrent Reviewer if routed',3,18);
  action('request-error',1100,1310,'Show correction;\nkeep saved request on edit',undefined,18);terminal('request-error-end',1100,1400,true);
  link('request-valid','b','request-save','t',[[1100,1150],[1270,1150]],'[Yes]',[1390,1140],20);
  link('request-valid','l','request-error','l',[[950,1090],[950,1310]],'[No]',[1040,1230],20);
  link('request-save','r','request-confirm','l');link('request-error','b','request-error-end','t');

  // A requester selects an owned record before taking any status action.
  action('status-input',550,470,'Open own reservation\nstatus / history',3,18);
  decision('status-own',480,580,'Own record?');
  action('status-display',480,690,'View status / history;\nCurrent Reviewer',3,18);
  action('status-error',760,580,'Access denied;\nno record changed');terminal('status-error-end',760,690,true);
  link('status-choice','r','status-input','l',[],'[View Status]',[380,425],20);link('status-input','b','status-own','t',[[550,514],[480,514]]);
  link('status-own','b','status-display','t',[],'[Own record]',[355,635],18);
  link('status-own','r','status-error','l',[],'[Not own record]',[760,519],18);link('status-error','b','status-error-end','t');
  decision('status-action',480,800,'Status\naction?');link('status-display','b','status-action','t');
  decision('edit-valid',790,800,'Edit\neligible?');
  action('edit-error',790,930,'Show restriction;\nkeep saved request',undefined,18);terminal('edit-error-end',790,1030,true);
  link('status-action','r','edit-valid','l',[],'[Edit / reschedule]',[690,740],16);
  link('edit-valid','b','form-ready','t',[[790,860],[315,860],[315,340],[370,340],[370,170],[1040,170]],'[Eligible edit]',[810,140],20);
  link('edit-valid','r','edit-error','r',[[950,800],[950,930]],'[Not eligible]',[790,884],18);link('edit-error','b','edit-error-end','t');
  action('cancel-check',480,960,'Confirm cancellation;\ncheck saved request',1,18);decision('cancel-valid',480,1070,'Cancellation\neligible?');
  action('cancel-save',480,1190,'Cancel; release hold;\nsave Cancelled status',3,18);
  action('cancel-error',790,1190,'Show restriction;\nmake no change',undefined,18);terminal('cancel-end',480,1300,true);terminal('cancel-error-end',790,1300,true);
  terminal('status-end',340,1040,true);
  link('status-action','b','cancel-check','t',[],'[Cancel request]',[590,882],18);
  link('status-action','l','status-end','t',[[340,800]],'[View only]',[275,916],18);
  link('cancel-check','b','cancel-valid','t');
  link('cancel-valid','b','cancel-save','t',[],'[Eligible]',[600,1130],18);
  link('cancel-valid','r','cancel-error','t',[[790,1070]],'[Not eligible]',[680,1108],18);
  link('cancel-save','b','cancel-end','t');link('cancel-error','b','cancel-error-end','t');

  // Saved submissions enter routing automatically. A routed Faculty / Dean
  // may instead open an existing Pending request. This OR Join does not
  // require another submission or a requester's choice of approver.
  action('approval-open',480,1480,'Open assigned Pending\nrequest (reviewer only)',2,18);approvalJoin('routing-ready',1100,1480);
  link('approval-choice','r','approval-open','l',[],'[Routed Reviewer]',[485,1425],20);link('approval-open','r','routing-ready','l');
  link('request-confirm','b','routing-ready','r',[[1600,1480]]);
  label(1460,1438,'Saved request',21,'request-confirm','routing-ready');
  action('approval-input',1100,1580,'Read saved requester\nand Schedule Type',2);decision('approval-requester',1540,1580,'Class Rep.?');
  link('routing-ready','b','approval-input','t');link('approval-input','r','approval-requester','l');

  // The short bars join alternative routes (OR), not simultaneous branches.
  // Class Representative requests reviewed by Faculty share one review path.
  decision('classrep-schedule',1340,1720,'On-schedule?');
  link('approval-requester','b','classrep-schedule','t',[[1540,1650],[1340,1650]],'[Yes: Class Rep.]',[1390,1610],20);
  decision('faculty-available',960,1810,'Faculty\navailable?');
  link('classrep-schedule','l','faculty-available','t',[[960,1720]],'[No]',[1100,1686],20);
  approvalJoin('faculty-merge',1320,1910);
  link('classrep-schedule','b','faculty-merge',[1340,1904],[],'[Yes]',[1440,1810],20);
  link('faculty-available','b','faculty-merge',[1255,1904],[[960,1880],[1255,1880]],'[Yes]',[1140,1850],20);
  action('classrep-faculty-review',1320,1980,'Faculty: review\nApprove or Reject',2);
  action('classrep-final',1320,2085,'Save final\nApproved / Rejected',3);terminal('classrep-final-end',1560,2085,true);
  link('faculty-merge','b','classrep-faculty-review','t');
  link('classrep-faculty-review','b','classrep-final','t');link('classrep-final','r','classrep-final-end','l');

  // Faculty on-schedule activities need no approval. Either eligible
  // out-of-schedule route meets at the Dean's final review.
  decision('faculty-schedule',1660,1720,'On-schedule?');
  link('approval-requester','r','faculty-schedule','t',[[1660,1580]],'[No: Faculty]',[1670,1547],20);
  action('faculty-regular',1640,1850,'Confirm Approved;\nno academic approval',3);terminal('faculty-regular-end',1640,1960,true);
  link('faculty-schedule','b','faculty-regular','t',[[1660,1790],[1640,1790]],'[Yes]',[1515,1786],18);link('faculty-regular','b','faculty-regular-end','t');
  approvalJoin('dean-merge',1320,2180);
  link('faculty-available','l','dean-merge','l',[[850,1810],[850,2180]],'[No]',[995,2145],20);
  link('faculty-schedule','r','dean-merge','r',[[1785,1720],[1785,2180]],'[No]',[1680,2145],20);
  action('dean-review',1320,2260,'Dean: final\nApprove or Reject',2);
  action('dean-final',1320,2360,'Save final\nApproved / Rejected',3);terminal('dean-final-end',1320,2450,true);
  link('dean-merge','b','dean-review','t');link('dean-review','b','dean-final','t');link('dean-final','b','dean-final-end','t');
  // Navigation reference only: DFD 5.3 still owns D6 clearance access.
  decision('clearance-role',480,1680,'Class Rep.?');
  action('clearance-view',480,1810,'View Clearance Status;\nread-only (Process 5.3)',undefined,18);
  shapes.querySelector('[data-activity-node="clearance-view"]').setAttribute('data-process-reference','p5.3');
  nodes['clearance-view'].processReference='p5.3';nodes['clearance-view'].roles=['Class Representative'];
  action('clearance-denied',790,1680,'Access denied;\nno clearance shown');terminal('clearance-end',790,1810,true);
  link('clearance-choice','r','clearance-role','l',[],'[View Clearance]',[475,1605],20);
  link('clearance-role','b','clearance-view','t',[],'[Class Representative]',[360,1750],18);
  link('clearance-role','r','clearance-denied','l',[],'[Other role]',[655,1745],18);
  link('clearance-view','r','clearance-end','l');link('clearance-denied','b','clearance-end','t');
  action('other',200,1900,'No permitted\noperation selected');terminal('other-end',200,2000,true);
  link('clearance-choice','b','other','t',[],'[Other operation]',[100,1810]);link('other','b','other-end','t');
  text(labels,900,2520,'Approved: eligible for Process 4.2. Rejected: release hold. Pending: await reviewer.',20);
 }else if(model.id==='p4'){
  dispatch([
   ['inventory',365,'Catalogue?', 'Search / enter\ninventory change','Valid?', 'Maintain inventory;\nshow catalogue',0],
   ['issue',715,'Issue?', 'Retrieve finally approved\nreservation','Final approval;\nstock valid?', 'Issue items; save slip,\nstock & Ongoing status',2,1],
   ['return',1065,'Return?', 'Enter return quantities\nand condition','Within issue?', 'Reconcile; complete\nonly with no balance',3],
   ['disposal',1415,'Dispose?', 'Select physical waste\nand quantity','Disposable?', 'Record disposal;\nadjust stock once',4]
  ]);
   decision('forecast-choice',200,1710,'Forecast?');link('disposal-choice','b','forecast-choice','t',[],'[No]',[280,1640]);
  action('forecast-input',600,1710,'Read stock and\nactual usage history',5);
  decision('forecast-valid',980,1710,'Reliable\nhistory?');
   link('forecast-choice','r','forecast-input','l',[],'[Yes: Head Lab]',[400,1778]);link('forecast-input','r','forecast-valid','l');
  action('forecast-estimate',980,1840,'Estimate next-month\nneeds by item type',6);
  action('forecast-show',980,1970,'Show forecast and\nrestock / shortage',7);
  action('forecast-review',980,2100,'Head: review\nrecommendation');terminal('forecast-end',980,2220,true);
   link('forecast-valid','b','forecast-estimate','t',[],'[Yes]',[1100,1780]);link('forecast-estimate','b','forecast-show','t');link('forecast-show','b','forecast-review','t');link('forecast-review','b','forecast-end','t');
  action('forecast-unavailable',600,1840,'Insufficient history;\nshow stock / alerts',7);terminal('forecast-unavailable-end',600,1970,true);
   link('forecast-valid',[935,1733],'forecast-unavailable','t',[[780,1733],[780,1780],[600,1780]],'[No]',[670,1763]);link('forecast-unavailable','b','forecast-unavailable-end','t');
  refuseOther('forecast',1870);
 }else{
  dispatch([
   ['schedule',305,'Schedule?', 'Head: enter\nschedule block','Valid; no\nconflict?', 'Maintain schedule;\npublish vacant blocks',0],
   ['logs',565,'Daily task?', 'Head: enter\ndaily task','Valid?', 'Save daily task;\nconfirm saved record',1],
   ['clearance',825,'Clearance?', 'Head: identify student\nRep.: view status only','Allowed /\nvalid?', 'Head: create / settle;\nRep.: view status',2]
  ]);
   action('term',200,1000,'Head: open Physics /\nCircuits logs');link('clearance-choice','b','term','t',[],'[No: report]',[110,930]);
  bar('report-fork',780,1130,'fork');link('term','b','report-fork','t',[[200,1100],[780,1100]]);
  action('read-usage',570,1230,'Read completed sessions\nfrom D11 usage logs');action('read-stock',990,1230,'Read item use / quantity\nfrom D11 usage logs');
  nodes['read-usage'].stores=['d11'];nodes['read-stock'].stores=['d11'];
  link('report-fork',[570,1136],'read-usage','t');link('report-fork',[990,1136],'read-stock','t');
  bar('report-join',780,1320,'join');link('read-usage','b','report-join',[570,1314]);link('read-stock','b','report-join',[990,1314]);
  label(780,1166,'Fork: independent reads',18);label(780,1290,'Join: wait for both results',18);
  decision('records-ready',780,1380,'Any completed\nusage records?');link('report-join','b','records-ready','t');
  action('metrics',780,1485,'Compute item use,\nequipment average use,\ntop 5 & session shares',3,18);action('report',780,1590,'Show four tables + log;\nexport if requested',4);terminal('report-end',780,1670,true);
   link('records-ready','b','metrics','t',[],'[Yes]',[1000,1428]);link('metrics','b','report','t');link('report','b','report-end','t');
  action('incomplete',400,1485,'Show no records\nfor this term');terminal('incomplete-end',400,1600,true);link('records-ready','l','incomplete','t',[[400,1380]],'[No]',[507,1359]);link('incomplete','b','incomplete-end','t');
 }
 // Line bridges distinguish the few unavoidable crossings from joins.
 // No bridge is placed at a node boundary, bend, or arrowhead.
 if(model.id==='p2'){
  const crossings=new Set(),segments=routes.flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,r})));
  for(const h of segments.filter(s=>s.a[1]===s.b[1]))for(const v of segments.filter(s=>s.a[0]===s.b[0])){
   const x=v.a[0],y=h.a[1],key=x+','+y;
   if(h.r===v.r||crossings.has(key)||x<=Math.min(h.a[0],h.b[0])+14||x>=Math.max(h.a[0],h.b[0])-14||y<=Math.min(v.a[1],v.b[1])+14||y>=Math.max(v.a[1],v.b[1])-14)continue;
   crossings.add(key);const g=el('g',{'data-line-bridge':key},edges);
   el('path',{d:`M${x-11} ${y} Q${x} ${y-15} ${x+11} ${y}`,fill:'none',stroke:'#fff','stroke-width':8},g);
   el('rect',{x:x-11,y:y-2,width:22,height:4,fill:'#fff'},g);
   el('path',{d:`M${x-11} ${y} Q${x} ${y-15} ${x+11} ${y}`,fill:'none',stroke:'#000','stroke-width':2.2},g);
  }
 }
 window.SystemActivityGeometry=window.SystemActivityGeometry||{};window.SystemActivityGeometry[model.id]={nodes,routes,width,height,precondition,actionSize:[ACTION_W,ACTION_H],arrowLabelFontSize:21};return svg;
}
window.SystemProcessActivity=draw;
})();
