/* A4 portrait UML responsibility overview; detailed alternatives remain in
 * Activities 1–5. Each approver acts inside their own actor partition. */
(function(){
'use strict';
window.SystemPortraitSwimlane=function(id){
 const NS='http://www.w3.org/2000/svg',nodes={},routes=[];
 const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));parent?.append(n);return n;};
 const svg=el('svg',{xmlns:NS,viewBox:'0 0 2520 3800',role:'img','aria-label':'Overall laboratory service UML swimlane: six actor partitions',class:'swimlane-flowchart'});
 el('style',{},svg).textContent='.swimlane-flowchart text{font-family:Arial,Helvetica,sans-serif;fill:#000}.swimlane-flowchart .line{fill:none;stroke:#000;stroke-width:3}.swimlane-flowchart .lane-bg,.swimlane-flowchart .flow-shape{fill:#fff;stroke:#000;stroke-width:2.5}';
 const marker=el('marker',{id:id+'-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:9,markerHeight:9,orient:'auto'},el('defs',{},svg));el('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#000'},marker);
 const lanes=el('g',{},svg),edges=el('g',{},svg),shapes=el('g',{},svg),labels=el('g',{},svg);
 const Y=3564/3370,bounds=[2,420,840,1260,1680,2100,2518],centers=[210,630,1050,1470,1890,2310];
 const flowY=y=>y>985?y+400:y>860?y+(y-860)*3.2:y;
 function text(parent,x,y,value,size=29,bold=false){y=flowY(y)*Y;const rows=value.split('\n'),t=el('text',{'text-anchor':'middle','font-size':size,'font-weight':bold?700:400},parent);rows.forEach((row,i)=>el('tspan',{x,y:y+(i-(rows.length-1)/2)*size*1.12+size*.33},t).textContent=row);return t;}
 text(lanes,1260,35,'Laboratory Management — Overall Swimlane',40,true);
 ['Class Representative','Faculty','Circuit Staff','Physics Staff','Head Lab','Dean'].forEach((name,i)=>{el('rect',{x:bounds[i],y:64*Y,width:bounds[i+1]-bounds[i],height:3520*Y,class:'lane-bg','data-lane':i,'data-lane-name':name},lanes);el('line',{x1:bounds[i],x2:bounds[i+1],y1:125*Y,y2:125*Y,stroke:'#000','stroke-width':2.5},lanes);text(lanes,centers[i],95,name,30,true);});
 function node(key,lane,y,title,kind='action',process){
  if(kind==='final'&&key!=='end')kind='flow-final';
  const x=centers[lane];let w=350,h=86;
  if(['admin','admin-tasks'].includes(key))w=310;
  if(kind==='decision'){w=260;h=100;}
  // Compact Faculty decisions leave visible shafts before their arrowheads.
  if(kind==='decision'&&lane===1)h=100;
  if(kind==='merge'){w=190;h=100;}
  // Invisible convergence point: alternative routes share one outgoing arrow.
  // User-requested simplified notation, not a standard UML merge symbol.
  if(kind==='connector'){w=0;h=0;}
  if(['initial','final','flow-final'].includes(kind)){w=46;h=46;}
  if(kind==='fork'||kind==='join'){w=340;h=16;}
  if(key==='dean-route'){w=16;h=180;}
  const logicalY=y;y=flowY(y)*Y;if(!['initial','final','flow-final','connector'].includes(kind))h*=Y;
  const n={x:x-w/2,y:y-h/2,w,h,lane,kind,title};nodes[key]=n;
  const g=el('g',{'data-swimlane-node':key,'data-uml-kind':kind,...(process?{'data-process':process}:{})},shapes);
  if(kind==='connector'){
   g.setAttribute('data-flow-semantics','exclusive-merge');
   el('title',{},g).textContent='Alternative request paths converge here without an extra shape; one outgoing flow continues.';
  }
  else if(kind==='decision'||kind==='merge')el('path',{d:`M${x} ${n.y} L${x+w/2} ${y} L${x} ${n.y+h} L${x-w/2} ${y} Z`,class:'flow-shape'},g);
  else if(['initial','final','flow-final'].includes(kind)){el('circle',{cx:x,cy:y,r:23,fill:kind==='initial'?'#000':'#fff',stroke:'#000','stroke-width':3},g);if(kind==='final')el('circle',{cx:x,cy:y,r:15,fill:'#000'},g);if(kind==='flow-final')el('path',{d:`M${x-14} ${y-14} L${x+14} ${y+14} M${x+14} ${y-14} L${x-14} ${y+14}`,fill:'none',stroke:'#000','stroke-width':3},g);}
  else if(kind==='fork'||kind==='join')el('rect',{x:n.x,y:n.y,width:w,height:h,rx:Math.min(w,h)/2,fill:'#000'},g);
  else el('rect',{x:n.x,y:n.y,width:w,height:h,rx:h/2,class:'flow-shape'},g);
  if(title)text(g,x,logicalY,title,kind==='decision'?26:['admin','admin-tasks'].includes(key)?25:28,kind==='action');return n;
 }
 const act=(key,lane,y,title,p)=>node(key,lane,y,title,'action',p),dec=(key,lane,y,title)=>node(key,lane,y,title,'decision');
 const point=(key,side)=>{if(Array.isArray(side))return side[2]==='raw'?[side[0],side[1]]:[side[0],flowY(side[1])*Y];const n=nodes[key];return side==='l'?[n.x,n.y+n.h/2]:side==='r'?[n.x+n.w,n.y+n.h/2]:side==='t'?[n.x+n.w/2,n.y]:[n.x+n.w/2,n.y+n.h];};
 function readableGuard(from,guard){
  const pairs={readiness:['Setup needed','No setup needed'],question:['Help needed','No help needed'],'direct-dean':['Off-schedule; Faculty unavailable','On-schedule / Faculty available'],'faculty-approved':['Approved','Rejected'],'dean-approved':['Approved','Rejected'],'faculty-scheduled':['Own on-schedule','Out-of-schedule'],balance:['Balance unresolved','No balance']};
  return guard&&pairs[from]&&/^\[(Yes|No)\]/.test(guard)?'['+pairs[from][guard==='[Yes]'?0:1]+']':guard;
 }
 function link(from,fs,to,ts,bends=[],guard,at){
  const points=[point(from,fs),...bends.map(([x,y,mode])=>mode==='raw'?[x,y]:[x,flowY(y)*Y]),point(to,ts)];
  const clean=points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]);
  let d='M'+clean[0].join(' ');
  for(let i=1;i<clean.length-1;i++){
   const a=clean[i-1],b=clean[i],c=clean[i+1],before=Math.hypot(b[0]-a[0],b[1]-a[1]),after=Math.hypot(c[0]-b[0],c[1]-b[1]);
   const turn=(b[0]-a[0])*(c[1]-b[1])!==(b[1]-a[1])*(c[0]-b[0]);
   if(!turn){d+=' L'+b.join(' ');continue;}
   const r=Math.min(14,before/3,after/3),entry=[b[0]-(b[0]-a[0])*r/before,b[1]-(b[1]-a[1])*r/before],exit=[b[0]+(c[0]-b[0])*r/after,b[1]+(c[1]-b[1])*r/after];
   d+=' L'+entry.join(' ')+' Q'+b.join(' ')+' '+exit.join(' ');
  }
  d+=' L'+clean[clean.length-1].join(' ');
  // Bridge crossings, but stop the white underlay short of a real junction.
  let bridge=d;
  if(nodes[to].kind==='connector'){
   const a=clean[clean.length-2],b=clean[clean.length-1],length=Math.hypot(b[0]-a[0],b[1]-a[1]),gap=Math.min(10,length/2);
   bridge=bridge.slice(0,bridge.lastIndexOf(' L'))+' L'+[b[0]-(b[0]-a[0])*gap/length,b[1]-(b[1]-a[1])*gap/length].join(' ');
  }
  if(nodes[from].kind==='connector'){
   const a=clean[0],b=clean[1],length=Math.hypot(b[0]-a[0],b[1]-a[1]),gap=Math.min(10,length/2);
   bridge=bridge.replace(/^M[^LQ]+/,'M'+[a[0]+(b[0]-a[0])*gap/length,a[1]+(b[1]-a[1])*gap/length].join(' ')+' ');
  }
  el('path',{d:bridge,fill:'none',stroke:'#fff','stroke-width':8},edges);
  el('path',{d,class:'line',...(nodes[to].kind==='connector'?{}:{'marker-end':`url(#${id}-arrow)`}),'data-control-from':from,'data-control-to':to,...(guard?{'data-guard':guard}:{})},edges);
  routes.push({from,to,points:clean,guard:guard||null});if(guard&&at){const display=from==='direct-dean'?guard==='[Yes]'?'[Off-schedule;\nFaculty unavailable]':'[On-schedule /\nFaculty available]':readableGuard(from,guard);const t=text(labels,Math.max(110,at[0]),from==='direct-dean'&&guard==='[No]'?1070:at[1],display,display.length>30?18:22);t.setAttribute('style','fill:#000;stroke:#fff;stroke-width:7;paint-order:stroke');}
 }
 // Supporting preparation is optional, not a new reservation approval gate.
 node('start',4,175,'','initial');dec('readiness',4,285,'Updates\nneeded?');act('admin',4,400,'Enter account details;\ncreate / update','p1');act('admin-tasks',4,535,'Schedule / daily tasks\n(as needed)','p5');act('forecast',4,670,'Inventory forecast:\nreview as needed','p4');node('ready',4,795,'','join');
 act('faculty-identity',1,280,'For Class Rep.: confirm\nname, ID and section','p1');
 act('faculty-handoff',1,400,'Receive credentials;\ngive Class Rep. theirs','p1');
 act('classrep-receive',0,400,'Receive account\ncredentials from Faculty','p1');
 act('classrep-login',0,520,'Log in with\nissued credentials','p1');
 link('start','b','readiness','t');link('readiness','l','faculty-identity','r',[[1000,285],[1000,280]],'[Yes]',[1400,260]);link('faculty-identity','b','admin','l',[[630,345],[1650,345],[1650,400]]);link('readiness','r','ready',[1980,nodes.ready.y,'raw'],[[2070,285],[2070,745],[1980,745]],'[No]',[2110,550]);
 link('admin','b','faculty-handoff','r',[[1890,465],[1000,465],[1000,400]]);link('faculty-handoff','l','classrep-receive','r');link('classrep-receive','b','classrep-login','t');link('classrep-login','r','admin-tasks','l',[[1500,520],[1500,nodes['admin-tasks'].y+nodes['admin-tasks'].h/2,'raw']]);link('admin-tasks','b','forecast','t');link('forecast','b','ready',[1800,nodes.ready.y,'raw'],[[1890,750],[1800,750]]);
 dec('question',0,630,'Need lab help?');act('ask',0,760,'Ask lab / equipment\ninfo or hours','p3');node('request-ready',0,860,'','join');
 nodes['request-ready'].joinSpec='or';shapes.querySelector('[data-swimlane-node="request-ready"]').setAttribute('data-join-spec','or');
 nodes.ready.joinSpec='or';shapes.querySelector('[data-swimlane-node="ready"]').setAttribute('data-join-spec','or');
 dec('requester',1,575,'Requester?');link('ready','b','requester','r',[[1890,825],[1150,825],[1150,575]]);link('requester','l','question','r',[[420,575],[420,630]],'[Class Rep.]',[420,610]);
 act('faculty-request',1,720,'Check slots / ask AI;\nsubmit own request','p2');dec('faculty-scheduled',1,860,'On assigned\nschedule?');link('requester','b','faculty-request','t',[],'[Faculty]',[707,651]);link('faculty-request','b','faculty-scheduled','t');
 link('question','b','ask','t',[],'[Yes]',[285,700]);link('question','l','request-ready',[100,852],[[25,630],[25,815],[100,815]],'[No]',[110,710]);link('ask','b','request-ready',[210,852]);
 act('select-type',0,892,'Choose class and type;\nselect student(s)','p2');link('request-ready','b','select-type','t');
 dec('reservation-type',0,925,'Group or\nStudent Only?');link('select-type','b','reservation-type','t');node('type-merge',0,960,'','join');
 nodes['type-merge'].joinSpec='or';shapes.querySelector('[data-swimlane-node="type-merge"]').setAttribute('data-join-spec','or');
 link('reservation-type','l','type-merge',[110,nodes['type-merge'].y,'raw'],[[45,925],[45,nodes['type-merge'].y-65,'raw'],[110,nodes['type-merge'].y-65,'raw']],'[Group]',[90,936]);
 link('reservation-type','r','type-merge',[310,nodes['type-merge'].y,'raw'],[[390,925],[390,nodes['type-merge'].y-65,'raw'],[310,nodes['type-merge'].y-65,'raw']],'[Student Only]',[302,936]);

 act('request',0,985,'Submit reservation;\non- / out-of-schedule','p2');link('type-merge','b','request','t');
 dec('direct-dean',0,1130,'Off-schedule and\nFaculty unavailable?');link('request','b','direct-dean','t');
 act('review',1,1130,'Review class request;\nApprove / Reject','p2');link('direct-dean','r','review','l',[],'[No]',[398,1100]);
 dec('faculty-approved',1,1295,'Faculty\napproved?');link('review','b','faculty-approved','t');act('rejected',0,1295,'View rejection notice','p2');node('rejected-end',0,1400,'','final');link('faculty-approved','l','rejected','r',[],'[No]',[416,1265]);link('rejected','b','rejected-end','t');
 node('dean-route',5,1250,'','join');nodes['dean-route'].joinSpec='or';
 shapes.querySelector('[data-swimlane-node="dean-route"]').setAttribute('data-join-spec','or');

 act('dean',5,1460,'Review request;\nApprove / Reject','p2');link('dean-route','r','dean','t',[[2480,1250],[2480,1365],[2310,1365]]);link('direct-dean','b','dean-route',[2302,1310],[[210,1220],[2200,1220],[2200,1310]],'[Yes]',[310,1200]);
 dec('dean-approved',5,1605,'Dean\napproved?');link('dean','b','dean-approved','t');act('dean-rejected',0,1605,'View rejection notice','p2');node('dean-rejected-end',0,1730,'','final');link('dean-approved','l','dean-rejected','r',[],'[No]',[2070,1575]);link('dean-rejected','b','dean-rejected-end','t');
 node('approved',1,1450,'','join');node('approval-ready',1,1750,'','join');
 for(const key of ['approved','approval-ready']){nodes[key].joinSpec='or';shapes.querySelector(`[data-swimlane-node="${key}"]`).setAttribute('data-join-spec','or');}

 link('dean-approved','b','approval-ready',[710,1742],[[2310,1710],[710,1710]],'[Yes]',[2390,1705]);
 link('faculty-approved','b','approved',[730,1442],[[630,1395],[730,1395]],'[Yes]',[700,1360]);
 link('faculty-scheduled','b','approved',[530,1442],[[630,965],[435,965],[435,1400],[530,1400]],'[Yes]',[480,1370]);
 link('faculty-scheduled','r','dean-route',[2302,1190],[[2150,860],[2150,1190]],'[No]',[1450,885]);
 // Sequential preparation: requester first, then the selected laboratory staff.
 link('approved','b','approval-ready',[550,1742],[[630,1680],[550,1680]]);
 dec('prepare-requester',0,1835,'Requester?');link('approval-ready','b','prepare-requester',[275,1810],[[630,1810]]);
 act('prepare-user',0,1970,'Check final approval;\nprepare for session','p2');act('prepare-faculty',1,1970,'Check booking details;\nprepare for session','p2');
 link('prepare-requester','b','prepare-user','t',[],'[Class Rep.]',[290,1900]);link('prepare-requester','r','prepare-faculty','t',[[630,1835]],'[Faculty]',[520,1810]);
 node('requester-prepared',1,2090,'','join');nodes['requester-prepared'].joinSpec='or';
 shapes.querySelector('[data-swimlane-node="requester-prepared"]').setAttribute('data-join-spec','or');
 link('prepare-user','b','requester-prepared',[490,2082],[[210,2030],[490,2030]]);
 link('prepare-faculty','b','requester-prepared',[680,2082],[[630,2025],[680,2025]]);
 dec('lab',2,2090,'Laboratory?');link('requester-prepared','b','lab',[985,2115],[[630,2145],[880,2145],[880,2115]]);
 act('prepare-circuit',2,2230,'Check stock / booking;\nprepare Circuit items','p4');act('prepare-physics',3,2230,'Check stock / booking;\nprepare Physics items','p4');
 link('lab','b','prepare-circuit','t',[],'[Circuit]',[1130,2160]);link('lab','r','prepare-physics','t',[[1470,2090]],'[Physics]',[1380,2060]);
 node('prepare-join',1,2380,'','join');nodes['prepare-join'].joinSpec='or';
 shapes.querySelector('[data-swimlane-node="prepare-join"]').setAttribute('data-join-spec','or');
 link('prepare-circuit','l','prepare-join',[530,2372],[[530,2230]]);
 link('prepare-physics','b','prepare-join',[730,2372],[[1470,2300],[730,2300]]);
 for(const [source,name] of [['prepare-circuit','Circuit'],['prepare-physics','Physics']]){
  routes.find(r=>r.from===source&&r.to==='prepare-join').name=name;
  edges.querySelector(`[data-control-from="${source}"][data-control-to="prepare-join"]`).setAttribute('data-edge-name',name);
 }
 dec('service-lab',2,2450,'Laboratory?');link('prepare-join','b','service-lab','l',[[630,2450]]);act('circuit-service',2,2580,'Issue lab items;\ncheck returned items','p4');act('physics-service',3,2580,'Issue lab items;\ncheck returned items','p4');link('service-lab','b','circuit-service','t',[],'[Circuit]',[1130,2517]);link('service-lab','r','physics-service','t',[[1470,2450]],'[Physics]',[1380,2420]);
 node('returns',2,2745,'','join');nodes.returns.joinSpec='or';
 shapes.querySelector('[data-swimlane-node="returns"]').setAttribute('data-join-spec','or');
 link('circuit-service','b','returns',[970,2737],[[1050,2700],[970,2700]]);
 link('physics-service','b','returns',[1130,2737],[[1470,2695],[1130,2695]]);

 dec('balance',4,2745,'Unresolved\nbalance?');link('returns','b','balance',[1825,2720],[[1050,2810],[1700,2810],[1700,2720]]);act('clearance',4,2880,'Identify student;\ncreate clearance','p5');node('balance-end',0,2975,'','final');link('balance','b','clearance','t',[],'[Yes]',[1957,2816]);act('clearance-view',0,2880,'View student, item\nand clearance status','p5');link('clearance','l','clearance-view','r');link('clearance-view','b','balance-end','t');
 act('completed',1,2745,'View Completed status;\nlogs saved automatically','p2');link('balance','l','completed','r',[[1745,2745],[1745,2680],[860,2680],[860,2745]],'[No]',[1700,2710]);
 act('report',4,3050,'View automatic logs;\nexport report if needed','p5');link('completed','b','report','l',[[630,3050]]);node('end',4,3120,'','final');link('report','r','end','r',[[2090,3050],[2090,3120]]);
 window.SystemSwimlaneGeometry={nodes,routes,laneBounds:bounds,width:2520,height:3800};return svg;
};
})();
