/* A4 portrait UML responsibility overview; detailed alternatives remain in
 * Activities 1–5. Each approver acts inside their own actor partition. */
(function(){
'use strict';
window.SystemPortraitSwimlane=function(id){
 const NS='http://www.w3.org/2000/svg',nodes={},routes=[];
 const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));parent?.append(n);return n;};
 const svg=el('svg',{xmlns:NS,viewBox:'0 0 2520 3564',role:'img','aria-label':'Overall laboratory service UML swimlane: six actor partitions',class:'swimlane-flowchart'});
 el('style',{},svg).textContent='.swimlane-flowchart text{font-family:Arial,Helvetica,sans-serif;fill:#000}.swimlane-flowchart .line{fill:none;stroke:#000;stroke-width:3}.swimlane-flowchart .lane-bg,.swimlane-flowchart .flow-shape{fill:#fff;stroke:#000;stroke-width:2.5}';
 const marker=el('marker',{id:id+'-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:9,markerHeight:9,orient:'auto'},el('defs',{},svg));el('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#000'},marker);
 const lanes=el('g',{},svg),edges=el('g',{},svg),shapes=el('g',{},svg),labels=el('g',{},svg);
 const Y=3564/3370,bounds=[2,420,840,1260,1680,2100,2518],centers=[210,630,1050,1470,1890,2310];
 const flowY=y=>y>985?y+400:y>860?y+(y-860)*3.2:y;
 function text(parent,x,y,value,size=29,bold=false){y=flowY(y)*Y;const rows=value.split('\n'),t=el('text',{'text-anchor':'middle','font-size':size,'font-weight':bold?700:400},parent);rows.forEach((row,i)=>el('tspan',{x,y:y+(i-(rows.length-1)/2)*size*1.12+size*.33},t).textContent=row);return t;}
 text(lanes,1260,35,'Laboratory Management — Overall Swimlane',40,true);
 ['Class Representative','Faculty','Circuit Staff','Physics Staff','Head Lab','Dean'].forEach((name,i)=>{el('rect',{x:bounds[i],y:64*Y,width:bounds[i+1]-bounds[i],height:3304*Y,class:'lane-bg','data-lane':i,'data-lane-name':name},lanes);el('line',{x1:bounds[i],x2:bounds[i+1],y1:125*Y,y2:125*Y,stroke:'#000','stroke-width':2.5},lanes);text(lanes,centers[i],95,name,30,true);});
 function node(key,lane,y,title,kind='action',process){
  const x=centers[lane];let w=350,h=86;
  if(['admin','admin-tasks'].includes(key))w=310;
  if(kind==='decision'){w=260;h=100;}
  // Compact Faculty decisions leave visible shafts before their arrowheads.
  if(kind==='decision'&&lane===1)h=100;
  if(kind==='merge'){w=190;h=100;}
  // Invisible convergence point: alternative routes share one outgoing arrow.
  // User-requested simplified notation, not a standard UML merge symbol.
  if(kind==='connector'){w=0;h=0;}
  if(kind==='initial'||kind==='final'){w=46;h=46;}
  if(kind==='fork'||kind==='join'){w=340;h=16;}
  if(key==='dean-route'){w=16;h=180;}
  const logicalY=y;y=flowY(y)*Y;if(!['initial','final','connector'].includes(kind))h*=Y;
  const n={x:x-w/2,y:y-h/2,w,h,lane,kind,title};nodes[key]=n;
  const g=el('g',{'data-swimlane-node':key,'data-uml-kind':kind,...(process?{'data-process':process}:{})},shapes);
  if(kind==='connector'){
   g.setAttribute('data-flow-semantics','exclusive-merge');
   el('title',{},g).textContent='Alternative request paths converge here without an extra shape; one outgoing flow continues.';
  }
  else if(kind==='decision'||kind==='merge')el('path',{d:`M${x} ${n.y} L${x+w/2} ${y} L${x} ${n.y+h} L${x-w/2} ${y} Z`,class:'flow-shape'},g);
  else if(kind==='initial'||kind==='final'){el('circle',{cx:x,cy:y,r:23,fill:kind==='initial'?'#000':'#fff',stroke:'#000','stroke-width':3},g);if(kind==='final')el('circle',{cx:x,cy:y,r:15,fill:'#000'},g);}
  else if(kind==='fork'||kind==='join')el('rect',{x:n.x,y:n.y,width:w,height:h,rx:Math.min(w,h)/2,fill:'#000'},g);
  else el('rect',{x:n.x,y:n.y,width:w,height:h,rx:h/2,class:'flow-shape'},g);
  if(title)text(g,x,logicalY,title,kind==='decision'?26:['admin','admin-tasks'].includes(key)?25:28,kind==='action');return n;
 }
 const act=(key,lane,y,title,p)=>node(key,lane,y,title,'action',p),dec=(key,lane,y,title)=>node(key,lane,y,title,'decision');
 const point=(key,side)=>{if(Array.isArray(side))return side[2]==='raw'?[side[0],side[1]]:[side[0],flowY(side[1])*Y];const n=nodes[key];return side==='l'?[n.x,n.y+n.h/2]:side==='r'?[n.x+n.w,n.y+n.h/2]:side==='t'?[n.x+n.w/2,n.y]:[n.x+n.w/2,n.y+n.h];};
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
  routes.push({from,to,points:clean,guard:guard||null});if(guard&&at){const t=text(labels,at[0],at[1],guard,24);t.setAttribute('style','fill:#000;stroke:#fff;stroke-width:7;paint-order:stroke');}
 }
 // Supporting preparation is optional, not a new reservation approval gate.
 node('start',4,175,'','initial');dec('readiness',4,285,'Updates\nneeded?');act('admin',4,400,'Enter account details;\ncreate / update','p1');act('admin-tasks',4,535,'Schedule / daily tasks\n(as needed)','p5');node('ready',4,690,'','join');
 act('faculty-identity',1,280,'For Class Rep.: confirm\nname, ID and section','p1');
 act('faculty-handoff',1,400,'Get new login details;\ngive Class Rep. theirs','p1');
 link('start','b','readiness','t');link('readiness','l','faculty-identity','r',[[1000,285],[1000,280]],'[Yes]',[1400,260]);link('faculty-identity','b','admin','l',[[630,345],[1650,345],[1650,400]]);link('readiness','r','ready',[1980,nodes.ready.y,'raw'],[[2070,285],[2070,615],[1980,615]],'[No]',[2110,550]);
 link('admin','b','faculty-handoff','r',[[1890,465],[1000,465],[1000,400]]);link('faculty-handoff','b','admin-tasks','l',[[630,490],[1600,490],[1600,nodes['admin-tasks'].y+nodes['admin-tasks'].h/2,'raw']]);link('admin-tasks','b','ready',[1800,nodes.ready.y,'raw'],[[1890,625],[1800,625]]);
 dec('question',0,575,'Need lab help?');act('ask',0,735,'Ask AI about\nlaboratory questions','p3');node('request-ready',0,860,'','join');
 nodes['request-ready'].joinSpec='or';shapes.querySelector('[data-swimlane-node="request-ready"]').setAttribute('data-join-spec','or');text(labels,280,875,'{joinSpec = or}',20);
 nodes.ready.joinSpec='or';shapes.querySelector('[data-swimlane-node="ready"]').setAttribute('data-join-spec','or');text(labels,1990,724,'{joinSpec = or}',20);
 dec('requester',1,575,'Requester?');link('ready','b','requester','r',[[1890,760],[1100,760],[1100,575]]);link('requester','l','question','r',[],'[Class Rep.]',[420,548]);
 act('faculty-request',1,720,'Check slots / ask AI;\nsubmit own request','p2');dec('faculty-scheduled',1,860,'On assigned\nschedule?');link('requester','b','faculty-request','t',[],'[Faculty]',[707,651]);link('faculty-request','b','faculty-scheduled','t');
 link('question','b','ask','t',[],'[Yes]',[273,651]);link('question','l','request-ready',[100,852],[[25,575],[25,815],[100,815]],'[No]',[65,790]);link('ask','b','request-ready',[260,852],[[210,805],[260,805]]);
 act('select-type',0,892,'Choose class and type;\nselect student(s)','p2');link('request-ready','b','select-type','t');
 dec('reservation-type',0,925,'Group or\nStudent Only?');link('select-type','b','reservation-type','t');node('type-merge',0,960,'','join');
 nodes['type-merge'].joinSpec='or';shapes.querySelector('[data-swimlane-node="type-merge"]').setAttribute('data-join-spec','or');
 link('reservation-type','l','type-merge',[110,nodes['type-merge'].y,'raw'],[[45,925],[45,nodes['type-merge'].y-65,'raw'],[110,nodes['type-merge'].y-65,'raw']],'[Group]',[90,936]);
 link('reservation-type','r','type-merge',[310,nodes['type-merge'].y,'raw'],[[390,925],[390,nodes['type-merge'].y-65,'raw'],[310,nodes['type-merge'].y-65,'raw']],'[Student Only]',[302,936]);
 text(labels,310,971,'{joinSpec = or}',18);
 act('request',0,985,'Submit reservation;\non- / out-of-schedule','p2');link('type-merge','b','request','t');act('review',1,985,'Review class request;\nApprove / Reject','p2');link('request','r','review','l');
 dec('faculty-approved',1,1126,'Faculty\napproved?');link('review','b','faculty-approved','t');act('rejected',0,1126,'View rejection notice','p2');node('rejected-end',0,1240,'','final');link('faculty-approved','l','rejected','r',[],'[No]',[416,1096]);link('rejected','b','rejected-end','t');
 dec('off-schedule',1,1295,'Out of\nschedule?');link('faculty-approved','b','off-schedule','t',[],'[Yes]',[690,1201]);
 node('dean-route',5,1250,'','join');nodes['dean-route'].joinSpec='or';
 shapes.querySelector('[data-swimlane-node="dean-route"]').setAttribute('data-join-spec','or');
 text(labels,2330,1110,'{joinSpec = or}',22);
 act('dean',5,1460,'Review request;\nApprove / Reject','p2');link('dean-route','r','dean','t',[[2480,1250],[2480,1365],[2310,1365]]);link('off-schedule','b','dean-route',[2302,1310],[[630,1385],[2150,1385],[2150,1310]],'[Yes]',[730,1360]);
 dec('dean-approved',5,1605,'Dean\napproved?');link('dean','b','dean-approved','t');act('dean-rejected',0,1605,'View rejection notice','p2');node('dean-rejected-end',0,1730,'','final');link('dean-approved','l','dean-rejected','r',[],'[No]',[2070,1575]);link('dean-rejected','b','dean-rejected-end','t');
 node('approved',1,1450,'','join');node('approval-ready',1,1750,'','join');
 for(const key of ['approved','approval-ready']){nodes[key].joinSpec='or';shapes.querySelector(`[data-swimlane-node="${key}"]`).setAttribute('data-join-spec','or');}
 text(labels,735,1505,'{joinSpec = or}',20);text(labels,735,1795,'{joinSpec = or}',20);
 link('dean-approved','b','approval-ready',[710,1742],[[2310,1710],[710,1710]],'[Yes]',[2390,1705]);
 link('off-schedule','r','approved',[730,1442],[[825,1295],[825,1380],[730,1380]],'[No]',[875,1350]);
 link('faculty-scheduled','l','approved',[530,1442],[[435,860],[435,1400],[530,1400]],'[Yes]',[480,1370]);
 link('faculty-scheduled','r','dean-route',[2302,1190],[[2150,860],[2150,1190]],'[No]',[1050,840]);
 // Independent requester/staff preparation; staff assignment is exclusive.
 node('prepare-fork',1,1835,'','fork');link('approved','b','approval-ready',[550,1742],[[630,1680],[550,1680]]);link('approval-ready','b','prepare-fork','t');dec('prepare-requester',0,1835,'Requester?');link('prepare-fork','l','prepare-requester','r');
 act('prepare-user',0,2010,'Check final approval;\nprepare for session','p2');act('prepare-faculty',1,2010,'Check booking details;\nprepare for session','p2');
 link('prepare-requester','b','prepare-user','t',[],'[Class Rep.]',[290,1935]);link('prepare-requester',[275,1867.5],'prepare-faculty','t',[[405,1867.5],[405,1895],[630,1895]],'[Faculty]',[545,1870]);
 dec('lab',2,1835,'Laboratory?');link('prepare-fork','r','lab','l');act('prepare-circuit',2,1970,'Check stock / booking;\nprepare Circuit items','p4');act('prepare-physics',3,1970,'Check stock / booking;\nprepare Physics items','p4');link('lab','b','prepare-circuit','t',[],'[Circuit]',[1120,1897]);link('lab','r','prepare-physics','t',[[1470,1835]],'[Physics]',[1383,1801]);
 node('prepare-join',1,2160,'','join');nodes['prepare-join'].joinSpec='(Rep or Faculty) and (Circuit or Physics)';
 shapes.querySelector('[data-swimlane-node="prepare-join"]').setAttribute('data-join-spec',nodes['prepare-join'].joinSpec);
 link('prepare-user','b','prepare-join',[490,2152],[[210,2090],[490,2090]]);
 link('prepare-faculty','b','prepare-join',[580,2152],[[630,2075],[580,2075]]);
 link('prepare-circuit','b','prepare-join',[680,2152],[[1050,2105],[680,2105]]);
 link('prepare-physics','b','prepare-join',[770,2152],[[1470,2070],[770,2070]]);
 for(const [source,name] of [['prepare-user','Rep'],['prepare-faculty','Faculty'],['prepare-circuit','Circuit'],['prepare-physics','Physics']]){
  routes.find(r=>r.from===source&&r.to==='prepare-join').name=name;
  edges.querySelector(`[data-control-from="${source}"][data-control-to="prepare-join"]`).setAttribute('data-edge-name',name);
 }
 text(labels,1100,2180,'{joinSpec =\n(Rep or Faculty) and\n(Circuit or Physics)}',22);
 text(labels,350,2070,'Rep',22);text(labels,520,2110,'Faculty',22);text(labels,900,2085,'Circuit',22);text(labels,1300,2048,'Physics',22);
 dec('service-lab',2,2320,'Laboratory?');link('prepare-join','b','service-lab','l',[[630,2320]]);act('circuit-service',2,2450,'Issue lab items;\ncheck returned items','p4');act('physics-service',3,2450,'Issue lab items;\ncheck returned items','p4');link('service-lab','b','circuit-service','t',[],'[Circuit]',[1130,2387]);link('service-lab','r','physics-service','t',[[1470,2320]],'[Physics]',[1380,2287]);
 node('returns',2,2565,'','join');nodes.returns.joinSpec='or';
 shapes.querySelector('[data-swimlane-node="returns"]').setAttribute('data-join-spec','or');
 link('circuit-service','b','returns',[970,2557],[[1050,2520],[970,2520]]);
 link('physics-service','b','returns',[1130,2557],[[1470,2515],[1130,2515]]);
 text(labels,1050,2670,'{joinSpec = or}',22);
 dec('balance',4,2565,'Unresolved\nbalance?');link('returns','b','balance','l',[[1050,2630],[1720,2630],[1720,2565]]);act('clearance',4,2700,'Identify student;\ncreate clearance','p5');node('balance-end',0,2795,'','final');link('balance','b','clearance','t',[],'[Yes]',[1957,2636]);act('clearance-view',0,2700,'View student, item\nand clearance status','p5');link('clearance','l','clearance-view','r');link('clearance-view','b','balance-end','t');
 act('completed',1,2565,'View Completed status;\nlogs saved automatically','p2');link('balance','t','completed','t',[[1890,2235],[855,2235],[855,2470],[630,2470]],'[No]',[1935,2350]);
 act('report',4,2870,'View automatic logs;\nexport report if needed','p5');link('completed','b','report','l',[[630,2870]]);node('end',4,2940,'','final');link('report','r','end','r',[[2090,2870],[2090,2940]]);
 window.SystemSwimlaneGeometry={nodes,routes,laneBounds:bounds,width:2520,height:3564};return svg;
};
})();
