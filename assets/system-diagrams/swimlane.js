/* Whole-system responsibility overview. Head Laboratory is already signed in.
 * Account handover precedes requester login. Administration remains in its
 * own lane and never gates a requester's reservation. Activities 1-5 contain
 * the detailed validation, login failures and submission alternatives. */
(function(){
'use strict';
window.SystemPortraitSwimlane=function(id){
 const NS='http://www.w3.org/2000/svg',partitionScale=1.5,bodyOffset=50,width=3780,height=6440,nodes={},routes=[];
 const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));parent?.append(n);return n;};
 const svg=el('svg',{xmlns:NS,viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'Overall laboratory service UML swimlane: six actor partitions',class:'swimlane-flowchart'});
 el('style',{},svg).textContent='.swimlane-flowchart text{font-family:Arial,Helvetica,sans-serif;fill:#000}.swimlane-flowchart .line{fill:none;stroke:#000;stroke-width:3}.swimlane-flowchart .lane-bg,.swimlane-flowchart .flow-shape{fill:#fff;stroke:#000;stroke-width:2.5}';
 const defs=el('defs',{},svg),marker=el('marker',{id:id+'-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:9,markerHeight:9,orient:'auto'},defs);
 el('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#000'},marker);
 const lanes=el('g',{},svg),edges=el('g',{},svg),shapes=el('g',{},svg),labels=el('g',{},svg);
 const bounds=[2,420,840,1260,1680,2100,2518],centers=[210,630,1050,1470,1890,2310];
 function text(parent,x,y,value,size=27,bold=false){
  const rows=value.split('\n'),t=el('text',{'text-anchor':'middle','font-size':size,'font-weight':bold?700:400},parent);
  rows.forEach((row,i)=>el('tspan',{x,y:y+(i-(rows.length-1)/2)*size*1.12+size*.33},t).textContent=row);return t;
 }
 text(lanes,width/2,32,'Laboratory Management - Overall Swimlane',50,true);
 ['Class Representative','Faculty','Circuit Staff','Physics Staff','Head Lab','Dean'].forEach((name,i)=>{
  el('rect',{x:bounds[i]*partitionScale,y:62,width:(bounds[i+1]-bounds[i])*partitionScale,height:height-74,class:'lane-bg','data-lane':i,'data-lane-name':name},lanes);
  el('line',{x1:bounds[i]*partitionScale,x2:bounds[i+1]*partitionScale,y1:170,y2:170,stroke:'#000','stroke-width':3},lanes);
  text(lanes,centers[i]*partitionScale,116,name,45,true).setAttribute('data-lane-header',i);
 });
 function node(key,lane,y,title,kind='action',process){
  if(kind==='final'&&key!=='end')kind='flow-final';
  const x=centers[lane];let w=338,h=Math.max(82,title.split('\n').length*27+20);
  if(kind==='decision'){w=key==='faculty-available'?320:title.includes('\n')?310:290;h=key==='faculty-available'?140:title.includes('\n')?130:100;}
  if(['initial','final','flow-final'].includes(kind)){w=46;h=46;}
  if(kind==='fork'||kind==='join'){w=320;h=16;}
  if(key==='dean-route'){w=240;h=16;}
  if(key==='dean'){w=300;}
  const n={x:x-w/2,y:y-h/2,w,h,lane,kind,title};nodes[key]=n;
  const g=el('g',{'data-swimlane-node':key,'data-uml-kind':kind,...(process?{'data-process':process}:{})},shapes);
  if(kind==='decision')el('path',{d:'M'+x+' '+n.y+' L'+(n.x+w)+' '+y+' L'+x+' '+(n.y+h)+' L'+n.x+' '+y+' Z',class:'flow-shape'},g);
  else if(['initial','final','flow-final'].includes(kind)){
   el('circle',{cx:x,cy:y,r:23,fill:kind==='initial'?'#000':'#fff',stroke:'#000','stroke-width':3},g);
   if(kind==='final')el('circle',{cx:x,cy:y,r:15,fill:'#000'},g);
   if(kind==='flow-final')el('path',{d:'M'+(x-14)+' '+(y-14)+' L'+(x+14)+' '+(y+14)+' M'+(x+14)+' '+(y-14)+' L'+(x-14)+' '+(y+14),fill:'none',stroke:'#000','stroke-width':3},g);
  }else if(kind==='fork'||kind==='join')el('rect',{x:n.x,y:n.y,width:w,height:h,rx:8,fill:'#000'},g);
  else el('rect',{x:n.x,y:n.y,width:w,height:h,rx:h/2,class:'flow-shape'},g);
  const rowCount=title.split('\n').length;
  if(title)text(g,x,y,title,kind==='decision'?(key==='faculty-available'?23:27):(rowCount>4?25:rowCount===4?26:rowCount===3?27:31),kind==='action');return n;
 }
 const act=(key,lane,y,title,p)=>node(key,lane,y,title,'action',p),dec=(key,lane,y,title)=>node(key,lane,y,title,'decision');
 function join(key,lane,y){const n=node(key,lane,y,'','join');n.joinSpec='or';shapes.querySelector('[data-swimlane-node="'+key+'"]').setAttribute('data-join-spec','or');return n;}
 // Named, separated top-face ports. Use a center port for an aligned input,
 // otherwise the nearest free side that keeps incoming corridors independent.
 function joinPort(key,side='center'){
  const n=nodes[key],offset=Math.min(100,n.w/2-40);
  return[n.x+n.w/2+(side==='left'?-offset:side==='right'?offset:0),n.y];
 }
 function point(key,side){if(Array.isArray(side))return side.slice(0,2);const n=nodes[key];return side==='l'?[n.x,n.y+n.h/2]:side==='r'?[n.x+n.w,n.y+n.h/2]:side==='t'?[n.x+n.w/2,n.y]:[n.x+n.w/2,n.y+n.h];}
 function readableGuard(from,guard){
  const pairs={question:['Help needed','No help needed'],'classrep-schedule':['On-schedule','Out-of-schedule'],'faculty-available':['Available','Unavailable'],'faculty-approved':['Approved','Rejected'],'dean-approved':['Approved','Rejected'],'faculty-scheduled':['On-schedule\nNo approval','Out-of-schedule\nPending: Dean'],balance:['Broken / lost','No broken / lost']};
  return guard&&pairs[from]&&/^\[(Yes|No)\]$/.test(guard)?pairs[from][guard==='[Yes]'?0:1]:guard?guard.replace(/^\[|\]$/g,''):guard;
 }
 function link(from,fs,to,ts,bends=[],guard,at){
  const points=[point(from,fs),...bends,point(to,ts)],clean=points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]);let d='M'+clean[0].join(' ');
  for(let i=1;i<clean.length-1;i++){
   const a=clean[i-1],b=clean[i],c=clean[i+1],before=Math.hypot(b[0]-a[0],b[1]-a[1]),after=Math.hypot(c[0]-b[0],c[1]-b[1]),turn=(b[0]-a[0])*(c[1]-b[1])!==(b[1]-a[1])*(c[0]-b[0]);
   if(!turn){d+=' L'+b.join(' ');continue;}
   const r=Math.min(12,before/3,after/3),entry=[b[0]-(b[0]-a[0])*r/before,b[1]-(b[1]-a[1])*r/before],exit=[b[0]+(c[0]-b[0])*r/after,b[1]+(c[1]-b[1])*r/after];d+=' L'+entry.join(' ')+' Q'+b.join(' ')+' '+exit.join(' ');
  }
  d+=' L'+clean[clean.length-1].join(' ');
  // A white underlay bridges crossings without joining unrelated flows.
  el('path',{d,fill:'none',stroke:'#fff','stroke-width':8},edges);
  el('path',{d,class:'line','marker-end':'url(#'+id+'-arrow)','data-control-from':from,'data-control-to':to,...(guard?{'data-guard':guard}:{})},edges);
  routes.push({from,to,points:clean,guard:guard||null});
  if(guard&&at){const display=readableGuard(from,guard),t=text(labels,at[0],at[1],display,32,true);t.setAttribute('style','fill:#000;stroke:#fff;stroke-width:7;stroke-linejoin:round;paint-order:stroke');t.setAttribute('data-flow-label',from+'-to-'+to);t.setAttribute('data-label-text',display);t.setAttribute('data-label-x',at[0]);t.setAttribute('data-label-y',at[1]);t.setAttribute('data-label-from',from);t.setAttribute('data-label-to',to);t.setAttribute('data-label-guard',guard);}
 }
 // Account setup and handover are completed before requester transactions.
 node('start',4,155,'','initial');
 act('admin',4,250,'Create Faculty account;\nissue credentials','p1');
 act('faculty-credentials',1,250,'Receive Faculty\ncredentials','p1');
 act('faculty-identity',1,375,'Send verified Class Rep.\nname, ID and section','p1');
 act('classrep-account',4,375,'Create Class Rep.\naccount and credentials','p1');
 node('headlab-fork',4,465,'','fork');
 act('faculty-handoff',1,465,'Receive Class Rep.\ncredentials; hand over','p1');
 node('faculty-fork',1,560,'','fork');
 act('classrep-receive',0,560,'Receive account\ncredentials from Faculty','p1');
 act('classrep-login',0,680,'Log in with\nissued credentials','p1');
 act('faculty-login',1,680,'Log in with\nissued credentials','p1');
 link('start','b','admin','t');link('admin','l','faculty-credentials','r');
 link('faculty-credentials','b','faculty-identity','t');link('faculty-identity','r','classrep-account','l');
 link('classrep-account','b','headlab-fork','t');link('headlab-fork','l','faculty-handoff','r');
 link('faculty-handoff','b','faculty-fork','t');link('faculty-fork','l','classrep-receive','r');link('faculty-fork','b','faculty-login','t');link('classrep-receive','b','classrep-login','t');
 // Head Lab operations are independent of both requester login paths.
 act('admin-tasks',4,585,'Maintain schedule /\ndaily tasks as needed','p5');
 act('forecast',4,710,'Review inventory\nforecast as needed','p4');node('headlab-ops-end',4,820,'','final');
 link('headlab-fork','b','admin-tasks','t');link('admin-tasks','b','forecast','t');link('forecast','b','headlab-ops-end','t');
 dec('question',0,810,'Need lab help?');act('ask',0,945,'Ask lab / equipment\ninfo or hours','p3');join('request-ready',0,1030);
 link('classrep-login','b','question','t');link('question','b','ask','t',[],'[Yes]',[300,875]);
 link('question','l','request-ready',joinPort('request-ready','left'),[[8,810],[8,990],[110,990]],'[No]',[100,875]);link('ask','b','request-ready',joinPort('request-ready'));
 // Laboratory selection is one form action, not parallel Physics / Circuits
 // work. Group and Student Only are exclusive modes; students are selected
 // later, after the authorized class is chosen.
 act('choose-laboratory',0,1119,'Choose laboratory:\nPhysics or Circuits','p2');dec('reservation-type',0,1255,'Group or\nStudent Only?');join('type-merge',0,1400);
 link('request-ready','b','choose-laboratory','t');link('choose-laboratory','b','reservation-type','t');
 link('reservation-type','l','type-merge',joinPort('type-merge','left'),[[25,1255],[25,1320],[110,1320]],'[Group]',[210,1338]);
 link('reservation-type','r','type-merge',joinPort('type-merge','right'),[[410,1255],[410,1320],[310,1320]],'[Student Only]',[310,1338]);
 act('schedule-type',0,1490,'Choose Schedule Type;\nOn- / Out-of-schedule;\nread routing-rule preview','p2');link('type-merge','b','schedule-type','t');
 act('request-details',0,1620,'Choose class / students;\nschedule, room and slot','p2');link('schedule-type','b','request-details','t');
 act('request-items',0,1750,'Equipment / Materials;\nrequested quantities','p2');link('request-details','b','request-items','t');
 act('request',0,1880,'Review Information;\nread-only Approval Route;\nSubmit Request','p2');link('request-items','b','request','t');
 dec('request-valid',0,2030,'Request valid?');link('request','b','request-valid','t');
 act('request-save',0,2180,'Save Pending revision;\nholds / current reviewer','p2');
 link('request-valid','b','request-save','t',[],'[Valid]',[305,2110]);
 act('request-error',0,2730,'Show correction;\nno new record or hold','p2');node('request-error-end',0,2850,'','final');
 link('request-valid','l','request-error','t',[[10,2030],[10,2650],[210,2650]],'[Invalid]',[105,2120]);link('request-error','b','request-error-end','t');
 // Saving and reviewer delivery do not depend on opening View Status.
 node('request-submitted',0,2290,'','fork');link('request-save','b','request-submitted','t');
 act('pending-status',0,2430,'Own Pending / reviewer;\nEligible edit / reschedule:\nrevalidate; recheck route;\nEligible cancel: release hold','p2');node('pending-status-end',0,2560,'','final');
 link('request-submitted','b','pending-status','t');link('pending-status','b','pending-status-end','t');
 // Faculty's assigned schedule is carried over for Laboratory Activity.
 act('faculty-request',1,799,'Choose laboratory:\nPhysics or Circuits','p2');
 dec('faculty-activity',1,935,'Laboratory\nActivity?');
 act('faculty-schedule-type',1,1105,'Choose Schedule Type;\nclass, date and time','p2');join('faculty-form-ready',1,1200);
 nodes['faculty-activity'].scheduleSource='assigned-class-schedule';
 link('faculty-login','b','faculty-request','t');link('faculty-request','b','faculty-activity','t');
 link('faculty-activity','l','faculty-form-ready',joinPort('faculty-form-ready','left'),[[440,935],[440,1150],[530,1150]],'[Laboratory Activity]',[535,1018]);
 link('faculty-activity','b','faculty-schedule-type','t',[],'[Non-Laboratory]',[765,1017]);
 link('faculty-schedule-type','b','faculty-form-ready',joinPort('faculty-form-ready'));
 act('faculty-items',1,1290,'Choose equipment /\nmaterials and quantities','p2');
 act('faculty-submit',1,1420,'Review Information;\nread-only Approval Route;\nSubmit Request','p2');
 link('faculty-form-ready','b','faculty-items','t');link('faculty-items','b','faculty-submit','t');
 dec('faculty-valid',1,1580,'Request valid?');link('faculty-submit','b','faculty-valid','t');
 act('faculty-save',1,1740,'Save valid revision;\napplicable holds / status','p2');link('faculty-valid','b','faculty-save','t',[],'[Valid]',[725,1660]);
 act('faculty-error',1,2430,'Show correction;\nno new record or hold','p2');node('faculty-error-end',1,2540,'','final');
 link('faculty-valid','r','faculty-error','t',[[815,1580],[815,2330],[630,2330]],'[Invalid]',[710,2285]);link('faculty-error','b','faculty-error-end','t');
 dec('faculty-scheduled',1,1880,'On-schedule?');link('faculty-save','b','faculty-scheduled','t');
 node('faculty-pending-dispatch',1,2030,'','fork');
 link('faculty-scheduled','r','faculty-pending-dispatch','t',[[800,1880],[800,1960],[630,1960]],'[No]',[720,1930]);
 act('faculty-pending',1,2160,'Own Pending / Dean;\nEligible edit / reschedule:\nrevalidate; recheck route;\nEligible cancel: release hold','p2');node('faculty-pending-end',1,2290,'','final');
 link('faculty-pending-dispatch','b','faculty-pending','t');link('faculty-pending','b','faculty-pending-end','t');
 for(const [key,owner]of [['pending-status','rep'],['faculty-pending','faculty']]){
  nodes[key].statusActions=['view','edit','reschedule','cancel'];
  nodes[key].detailReference='activity-p2';
  shapes.querySelector('[data-swimlane-node="'+key+'"]').setAttribute('data-detail-reference','activity-p2');
  shapes.querySelector('[data-swimlane-node="'+key+'"]').setAttribute('data-view-owner',owner);
  shapes.querySelector('[data-swimlane-node="'+key+'"] rect').setAttribute('rx',12);
 }
 for(const key of ['request-save','faculty-save'])nodes[key].validation=['role','class','students','schedule','stock','quantities'];
 shapes.querySelector('[data-swimlane-node="faculty-scheduled"]').setAttribute('data-routing-rule','automatic');
 shapes.querySelector('[data-swimlane-node="faculty-submit"]').setAttribute('data-validation-rule','assigned-class-schedule-and-availability');
 // These decisions read the saved Schedule Type and assigned Faculty's
 // availability. They are automatic routing rules, not a reviewer picker.
 dec('classrep-schedule',1,2660,'On-schedule?');dec('faculty-available',1,2830,'Assigned Faculty\navailable?');join('faculty-review-ready',1,2970);
 for(const key of ['classrep-schedule','faculty-available'])shapes.querySelector('[data-swimlane-node="'+key+'"]').setAttribute('data-routing-rule','automatic');
 link('request-submitted','r','classrep-schedule','l',[[410,2290],[410,2660]]);
 link('classrep-schedule','b','faculty-review-ready',joinPort('faculty-review-ready','right'),[[630,2760],[800,2760],[800,2905],[730,2905]],'[Yes]',[730,2732]);
 link('classrep-schedule',[557.5,2685],'faculty-available','l',[[440,2685],[440,2830]],'[No]',[530,2735]);
 link('faculty-available','b','faculty-review-ready',joinPort('faculty-review-ready'),[],'[Yes]',[520,2930]);
 act('review',1,3070,'Assigned Faculty:\nApprove / Reject','p2');link('faculty-review-ready','b','review','t');
 dec('faculty-approved',1,3210,'Faculty\napproved?');link('review','b','faculty-approved','t');

 join('dean-route',5,3090);act('dean',5,3180,'Review\nrequest; Approve /\nReject','p2');
 link('faculty-available','r','dean-route',joinPort('dean-route','left'),[[2230,2830]],'[No]',[1470,2790]);
 link('faculty-pending-dispatch','r','dean-route',joinPort('dean-route','right'),[[2390,2030]]);
 link('dean-route','b','dean','t');dec('dean-approved',5,3330,'Dean\napproved?');link('dean','b','dean-approved','t');
 join('rejected-merge',0,3400);dec('rejected-requester',0,3510,'Requester?');
 link('faculty-approved','l','rejected-merge',joinPort('rejected-merge'),[[440,3210],[440,3300],[210,3300]],'[No]',[310,3270]);
 link('dean-approved','l','rejected-merge',joinPort('rejected-merge','right'),[[310,3330]],'[No]',[2050,3295]);
 link('rejected-merge','b','rejected-requester','t');
 act('rejected',0,3650,'View own Rejected\nreservation status','p2');act('faculty-rejected',1,3650,'View own Rejected\nreservation status','p2');
 node('rejected-end',0,3760,'','final');node('faculty-rejected-end',1,3760,'','final');
 link('rejected-requester','l','rejected','t',[[25,3510],[25,3560],[210,3560]],'[Class Rep.]',[120,3590]);
 link('rejected-requester','r','faculty-rejected','t',[[630,3510]],'[Faculty]',[530,3560]);
 link('rejected','b','rejected-end','t');link('faculty-rejected','b','faculty-rejected-end','t');
 join('approved',1,3395);join('approval-ready',1,3990);
 link('faculty-approved','b','approved',joinPort('approved'),[],'[Yes]',[925,3280]);
 link('faculty-scheduled','b','approved',joinPort('approved','right'),[[630,1950],[820,1950],[820,3310],[730,3310]],'[Yes]',[965,3230]);
 link('approved','b','approval-ready',joinPort('approval-ready'),[[630,3500],[820,3500],[820,3900],[630,3900]]);
 link('dean-approved','b','approval-ready',joinPort('approval-ready','right'),[[2310,3940],[730,3940]],'[Yes]',[2400,3870]);
 // Approval delivers the request to the selected lab independently of a
 // requester opening the status page. The short status-view branch ends
 // only that view, not the approved reservation or staff-processing branch.
 node('approved-dispatch',1,4040,'','fork');link('approval-ready','b','approved-dispatch','t');
 dec('prepare-requester',0,4120,'Requester?');link('approved-dispatch','l','prepare-requester','t',[[210,4040]]);
 act('prepare-user',0,4255,'View Approved status;\nselected lab / schedule','p2');act('prepare-faculty',1,4255,'View Approved status;\nbooking details','p2');
 link('prepare-requester','b','prepare-user','t',[],'[Class Rep.]',[315,4185]);link('prepare-requester','r','prepare-faculty','t',[[630,4120]],'[Faculty]',[535,4180]);
 join('requester-prepared',1,4340);node('approved-status-end',1,4440,'','final');
 link('prepare-user','b','requester-prepared',joinPort('requester-prepared','left'),[[210,4300],[530,4300]]);link('prepare-faculty','b','requester-prepared',joinPort('requester-prepared'));
 link('requester-prepared','b','approved-status-end','t');
 dec('lab',2,4320,'Selected lab?');link('approved-dispatch','r','lab','t',[[1050,4040]]);
 shapes.querySelector('[data-swimlane-node="lab"]').setAttribute('data-routing-rule','selected-laboratory');
 act('prepare-circuit',2,4470,'Check approval / stock;\nprepare Circuits items','p4');act('prepare-physics',3,4470,'Check approval / stock;\nprepare Physics items','p4');
 link('lab','b','prepare-circuit','t',[],'[Circuits]',[1150,4395]);link('lab','r','prepare-physics','t',[[1470,4320]],'[Physics]',[1460,4285]);
 join('prepare-join',1,4590);
 link('prepare-circuit','l','prepare-join',joinPort('prepare-join'),[[630,4470]]);link('prepare-physics','b','prepare-join',joinPort('prepare-join','right'),[[1470,4530],[730,4530]]);
 for(const [source,name]of [['prepare-circuit','Circuit'],['prepare-physics','Physics']]){routes.find(r=>r.from===source&&r.to==='prepare-join').name=name;edges.querySelector('[data-control-from="'+source+'"][data-control-to="prepare-join"]').setAttribute('data-edge-name',name);}
 dec('service-lab',2,4660,'Selected lab?');link('prepare-join','b','service-lab','l',[[630,4660]]);
 shapes.querySelector('[data-swimlane-node="service-lab"]').setAttribute('data-routing-rule','selected-laboratory');
 // The borrowing slip belongs to the reservation's saved laboratory.
 act('circuit-service',2,4810,'Issue Circuits items;\nsave Borrowing Slip;\nstatus: Ongoing','p4');
 act('physics-service',3,4810,'Issue Physics items;\nsave Borrowing Slip;\nstatus: Ongoing','p4');
 link('service-lab','b','circuit-service','t',[],'[Circuits]',[1150,4735]);
 link('service-lab','r','physics-service','t',[[1470,4660]],'[Physics]',[1460,4625]);
 for(const [key,lab]of [['circuit-service','Circuits'],['physics-service','Physics']]){
  nodes[key].laboratory=lab;nodes[key].creates='BORROWING / BORROWING_ITEM / BORROWING_MEMBER';
  nodes[key].systemResult='Borrowing Slip saved in D5; reservation Ongoing';
  nodes[key].accessScope='assigned laboratory; Head Laboratory has both laboratories';
 }
 join('slip-ready',3,4930);
 link('circuit-service','b','slip-ready',joinPort('slip-ready','left'),[[1050,4880],[1370,4880]]);
 link('physics-service','b','slip-ready',joinPort('slip-ready'));
 // Head's read-only access never gates the staff return workflow.
 node('slip-dispatch',3,4990,'','fork');link('slip-ready','b','slip-dispatch','t');
 act('headlab-slip-access',4,5080,'Access Borrowing Slips:\nPhysics and Circuits;\nissued items / borrowers','p4');
 node('slip-access-end',4,5200,'','final');
 link('slip-dispatch','r','headlab-slip-access','t',[[1890,4990]]);
 link('headlab-slip-access','b','slip-access-end','t');
 nodes['headlab-slip-access'].readOnly=true;nodes['headlab-slip-access'].laboratories=['Physics','Circuits'];
 // Either the assigned Staff OR Head Laboratory checks and records returns.
 dec('return-processor',3,5140,'Return recorder?');
 link('slip-dispatch','b','return-processor','t');
 dec('return-lab',2,5220,'Selected lab?');
 link('return-processor','l','return-lab','t',[[1050,5140]],'[Assigned Staff]',[1170,5100]);
 act('circuit-return',2,5410,'Check items; validate;\nrecord Returned (good),\nBroken, Lost, Consumed;\nsave returns / stock','p4');
 act('physics-return',3,5410,'Check items; validate;\nrecord Returned (good),\nBroken, Lost, Consumed;\nsave returns / stock','p4');
 act('headlab-return',4,5410,'Check items; validate;\nrecord Returned (good),\nBroken, Lost, Consumed;\nsave returns / stock;\nPhysics or Circuits','p4');
 link('return-lab','b','circuit-return','t',[],'[Circuits]',[1150,5330]);
 link('return-lab','r','physics-return','t',[[1470,5220]],'[Physics]',[1450,5180]);
 link('return-processor','r','headlab-return','t',[[2070,5140],[2070,5300],[1890,5300]],'[Head Laboratory]',[2010,5260]);
 shapes.querySelector('[data-swimlane-node="return-lab"]').setAttribute('data-routing-rule','selected-laboratory');
 for(const [key,scope]of [['circuit-return',['Circuits']],['physics-return',['Physics']],['headlab-return',['Physics','Circuits']]]){
  nodes[key].laboratories=scope;nodes[key].returnFields=['qty_good','qty_broken','qty_lost','qty_consumed'];
  nodes[key].validation=['same-borrowing-and-item','nonnegative','cumulative-total-not-over-issued','consumables-only-consumed'];
  nodes[key].invalidResult='Refuse invalid entry; no new return or stock movement; remains Ongoing';
  shapes.querySelector('[data-swimlane-node="'+key+'"] rect').setAttribute('rx',12);
 }
 shapes.querySelector('[data-swimlane-node="headlab-slip-access"] rect').setAttribute('rx',12);
 join('staff-returns',3,5540);join('returns',4,5620);
 link('circuit-return','b','staff-returns',joinPort('staff-returns','left'),[[1050,5500],[1370,5500]]);
 link('physics-return','b','staff-returns',joinPort('staff-returns'));
 link('staff-returns','b','returns',joinPort('returns','left'),[[1470,5580],[1790,5580]]);
 link('headlab-return','b','returns',joinPort('returns'));
 dec('balance',4,5720,'Broken or lost?');link('returns','b','balance','t');
 nodes['balance'].clearanceTrigger='qty_broken > 0 OR qty_lost > 0';
 act('clearance',4,5900,'Review outcome / slip;\nidentify accountable\nstudent; create clearance','p5');
 act('clearance-view',0,5900,'View student, item\nand clearance status','p5');node('balance-end',0,6020,'','final');
 link('balance','b','clearance','t',[],'[Broken / lost]',[2010,5790]);
 link('clearance','l','clearance-view','r',[[1660,5900],[1660,5650],[410,5650],[410,5900]]);
 link('clearance-view','b','balance-end','t');
 nodes['clearance'].allowedRole='Head Laboratory';nodes['clearance'].reservationResult='Remains Ongoing while broken/lost accountability is unresolved';
 // A partial return is not automatically a completed reservation or clearance.
 dec('return-accounted',2,5720,'All issued qty\naccounted for?');
 link('balance','l','return-accounted','r',[],'[No broken / lost]',[1465,5680]);
 act('return-pending',3,5861,'Keep status Ongoing;\nremaining qty pending','p4');node('return-pending-end',3,5980,'','final');
 link('return-accounted','b','return-pending','t',[[1050,5790],[1470,5790]],'[Incomplete]',[1360,5750]);
 link('return-pending','b','return-pending-end','t');
 // Completed status and D11 usage are saved once, only after verified returns.
 node('completed-dispatch',1,5860,'','fork');nodes['completed-dispatch'].systemResult='Completed; D11 usage saved once';
 link('return-accounted','l','completed-dispatch',[730,5852],[[810,5720],[810,5810],[730,5810]],'[Complete; D11 saved]',[680,5750]);
 dec('completed-requester',1,6000,'Requester?');link('completed-dispatch','b','completed-requester','t');
 act('completed-rep',0,6150,'View own Completed\nreservation status','p2');act('completed-faculty',1,6150,'View own Completed\nreservation status','p2');
 node('completed-rep-end',0,6270,'','final');node('completed-faculty-end',1,6270,'','final');
 link('completed-requester','l','completed-rep','t',[[440,6000],[440,6070],[210,6070]],'[Class Rep.]',[320,6120]);
 link('completed-requester','b','completed-faculty','t',[],'[Faculty]',[725,6080]);
 link('completed-rep','b','completed-rep-end','t');link('completed-faculty','b','completed-faculty-end','t');
 act('report',4,6170,'View completed logs;\nexport End-Term Report','p5');
 link('completed-dispatch','r','report','l',[[820,5860],[820,6050],[1660,6050],[1660,6170]]);
 node('end',4,6300,'','final');link('report','b','end','t');
 // Widen the six responsibility partitions without stretching the lettering
 // or changing transaction routing. Keep the authored corridors and join-port
 // order, and move the body below the larger lane headers. Geometry and SVG
 // coordinates are updated together so label placement and QA use the same
 // layout. Circles remain round; only the other node widths grow with a lane.
 const mapX=x=>x*partitionScale,mapY=y=>y+bodyOffset;
 function remapElement(element,xMap=mapX){
  for(const attribute of ['x','cx','x1','x2'])if(element.hasAttribute(attribute))element.setAttribute(attribute,xMap(Number(element.getAttribute(attribute))));
  for(const attribute of ['y','cy','y1','y2'])if(element.hasAttribute(attribute))element.setAttribute(attribute,mapY(Number(element.getAttribute(attribute))));
  if(element.hasAttribute('width'))element.setAttribute('width',Number(element.getAttribute('width'))*partitionScale);
  if(element.hasAttribute('d')){
   let coordinate=0;
   element.setAttribute('d',element.getAttribute('d').replace(/[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi,value=>(coordinate++%2?mapY:xMap)(Number(value))));
  }
 }
 for(const group of [edges,labels])for(const element of group.querySelectorAll('*'))remapElement(element);
 for(const [key,n]of Object.entries(nodes)){
  const group=shapes.querySelector('[data-swimlane-node="'+key+'"]'),cx=n.x+n.w/2;
  const round=['initial','final','flow-final'].includes(n.kind),xMap=round?x=>mapX(cx)+(x-cx):mapX;
  for(const element of group.querySelectorAll('*'))remapElement(element,xMap);
  n.x=round?mapX(cx)-n.w/2:mapX(n.x);n.y=mapY(n.y);if(!round)n.w*=partitionScale;
 }
 for(const route of routes)route.points=route.points.map(([x,y])=>[mapX(x),mapY(y)]);
 for(const label of labels.querySelectorAll('[data-flow-label]')){
  label.setAttribute('data-label-x',mapX(Number(label.getAttribute('data-label-x'))));
  label.setAttribute('data-label-y',mapY(Number(label.getAttribute('data-label-y'))));
 }
 window.SystemSwimlaneGeometry={nodes,routes,laneBounds:bounds.map(mapX),width,height,partitionWidth:420*partitionScale,headerHeight:108};return svg;
};
})();
