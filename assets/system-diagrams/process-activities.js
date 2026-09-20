/* A4 portrait UML activities. Uniform action/decision symbols; no partitions.
 * Exclusive user operations remain choices, never parallel branches.
 * P5's fork/join models independent READ-ONLY reporting inputs already present
 * at DFD 5.4 (D2/D3 and D4/D5). This is logical concurrency, not a claim that
 * an implemented server executes simultaneous database queries. Both reads
 * return evidence or unavailable results; the join cannot mask missing data.
 */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);parent?.append(n);return n;}
function draw(model){
 const id='activity-'+model.id,width=1200,height=model.id==='p2'?2357:1697,ACTION_W=260,ACTION_H=68;
 const svg=el('svg',{xmlns:NS,viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':model.name+' — portrait UML Activity Diagram','data-parent':model.id});
 const defs=el('defs',{},svg),marker=el('marker',{id:id+'-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:8.5,markerHeight:8.5,orient:'auto'},defs);
 el('style',{},defs).textContent='text{font-family:Arial,Helvetica,sans-serif;fill:#000}.line{fill:none;stroke:#000;stroke-width:2.2}';
 el('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#000'},marker);
 const edges=el('g',{},svg),shapes=el('g',{},svg),labels=el('g',{},svg),nodes={},routes=[],mapped=new Set();
 function text(parent,x,y,value,size=22,bold=false){const rows=value.split('\n'),t=el('text',{'text-anchor':'middle','font-size':size,'font-weight':bold?700:400,style:'fill:#000'},parent);rows.forEach((row,i)=>el('tspan',{x,y:y+(i-(rows.length-1)/2)*size*1.16+size*.34},t).textContent=row);return t;}
 const titles={p1:'User Access & Accounts',p2:'Reservations, Availability & Approvals',p3:'Laboratory Questions',p4:'Equipment & Borrowing',p5:'Laboratory Administration & Reporting'};
 text(labels,600,32,titles[model.id]+' — Activity Diagram',29,true);
 const precondition={p1:'Login: any role. Create / update Faculty or Class Rep. accounts: signed-in Head Laboratory only.',p2:'Precondition: signed-in requester or routed Faculty / Dean; permitted operations only.',p3:'Precondition: signed-in Class Representative or Faculty; informational Q&A only.',p4:'Precondition: signed-in Head Laboratory or Staff within the assigned laboratory.',p5:'Precondition: signed-in Head Laboratory; Class Representative: assigned-class student clearance only.'}[model.id];
 if(model.id==='p2') text(labels,600,77,'Class Rep.: choose Group or Student Only for BOTH schedule variants. Student Only = one selected class student.\nOn-schedule → Faculty; out-of-schedule → Faculty, then Dean. Faculty request rules remain unchanged.',16);
 else text(labels,600,83,precondition,20);
 function action(key,x,y,title,child){
  const g=el('g',{'data-activity-node':key,'data-uml-kind':'action'},shapes);nodes[key]={x:x-ACTION_W/2,y:y-ACTION_H/2,w:ACTION_W,h:ACTION_H,kind:'action',title};
  if(child!==undefined){const ref=model.id+'.'+(child+1);g.setAttribute(mapped.has(ref)?'data-child-ref':'data-child-process',ref);g.setAttribute('data-child-name',model.steps[child]);mapped.add(ref);}
  el('rect',{x:x-ACTION_W/2,y:y-ACTION_H/2,width:ACTION_W,height:ACTION_H,rx:10,fill:'#fff',stroke:'#000','stroke-width':2.2},g);text(g,x,y,title,21,true);
 }
 function decision(key,x,y,title){const w=180,h=92;nodes[key]={x:x-w/2,y:y-h/2,w,h,kind:'decision',title};const g=el('g',{'data-decision':key},shapes);el('path',{d:`M${x} ${y-h/2} L${x+w/2} ${y} L${x} ${y+h/2} L${x-w/2} ${y} Z`,fill:'#fff',stroke:'#000','stroke-width':2.2,'data-activity-node':key,'data-uml-kind':'decision'},g);text(g,x,y,title,18);}
 function terminal(key,x,y,final=false){nodes[key]={x:x-22,y:y-22,w:44,h:44,kind:final?'final':'initial'};if(final)el('circle',{cx:x,cy:y,r:22,fill:'#fff',stroke:'#000','stroke-width':2.6},shapes);el('circle',{cx:x,cy:y,r:final?14:22,fill:'#000','data-activity-node':key,'data-uml-kind':final?'final':'initial'},shapes);}
 function bar(key,x,y,kind){nodes[key]={x:x-280,y:y-6,w:560,h:12,kind};el('rect',{x:x-280,y:y-6,width:560,height:12,fill:'#000','data-activity-node':key,'data-uml-kind':kind},shapes);}
 function point(key,side){if(Array.isArray(side))return side;const n=nodes[key];return side==='l'?[n.x,n.y+n.h/2]:side==='r'?[n.x+n.w,n.y+n.h/2]:side==='t'?[n.x+n.w/2,n.y]:[n.x+n.w/2,n.y+n.h];}
 function label(x,y,value,size=19){const t=text(labels,x,y,value,size);t.setAttribute('style','fill:#000;stroke:#fff;stroke-width:6px;paint-order:stroke;stroke-linejoin:round');}
 function link(from,fs,to,ts,bends=[],guard,position){const points=[point(from,fs),...bends,point(to,ts)];el('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),class:'line',style:'fill:none;stroke:#000;stroke-width:2.2','marker-end':'url(#'+id+'-arrow)','data-control-from':from,'data-control-to':to,...(guard?{'data-guard':guard}:{})},edges);routes.push({from,to,points,guard:guard||null});if(guard&&position)label(position[0],position[1],guard);}
 function dispatchStart(){terminal('start',200,125);action('choose',200,200,'Choose permitted\noperation');link('start','b','choose','t');}
 function row(key,y,question,input,condition,result,child,preChild){
  if(model.id==='p2'&&key==='request'){
   decision('request-choice',200,y,question);action('request-input',600,y,'Select class / block;\ncheck items and slots',0);decision('request-role',980,y,'Class Rep.?');
   link('request-choice','r','request-input','l',[],'[Yes]',[375,y-20]);link('request-input','r','request-role','l');
   action('select-type',980,y+120,'Confirm / select\nReservation Type');decision('reservation-type',980,y+240,'Group or\nStudent Only?');
   link('request-role','b','select-type','t',[],'[Yes]',[1045,y+65]);link('select-type','b','reservation-type','t');
   action('group-info',600,y+360,'Confirm existing\ngroup / members');action('individual-info',980,y+360,'Select one student\nfrom assigned class');
   link('reservation-type','l','group-info','t',[[600,y+240]],'[Group]',[740,y+217]);link('reservation-type','b','individual-info','t',[],'[Student Only]',[1055,y+297]);
   bar('type-merge',790,y+470,'join');nodes['type-merge'].joinSpec='or';shapes.querySelector('[data-activity-node="type-merge"]').setAttribute('data-join-spec','or');label(655,y+505,'{joinSpec = or}',17);
   link('group-info','b','type-merge',[600,y+464]);link('individual-info','b','type-merge',[980,y+464]);
   decision('request-valid',980,y+590,'Type / request\nvalid?');link('type-merge','b','request-valid','t',[[790,y+520],[980,y+520]]);
   link('request-role','r','type-merge','t',[[1180,y],[1180,y+410],[790,y+410]],'[No: Faculty]',[1090,y+205]);
   action('request-save',980,y+695,'Save type, request, hold;\nroute if required',1);action('request-error',600,y+695,'Show correction;\nno record or hold');
   link('request-valid','b','request-save','t',[],'[Yes]',[1030,y+653]);link('request-valid','l','request-error','t',[[600,y+590]],'[No]',[711,y+567]);
   terminal('request-end',1140,y+772,true);terminal('request-error-end',430,y+772,true);link('request-save','r','request-end','t',[[1140,y+695]]);link('request-error','l','request-error-end','t',[[430,y+695]]);return;
  }
  decision(key+'-choice',200,y,question);action(key+'-input',600,y,input,preChild);decision(key+'-valid',980,y,condition);
  action(key+'-save',980,y+105,result,child);action(key+'-error',600,y+105,key==='approval'?'Show current status;\nno decision applied':'Show correction;\nmake no change');
  const compact=model.id==='p2';terminal(key+'-end',compact?1140:980,y+182,true);terminal(key+'-error-end',compact?430:600,y+182,true);
  link(key+'-choice','r',key+'-input','l',[],'[Yes]',[375,y-20]);link(key+'-input','r',key+'-valid','l');
  link(key+'-valid','b',key+'-save','t',[],'[Yes]',[1030,y+61]);
  link(key+'-valid',[935,y+23],key+'-error','r',[[800,y+23],[800,y+105]],'[No]',[827,y+72]);
  if(compact){link(key+'-save','r',key+'-end','t',[[1140,y+105]]);link(key+'-error','l',key+'-error-end','t',[[430,y+105]]);}
  else {link(key+'-save','b',key+'-end','t');link(key+'-error','b',key+'-error-end','t');}
 }
 function dispatch(rows){dispatchStart();rows.forEach((r,i)=>{row(...r);if(i===0)link('choose','b',r[0]+'-choice','t');else link(rows[i-1][0]+'-choice','b',r[0]+'-choice','t',[],'[No]',[243,(rows[i-1][1]+r[1])/2]);});}
 function refuseOther(last,y){action('other',200,y,'No permitted\noperation selected');terminal('other-end',200,y+85,true);link(last+'-choice','b','other','t',[],'[No]',[243,y-68]);link('other','b','other-end','t');}
 if(model.id==='p1'){
  terminal('start',600,165);action('choose',600,260,'Choose access\noperation');link('start','b','choose','t');decision('operation',600,390,'Log in?');link('choose','b','operation','t');
  for(const [key,x,login]of [['login',350,true],['account',850,false]]){
   action(key+'-input',x,550,login?'Enter credentials':'Enter verified details;\nFaculty / Class Rep.');action(key+'-check',x,710,login?'Validate credentials':'Check role, ID, section;\nclass / Faculty links',login?0:undefined);
   decision(key+'-valid',x,860,'Valid?');action(key+'-save',x,1020,login?'Establish role-scoped\nsession':'Create / update details\nand active status',login?1:2);action(key+'-result',x,1180,login?'View role dashboard':'If new: email Faculty;\nFaculty hands to Rep.');
   action(key+'-error',x,1380,login?'Show login error;\nno session created':'Show correction;\nno account changed');terminal(key+'-end',x,1600,true);
   link('operation',login?'l':'r',key+'-input','t',[[x,390]],login?'[Yes]':'[No: manage accounts, Head]',[x,461]);link(key+'-input','b',key+'-check','t');link(key+'-check','b',key+'-valid','t');link(key+'-valid','b',key+'-save','t',[],'[Yes]',[x+50,947]);link(key+'-save','b',key+'-result','t');
   const errorTrack=login?40:1160,successTrack=login?130:1070;
   link(key+'-valid',login?'l':'r',key+'-error',login?'l':'r',[[errorTrack,860],[errorTrack,1380]],'[No]',[login?110:1090,838]);link(key+'-result',login?'l':'r',key+'-end',login?'l':'r',[[successTrack,1180],[successTrack,1600]]);link(key+'-error','b',key+'-end','t');
  }
 }else if(model.id==='p3'){
  terminal('start',600,170);action('ask',600,290,'Ask laboratory\nquestion');action('capture',600,450,'Capture inquiry',0);decision('scope',600,620,'Permitted?');link('start','b','ask','t');link('ask','b','capture','t');link('capture','b','scope','t');
  action('records',350,820,'Retrieve authorized\nrecords',1);action('answer',350,1030,'Answer from evidence /\nstate unavailable',2);action('history',350,1240,'Record question\nand answer',3);action('result',350,1440,'Read answer');terminal('end',350,1610,true);
  link('scope','l','records','t',[[350,620]],'[Yes]',[350,720]);link('records','b','answer','t');link('answer','b','history','t');link('history','b','result','t');link('result','b','end','t');
  action('decline',850,820,'Decline; explain\nallowed questions');action('refusal-history',850,1240,'Record question\nand refusal',3);action('refusal-result',850,1440,'Read refusal');terminal('refusal-end',850,1610,true);link('scope','r','decline','t',[[850,620]],'[No]',[850,720]);link('decline','b','refusal-history','t');link('refusal-history','b','refusal-result','t');link('refusal-result','b','refusal-end','t');
 }else if(model.id==='p2'){
  dispatch([
   ['availability',300,'View slots?', 'Choose laboratory\nand schedule','Allowed?', 'Retrieve and display\navailability',0],
   ['request',520,'Submit /\nreschedule?', 'Select class / block;\ncheck items and slots','Valid?', 'Save request & holds;\nroute if required',1,0],
   ['cancel',1400,'Cancel?', 'Select own request;\nconfirm cancellation','Eligible?', 'Cancel; release hold;\nnotify if needed',1],
   ['tracking',1620,'View\ntracking?', 'Open own status\nor history','Own records?', 'Display own status\nand history',3]
  ]);
  decision('approval-choice',200,1850,'Decide?');link('tracking-choice','b','approval-choice','t',[],'[No]',[243,1735]);
  action('approval-input',600,1850,'Faculty / Dean:\nApprove or Reject',2);decision('approval-valid',980,1850,'Pending for\nthis reviewer?');
  link('approval-choice','r','approval-input','l',[],'[Yes]',[375,1830]);link('approval-input','r','approval-valid','l');
  action('approval-error',600,1955,'Show current status;\nno decision applied');terminal('approval-error-end',600,2032,true);
  link('approval-valid',[935,1873],'approval-error','r',[[800,1873],[800,1955]],'[No]',[834,1920]);link('approval-error','b','approval-error-end','t');
  decision('decision-approved',980,2060,'Approve?');link('approval-valid','b','decision-approved','t',[],'[Yes]',[1030,1960]);
  decision('dean-required',600,2120,'Dean still\nrequired?');link('decision-approved','l','dean-required','r',[[780,2060],[780,2120]],'[Yes]',[818,2040]);
  action('approval-rejected',980,2245,'Save Rejected;\nrelease hold');terminal('approval-rejected-end',980,2322,true);
  link('decision-approved','b','approval-rejected','t',[],'[No]',[1030,2165]);link('approval-rejected','b','approval-rejected-end','t');
  action('approval-pending',200,2170,'Keep Pending Dean;\nretain hold; route');terminal('approval-pending-end',200,2280,true);
  link('dean-required','l','approval-pending','t',[[200,2120]],'[Yes]',[375,2098]);link('approval-pending','b','approval-pending-end','t');
  action('approval-final',600,2245,'Save final Approved;\nretain hold');terminal('approval-final-end',600,2322,true);
  link('dean-required','b','approval-final','t',[],'[No]',[650,2183]);link('approval-final','b','approval-final-end','t');
  refuseOther('approval',1970);
 }else if(model.id==='p4'){
  dispatch([
   ['inventory',365,'Catalogue?', 'Search / enter\ninventory change','Valid?', 'Maintain inventory;\nshow catalogue',0],
   ['issue',715,'Issue?', 'Retrieve finally approved\nreservation','Final approval;\nstock valid?', 'Issue items; save slip,\nstock & Ongoing status',2,1],
   ['return',1065,'Return?', 'Enter return quantities\nand condition','Within issue?', 'Reconcile; complete\nonly with no balance',3],
   ['disposal',1415,'Dispose?', 'Select physical waste\nand quantity','Disposable?', 'Record disposal;\nadjust stock once',4]
  ]);refuseOther('disposal',1530);
 }else{
  dispatch([
   ['schedule',305,'Schedule?', 'Head: enter\nschedule block','Valid; no\nconflict?', 'Maintain schedule;\npublish vacant blocks',0],
   ['logs',565,'Daily task?', 'Head: enter\ndaily task','Valid?', 'Save daily task;\nconfirm saved record',1],
   ['clearance',825,'Clearance?', 'Head: identify student\nRep.: view status only','Allowed /\nvalid?', 'Head: create / settle;\nRep.: view status',2]
  ]);
  action('term',200,1000,'Head: open Physics /\nCircuits logs');link('clearance-choice','b','term','t',[],'[No: report]',[274,891]);
  bar('report-fork',780,1130,'fork');link('term','b','report-fork','t',[[200,1100],[780,1100]]);
  action('read-usage',570,1230,'Read automatic logs of\ncompleted reservations');action('read-stock',990,1230,'Read inventory and\nborrowing-slip data');
  nodes['read-usage'].stores=['d2','d3'];nodes['read-stock'].stores=['d4','d5'];
  link('report-fork',[570,1136],'read-usage','t');link('report-fork',[990,1136],'read-stock','t');
  bar('report-join',780,1320,'join');link('read-usage','b','report-join',[570,1314]);link('read-stock','b','report-join',[990,1314]);
  label(780,1166,'Fork: independent reads',18);label(780,1290,'Join: wait for both results',18);
  decision('records-ready',780,1380,'Any completed\nusage records?');link('report-join','b','records-ready','t');
  action('metrics',780,1485,'Compute item use,\ntop 5 & session shares',3);action('report',780,1590,'Show report;\nexport if requested',4);terminal('report-end',780,1670,true);
  link('records-ready','b','metrics','t',[],'[Yes]',[836,1428]);link('metrics','b','report','t');link('report','b','report-end','t');
  action('incomplete',400,1485,'Show no records\nfor this term');terminal('incomplete-end',400,1600,true);link('records-ready','l','incomplete','t',[[400,1380]],'[No]',[507,1359]);link('incomplete','b','incomplete-end','t');
 }
 window.SystemActivityGeometry=window.SystemActivityGeometry||{};window.SystemActivityGeometry[model.id]={nodes,routes,width,height,precondition,actionSize:[ACTION_W,ACTION_H]};return svg;
}
window.SystemProcessActivity=draw;
})();
