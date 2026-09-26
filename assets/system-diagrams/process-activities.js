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
 const id='activity-'+model.id,width=1200,height=model.id==='p2'?2710:model.id==='p4'?2300:1697,ACTION_W=260,ACTION_H=68;
 const svg=el('svg',{xmlns:NS,viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':model.name+' — portrait UML Activity Diagram','data-parent':model.id});
 const defs=el('defs',{},svg),marker=el('marker',{id:id+'-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:8.5,markerHeight:8.5,orient:'auto'},defs);
 el('style',{},defs).textContent='text{font-family:Arial,Helvetica,sans-serif;fill:#000}.line{fill:none;stroke:#000;stroke-width:2.2}';
 el('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#000'},marker);
 const edges=el('g',{},svg),shapes=el('g',{},svg),labels=el('g',{},svg),nodes={},routes=[],mapped=new Set();
 function text(parent,x,y,value,size=22,bold=false){const rows=value.split('\n'),t=el('text',{'text-anchor':'middle','font-size':size,'font-weight':bold?700:400,style:'fill:#000'},parent);rows.forEach((row,i)=>el('tspan',{x,y:y+(i-(rows.length-1)/2)*size*1.16+size*.34},t).textContent=row);return t;}
 const precondition={p1:'Login: any role. Create / update Faculty or Class Rep. accounts: signed-in Head Laboratory only.',p2:'Precondition: signed-in requester or routed Faculty / Dean; permitted operations only.',p3:'Precondition: signed-in Class Representative or Faculty; informational Q&A only.',p4:'Precondition: signed-in Head Laboratory or Staff within the assigned laboratory.',p5:'Precondition: signed-in Head Laboratory; Class Representative: assigned-class student clearance only.'}[model.id];
 if(model.id==='p2') text(labels,600,65,'Class Rep.: choose Group or Student Only for BOTH schedule variants.\nStudent Only = one selected class student. On-schedule → Faculty.\nOut-of-schedule → available Faculty, or Dean if Faculty is unavailable.',18);
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
 function label(x,y,value,size=19){if(value.includes('joinSpec'))return;x=Math.max(value.length*size*.29+8,Math.min(1200-value.length*size*.29-8,x));const t=text(labels,x,y,value,size);t.setAttribute('style','fill:#000;stroke:#fff;stroke-width:6px;paint-order:stroke;stroke-linejoin:round');}
 function readableGuard(from,guard){
  if(!guard)return guard;
  const pairs={operation:['Log in','Manage accounts'],scope:['In scope','Out of scope'],'request-role':['Class Rep.','Faculty'],'approval-requester':['Class Rep.','Faculty'],'classrep-schedule':['On-schedule','Out-of-schedule'],'faculty-schedule':['On-schedule','Out-of-schedule'],'faculty-available':['Available','Unavailable'],'forecast-valid':['Sufficient history','Insufficient history'],'records-ready':['Records found','No records'],'login-valid':['Valid credentials','Invalid credentials'],'account-valid':['Valid details','Invalid details'],'request-valid':['Valid request','Invalid request'],'availability-valid':['Allowed','Not allowed'],'cancel-valid':['Eligible','Not eligible'],'tracking-valid':['Own records','Not own records'],'inventory-valid':['Valid change','Invalid change'],'issue-valid':['Approved; stock valid','Not issuable'],'return-valid':['Within issued qty','Invalid return qty'],'disposal-valid':['Disposable','Not disposable'],'schedule-valid':['Valid; no conflict','Invalid / conflict'],'logs-valid':['Valid task','Invalid task'],'clearance-valid':['Authorized; valid','Not allowed / invalid']};
  const yes=/^\[Yes/.test(guard),no=/^\[No/.test(guard);if(!yes&&!no)return guard.replace(/^\[|\]$/g,'');
  if(pairs[from])return pairs[from][yes?0:1];
  if(from.endsWith('-choice')){const names={availability:'View slots',request:'Submit / reschedule',cancel:'Cancel request',tracking:'View tracking',approval:'Review request',inventory:'Catalogue',issue:'Issue items',return:'Return items',disposal:'Disposal',forecast:'Forecast: Head Lab',schedule:'Schedule',logs:'Daily task',clearance:'Clearance'};return yes?names[from.slice(0,-7)]||'Selected':guard.includes('report')?'Report selected':'Other operation';}
  return guard.replace(/^\[(?:Yes|No):\s*/,'').replace(/\]$/,'');
 }
 function link(from,fs,to,ts,bends=[],guard,position){const points=[point(from,fs),...bends,point(to,ts)];el('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),class:'line',style:'fill:none;stroke:#000;stroke-width:2.2','marker-end':'url(#'+id+'-arrow)','data-control-from':from,'data-control-to':to,...(guard?{'data-guard':guard}:{})},edges);routes.push({from,to,points,guard:guard||null,displayGuard:readableGuard(from,guard)||null});if(guard&&position)label(position[0],position[1],readableGuard(from,guard),position[2]||16);}
 function dispatchStart(){terminal('start',200,125);action('choose',200,200,'Choose permitted\noperation');link('start','b','choose','t');}
 function row(key,y,question,input,condition,result,child,preChild){
  if(model.id==='p2'&&key==='request'){
   decision('request-choice',200,y,question);action('request-input',600,y,'1 Choose Laboratory;\nFaculty: activity kind',0,18);decision('request-role',980,y,'Class Rep.?');
   link('request-choice','r','request-input','l',[],'[Yes]',[375,y-20]);link('request-input','r','request-role','l');
   action('select-type',980,y+110,'2 Choose Request Type;\nretain on reschedule',undefined,18);decision('reservation-type',980,y+220,'Group or\nStudent Only?');
   link('request-role','b','select-type','t',[],'[Yes]',[1130,y+52]);link('select-type','b','reservation-type','t');
   // Step 2 records the mode only. The eligible members / one student are
   // selected after the authorized class is chosen in Step 4.
   action('group-info',600,y+220,'Use Group choice');action('individual-info',600,y+330,'Use Student Only choice');
   link('reservation-type','l','group-info','r',[],'[Group]',[810,y+192]);
   link('reservation-type','b','individual-info','r',[[980,y+330]],'[Student Only]',[850,y+299]);
   bar('type-merge',600,y+430,'join');nodes['type-merge'].joinSpec='or';shapes.querySelector('[data-activity-node="type-merge"]').setAttribute('data-join-spec','or');
   // The incoming request enters the left tip; the Faculty alternative leaves
   // the lower-left edge and travels on its own, lower horizontal corridor.
   link('request-role',[935,y+23],'type-merge',[350,y+424],[[935,y+60],[350,y+60]],'[No: Faculty]',[810,y+87]);
   link('group-info','l','type-merge',[440,y+424],[[440,y+220]]);
   link('individual-info','b','type-merge',[600,y+424]);
   // Faculty Laboratory Activity displays its assigned schedule here,
   // rather than offering a Schedule Type choice. Figure 16 expands this
   // activity-kind branch; other request modes choose Schedule Type.
   action('request-schedule-type',600,y+500,'3 Schedule Type;\nlab activity: assigned block;\nread route preview',2,16);
   action('request-room',980,y+500,'4 Class, room, date, time;\nblock & eligible students',0,18);
   action('request-items',980,y+610,'5 Equipment / Materials;\nrequested quantities',undefined,18);
   action('request-review',600,y+610,'6 Review Information;\nroute read-only; Submit',undefined,18);
   link('type-merge','b','request-schedule-type','t');link('request-schedule-type','r','request-room','l');
   link('request-room','b','request-items','t');link('request-items','l','request-review','r');
   decision('request-valid',350,y+610,'Details / route\nvalid?');link('request-review','l','request-valid','r');
   action('request-save',640,y+750,'Save request & holds;\nPending if routed',1,18);
   action('request-confirm',980,y+750,'Show saved status;\nCurrent Reviewer if routed',3,18);
   action('request-error',350,y+750,'Show correction;\nno new record or hold',undefined,18);
   link('request-valid','b','request-save','t',[[350,y+670],[640,y+670]],'[Yes]',[730,y+670]);
   link('request-valid','l','request-error','t',[[240,y+610],[240,y+680],[350,y+680]],'[No]',[430,y+700]);
   link('request-save','r','request-confirm','l');
   terminal('request-end',790,y+805,true);terminal('request-error-end',310,y+825,true);
   link('request-confirm','b','request-end','r',[[980,y+805]]);link('request-error','b','request-error-end','r',[[350,y+825]]);return;
  }
  if(model.id==='p2'&&['availability','cancel','tracking'].includes(key)){
   // Keep the success and correction routes apart until they enter distinct
   // sides of one Flow Final. Neither arrow joins another line.
   decision(key+'-choice',200,y,question);action(key+'-input',480,y,input,preChild);decision(key+'-valid',760,y,condition);
   action(key+'-save',760,y+105,result,child);action(key+'-error',1050,y,'Show correction;\nmake no change');terminal(key+'-end',1050,y+105,true);
   link(key+'-choice','r',key+'-input','l',[],'[Yes]',[320,y+75,14]);link(key+'-input','r',key+'-valid','l');
   link(key+'-valid','r',key+'-error','l',[],'[No]',[key==='cancel'?1090:885,y-(key==='cancel'?55:70),14]);
   link(key+'-valid','b',key+'-save','t',[],'[Yes]',[930,y+52,14]);
   link(key+'-error','b',key+'-end','t');link(key+'-save','r',key+'-end','l');
   return;
  }
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
  dispatch([
   ['availability',300,'View slots?', 'Choose laboratory\nand schedule','Allowed?', 'Retrieve and display\navailability',0],
   ['request',520,'Submit /\nreschedule?', 'Select class / block;\ncheck items and slots','Valid?', 'Save request & holds;\nroute if required',1,0],
   ['cancel',1400,'Cancel?', 'Select own request;\nconfirm cancellation','Eligible?', 'Cancel; release hold;\nnotify if needed',1],
   ['tracking',1620,'View\ntracking?', 'Open own status\nor history','Own records?', 'Display own status\nand history',3]
  ]);
   decision('approval-choice',200,1850,'Review /\nroute request?');link('tracking-choice','b','approval-choice','t',[],'[No]',[280,1735]);
  action('approval-input',500,1850,'Check requester\nand schedule',2);decision('approval-requester',800,1850,'Class Rep.?');
   link('approval-choice','r','approval-input','l',[],'[Yes]',[330,1790]);link('approval-input','r','approval-requester','l');

  // The short bars join alternative routes (OR), not simultaneous branches.
  // Class Representative requests reviewed by Faculty share one review path.
  decision('classrep-schedule',720,1970,'On-schedule?');
   link('approval-requester','b','classrep-schedule','t',[[800,1908],[720,1908]],'[Yes: Class Rep.]',[640,1900]);
  decision('faculty-available',400,2080,'Faculty\navailable?');
  link('classrep-schedule','l','faculty-available','t',[[400,1970]],'[No]',[510,1942]);
  approvalJoin('faculty-merge',700,2170);
  link('classrep-schedule','b','faculty-merge',[720,2164],[],'[Yes]',[790,2060]);
   link('faculty-available','b','faculty-merge',[635,2164],[[400,2150],[635,2150]],'[Yes]',[565,2123]);
  action('classrep-faculty-review',700,2250,'Faculty: review\nApprove or Reject');
  action('classrep-final',700,2335,'Save final\nApproved / Rejected');terminal('classrep-final-end',930,2335,true);
  link('faculty-merge','b','classrep-faculty-review','t');
  link('classrep-faculty-review','b','classrep-final','t');link('classrep-final','r','classrep-final-end','l');

  // Faculty on-schedule activities need no approval. Either eligible
  // out-of-schedule route meets at the Dean's final review.
  decision('faculty-schedule',1000,1970,'On-schedule?');
  link('approval-requester','r','faculty-schedule','t',[[1000,1850]],'[No: Faculty]',[1010,1827]);
  action('faculty-regular',1000,2100,'Save on-schedule\nrequest; no approval');terminal('faculty-regular-end',1000,2210,true);
  link('faculty-schedule','b','faculty-regular','t',[],'[Yes]',[1060,2035]);link('faculty-regular','b','faculty-regular-end','t');
  approvalJoin('dean-merge',700,2410);
  link('faculty-available','l','dean-merge','l',[[150,2080],[150,2410]],'[No]',[250,2383]);
   link('faculty-schedule','r','dean-merge','r',[[1180,1970],[1180,2410]],'[No]',[1130,1912]);
  action('dean-review',700,2490,'Dean: final\nApprove or Reject');
  action('dean-final',700,2575,'Save final\nApproved / Rejected');terminal('dean-final-end',700,2660,true);
  link('dean-merge','b','dean-review','t');link('dean-review','b','dean-final','t');link('dean-final','b','dean-final-end','t');
  action('other',200,1970,'No permitted\noperation selected');terminal('other-end',100,2055,true);
   link('approval-choice','b','other','t',[],'[No]',[280,1910]);link('other','b','other-end','t',[[200,2020],[100,2020]]);
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
 window.SystemActivityGeometry=window.SystemActivityGeometry||{};window.SystemActivityGeometry[model.id]={nodes,routes,width,height,precondition,actionSize:[ACTION_W,ACTION_H]};return svg;
}
window.SystemProcessActivity=draw;
})();
