/* Whole-system responsibility overview. Head Laboratory is already signed in.
 * Account handover precedes requester login. Administration remains in its
 * own lane and never gates a requester's reservation. Activities 1-5 contain
 * the detailed validation, login failures and submission alternatives. */
(function(){
'use strict';
window.SystemPortraitSwimlane=function(id){
 const NS='http://www.w3.org/2000/svg',width=2520,height=4260,nodes={},routes=[];
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
 text(lanes,1260,32,'Laboratory Management - Overall Swimlane',38,true);
 ['Class Representative','Faculty','Circuit Staff','Physics Staff','Head Lab','Dean'].forEach((name,i)=>{
  el('rect',{x:bounds[i],y:62,width:bounds[i+1]-bounds[i],height:height-74,class:'lane-bg','data-lane':i,'data-lane-name':name},lanes);
  el('line',{x1:bounds[i],x2:bounds[i+1],y1:120,y2:120,stroke:'#000','stroke-width':2.5},lanes);
  text(lanes,centers[i],92,name,29,true);
 });
 function node(key,lane,y,title,kind='action',process){
  if(kind==='final'&&key!=='end')kind='flow-final';
  const x=centers[lane];let w=338,h=80;
  if(kind==='decision'){w=key==='faculty-available'?320:title.includes('\n')?310:290;h=key==='faculty-available'?140:title.includes('\n')?130:100;}
  if(['initial','final','flow-final'].includes(kind)){w=46;h=46;}
  if(kind==='fork'||kind==='join'){w=320;h=16;}
  if(key==='dean-route'){w=180;h=16;}
  const n={x:x-w/2,y:y-h/2,w,h,lane,kind,title};nodes[key]=n;
  const g=el('g',{'data-swimlane-node':key,'data-uml-kind':kind,...(process?{'data-process':process}:{})},shapes);
  if(kind==='decision')el('path',{d:'M'+x+' '+n.y+' L'+(n.x+w)+' '+y+' L'+x+' '+(n.y+h)+' L'+n.x+' '+y+' Z',class:'flow-shape'},g);
  else if(['initial','final','flow-final'].includes(kind)){
   el('circle',{cx:x,cy:y,r:23,fill:kind==='initial'?'#000':'#fff',stroke:'#000','stroke-width':3},g);
   if(kind==='final')el('circle',{cx:x,cy:y,r:15,fill:'#000'},g);
   if(kind==='flow-final')el('path',{d:'M'+(x-14)+' '+(y-14)+' L'+(x+14)+' '+(y+14)+' M'+(x+14)+' '+(y-14)+' L'+(x-14)+' '+(y+14),fill:'none',stroke:'#000','stroke-width':3},g);
  }else if(kind==='fork'||kind==='join')el('rect',{x:n.x,y:n.y,width:w,height:h,rx:8,fill:'#000'},g);
  else el('rect',{x:n.x,y:n.y,width:w,height:h,rx:h/2,class:'flow-shape'},g);
  if(title)text(g,x,y,title,kind==='decision'?(key==='faculty-available'?21:24):27,kind==='action');return n;
 }
 const act=(key,lane,y,title,p)=>node(key,lane,y,title,'action',p),dec=(key,lane,y,title)=>node(key,lane,y,title,'decision');
 function join(key,lane,y){const n=node(key,lane,y,'','join');n.joinSpec='or';shapes.querySelector('[data-swimlane-node="'+key+'"]').setAttribute('data-join-spec','or');return n;}
 function point(key,side){if(Array.isArray(side))return side.slice(0,2);const n=nodes[key];return side==='l'?[n.x,n.y+n.h/2]:side==='r'?[n.x+n.w,n.y+n.h/2]:side==='t'?[n.x+n.w/2,n.y]:[n.x+n.w/2,n.y+n.h];}
 function readableGuard(from,guard){
  const pairs={question:['Help needed','No help needed'],'classrep-schedule':['On-schedule','Out-of-schedule'],'faculty-available':['Available','Unavailable'],'faculty-approved':['Approved','Rejected'],'dean-approved':['Approved','Rejected'],'faculty-scheduled':['On-schedule\nNo approval','Out-of-schedule\nPending: Dean'],balance:['Balance unresolved','No balance']};
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
  if(guard&&at){const display=readableGuard(from,guard),t=text(labels,at[0],at[1],display,display.length>19||from==='faculty-activity'?21:24);t.setAttribute('style','fill:#000;stroke:#fff;stroke-width:7;stroke-linejoin:round;paint-order:stroke');t.setAttribute('data-flow-label',from+'-to-'+to);}
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
 dec('question',0,810,'Need lab help?');act('ask',0,930,'Ask lab / equipment\ninfo or hours','p3');join('request-ready',0,1030);
 link('classrep-login','b','question','t');link('question','b','ask','t',[],'[Yes]',[300,875]);
 link('question','l','request-ready',[100,1022],[[8,810],[8,980],[100,980]],'[No]',[100,875]);link('ask','b','request-ready',[210,1022]);
 // Laboratory selection is one form action, not parallel Physics / Circuits
 // work. Group and Student Only are exclusive modes; students are selected
 // later, after the authorized class is chosen.
 act('choose-laboratory',0,1120,'Choose laboratory:\nPhysics or Circuits','p2');dec('reservation-type',0,1255,'Group or\nStudent Only?');join('type-merge',0,1365);
 link('request-ready','b','choose-laboratory','t');link('choose-laboratory','b','reservation-type','t');
 link('reservation-type','l','type-merge',[110,1357],[[25,1255],[25,1320],[110,1320]],'[Group]',[210,1338]);
 link('reservation-type','r','type-merge',[310,1357],[[395,1255],[395,1320],[310,1320]],'[Student Only]',[480,1350]);
 act('schedule-type',0,1460,'Choose Schedule Type;\nOn- / Out-of-schedule','p2');link('type-merge','b','schedule-type','t');
 act('request-details',0,1580,'Choose class / slot;\nselect students & items','p2');link('schedule-type','b','request-details','t');
 act('request',0,1700,'Review route / details;\nSubmit Request','p2');link('request-details','b','request','t');
 // The submission creates a Pending record with its automatic reviewer.
 // Displaying that status and delivering the routed request are independent
 // outputs; the status-view branch does not have to wait for a decision.
 node('request-submitted',0,1810,'','fork');link('request','b','request-submitted','t');
 act('pending-status',0,1930,'View Pending status;\nCurrent Reviewer','p2');node('pending-status-end',0,2050,'','final');
 link('request-submitted','b','pending-status','t');link('pending-status','b','pending-status-end','t');
 // Faculty chooses the activity kind before completing the common form.
 // Laboratory Activity uses the assigned class schedule. Only the other
 // activity path asks for On- / Out-of-schedule; neither path selects a reviewer.
 act('faculty-request',1,800,'Choose laboratory:\nPhysics or Circuits','p2');
 dec('faculty-activity',1,935,'Laboratory\nActivity?');
 act('faculty-schedule-type',1,1085,'Choose Schedule Type:\nOn- / Out-of-schedule','p2');join('faculty-form-ready',1,1190);
 link('faculty-login','b','faculty-request','t');link('faculty-request','b','faculty-activity','t');
 link('faculty-activity','l','faculty-form-ready',[530,1182],[[440,935],[440,1140],[530,1140]],'[Laboratory Activity]',[535,1018]);
 link('faculty-activity','b','faculty-schedule-type','t',[],'[Non-Laboratory]',[765,1017]);
 link('faculty-schedule-type','b','faculty-form-ready',[730,1182],[[630,1150],[730,1150]]);
 act('faculty-room',1,1290,'Select class / schedule;\ncheck room availability','p2');
 act('faculty-items',1,1420,'Choose equipment /\nmaterials and quantities','p2');
 act('faculty-submit',1,1530,'Review & submit;\nvalidate / save request','p2');
 link('faculty-form-ready','b','faculty-room','t');link('faculty-room','b','faculty-items','t');link('faculty-items','b','faculty-submit','t');
 // This routing decision reads the validated saved schedule. Faculty
 // on-schedule requests are Approved with no APPROVAL row; only an
 // out-of-schedule request remains Pending for the Dean's decision.
 dec('faculty-scheduled',1,1665,'On-schedule?');link('faculty-submit','b','faculty-scheduled','t');
 shapes.querySelector('[data-swimlane-node="faculty-scheduled"]').setAttribute('data-routing-rule','automatic');
 shapes.querySelector('[data-swimlane-node="faculty-submit"]').setAttribute('data-validation-rule','assigned-class-schedule-and-availability');
 // These decisions read the saved Schedule Type and assigned Faculty's
 // availability. They are automatic routing rules, not a reviewer picker.
 dec('classrep-schedule',1,1810,'On-schedule?');dec('faculty-available',1,1980,'Assigned Faculty\navailable?');join('faculty-review-ready',1,2120);
 for(const key of ['classrep-schedule','faculty-available'])shapes.querySelector('[data-swimlane-node="'+key+'"]').setAttribute('data-routing-rule','automatic');
 link('request-submitted','r','classrep-schedule','l');
 link('classrep-schedule','b','faculty-review-ready',[730,2112],[[630,1910],[800,1910],[800,2055],[730,2055]],'[Yes]',[730,1882]);
 link('classrep-schedule',[557.5,1835],'faculty-available','l',[[440,1835],[440,1980]],'[No]',[530,1885]);
 link('faculty-available','b','faculty-review-ready',[530,2112],[[630,2080],[530,2080]],'[Yes]',[450,2075]);
 act('review',1,2220,'Assigned Faculty:\nApprove / Reject','p2');link('faculty-review-ready','b','review','t');
 dec('faculty-approved',1,2360,'Faculty\napproved?');link('review','b','faculty-approved','t');
 act('rejected',0,2360,'View Rejected status','p2');node('rejected-end',0,2480,'','final');
 link('faculty-approved','l','rejected','r',[],'[No]',[425,2320]);link('rejected','b','rejected-end','t');
 join('dean-route',5,2260);act('dean',5,2340,'Review request;\nApprove / Reject','p2');
 link('faculty-available','r','dean-route',[2260,2252],[[2260,1980]],'[No]',[1470,1940]);
 link('faculty-scheduled','r','dean-route',[2360,2252],[[2150,1665],[2150,2150],[2360,2150]],'[No]',[1470,1630]);
 link('dean-route','b','dean','t');dec('dean-approved',5,2480,'Dean\napproved?');link('dean','b','dean-approved','t');
 act('dean-rejected',0,2610,'View Rejected status','p2');node('dean-rejected-end',0,2730,'','final');
 link('dean-approved','l','dean-rejected','r',[[430,2480],[430,2610]],'[No]',[2050,2445]);link('dean-rejected','b','dean-rejected-end','t');
 join('approved',1,2510);join('approval-ready',1,2840);
 link('faculty-approved','b','approved',[730,2502],[[630,2445],[730,2445]],'[Yes]',[925,2430]);
 link('faculty-scheduled','b','approved',[530,2502],[[630,1745],[820,1745],[820,2460],[530,2460]],'[Yes]',[965,2380]);
 link('approved','b','approval-ready',[550,2832],[[630,2760],[550,2760]]);
 link('dean-approved','b','approval-ready',[710,2832],[[2310,2790],[710,2790]],'[Yes]',[2400,2720]);
 // Approval delivers the request to the selected lab independently of a
 // requester opening the status page. The short status-view branch ends
 // only that view, not the approved reservation or staff-processing branch.
 node('approved-dispatch',1,2890,'','fork');link('approval-ready','b','approved-dispatch','t');
 dec('prepare-requester',0,2970,'Requester?');link('approved-dispatch','l','prepare-requester','t',[[210,2890]]);
 act('prepare-user',0,3090,'View Approved status;\nselected lab / schedule','p2');act('prepare-faculty',1,3090,'View Approved status;\nbooking details','p2');
 link('prepare-requester','b','prepare-user','t',[],'[Class Rep.]',[315,3035]);link('prepare-requester','r','prepare-faculty','t',[[630,2970]],'[Faculty]',[535,3030]);
 join('requester-prepared',1,3190);node('approved-status-end',1,3290,'','final');
 link('prepare-user','b','requester-prepared',[490,3182],[[210,3150],[490,3150]]);link('prepare-faculty','b','requester-prepared',[690,3182],[[630,3150],[690,3150]]);
 link('requester-prepared','b','approved-status-end','t');
 dec('lab',2,3170,'Selected lab?');link('approved-dispatch','r','lab','t',[[1050,2890]]);
 shapes.querySelector('[data-swimlane-node="lab"]').setAttribute('data-routing-rule','selected-laboratory');
 act('prepare-circuit',2,3320,'Check approval / stock;\nprepare Circuits items','p4');act('prepare-physics',3,3320,'Check approval / stock;\nprepare Physics items','p4');
 link('lab','b','prepare-circuit','t',[],'[Circuits]',[1150,3245]);link('lab','r','prepare-physics','t',[[1470,3170]],'[Physics]',[1460,3135]);
 join('prepare-join',1,3440);
 link('prepare-circuit','l','prepare-join',[530,3432],[[530,3320]]);link('prepare-physics','b','prepare-join',[730,3432],[[1470,3380],[730,3380]]);
 for(const [source,name]of [['prepare-circuit','Circuit'],['prepare-physics','Physics']]){routes.find(r=>r.from===source&&r.to==='prepare-join').name=name;edges.querySelector('[data-control-from="'+source+'"][data-control-to="prepare-join"]').setAttribute('data-edge-name',name);}
 dec('service-lab',2,3510,'Selected lab?');link('prepare-join','b','service-lab','l',[[630,3510]]);
 shapes.querySelector('[data-swimlane-node="service-lab"]').setAttribute('data-routing-rule','selected-laboratory');
 act('circuit-service',2,3660,'Issue lab items;\ncheck returned items','p4');act('physics-service',3,3660,'Issue lab items;\ncheck returned items','p4');
 link('service-lab','b','circuit-service','t',[],'[Circuits]',[1150,3585]);link('service-lab','r','physics-service','t',[[1470,3510]],'[Physics]',[1460,3475]);
 join('returns',2,3765);
 link('circuit-service','b','returns',[970,3757],[[1050,3725],[970,3725]]);link('physics-service','b','returns',[1130,3757],[[1470,3715],[1130,3715]]);
 dec('balance',4,3765,'Unresolved\nbalance?');link('returns','b','balance',[1812.5,3797.5],[[1050,3860],[1700,3860],[1700,3797.5]]);
 act('clearance',4,3910,'Identify student;\ncreate clearance','p5');act('clearance-view',0,3910,'View student, item\nand clearance status','p5');node('balance-end',0,4010,'','final');
 link('balance','r','clearance','t',[[2070,3765],[2070,3840],[1890,3840]],'[Yes]',[2260,3810]);link('clearance','l','clearance-view','r');link('clearance-view','b','balance-end','t');
 act('completed',1,3765,'View Completed status;\nlogs saved automatically','p2');
 link('balance','l','completed','r',[[1720,3765],[1720,3708],[850,3708],[850,3765]],'[No]',[1600,3750]);
 act('report',4,4060,'View automatic logs;\nexport report if needed','p5');link('completed','b','report','l',[[630,4060]]);node('end',4,4180,'','final');link('report','b','end','t');
 window.SystemSwimlaneGeometry={nodes,routes,laneBounds:bounds,width,height};return svg;
};
})();
