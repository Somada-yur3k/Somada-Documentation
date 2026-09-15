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
 const v=svg('Deployment: candidate client devices and logical infrastructure',id);
 const palettes={
  client:{edge:'#2168a1',face:'#edf6ff',cap:'#cce5fb'},
  app:{edge:'#247558',face:'#effaf3',cap:'#ccebdc'},
  records:{edge:'#7053a0',face:'#f5f0ff',cap:'#e1d5f6'},
  email:{edge:'#9a661a',face:'#fff9eb',cap:'#f9e7bc'}
 };
 // Decorative vector icons retain sharp edges in the A4 PDF.
 function icon(kind,x,y,color){
  const g=el('g',{transform:'translate('+x+' '+y+')',fill:'none',stroke:color,'stroke-width':2.6,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true','data-icon':kind},v);
  const rect=(x,y,width,height,rx=2)=>el('rect',{x,y,width,height,rx},g);
  const line=d=>el('path',{d},g);
  if(kind==='desktop'){rect(2,2,36,24);line('M20 26 V35 M10 36 H30');}
  if(kind==='laptop'){rect(5,3,30,23);line('M5 26 L0 33 H40 L35 26 M15 30 H25');}
  if(kind==='phone'){rect(10,0,22,39,4);line('M17 5 H25 M19 34 H23');}
  if(kind==='server'){[0,14,28].forEach(y=>{rect(1,y,39,10);line('M7 '+(y+5)+' H9 M15 '+(y+5)+' H33');});}
  if(kind==='database'){el('ellipse',{cx:20,cy:6,rx:19,ry:6},g);line('M1 6 V32 C1 40 39 40 39 32 V6 M1 19 C1 27 39 27 39 19');}
  if(kind==='mail'){rect(0,4,40,29,3);line('M1 6 L20 21 L39 6 M1 32 L13 21 M39 32 L27 21');}
 }
 function node(x,y,w,h,title,kind,palette){
  const p=palettes[palette],g=el('g',{'data-node':kind},v);
  el('path',{d:'M'+x+' '+y+' l12 -12 h'+w+' l-12 12 Z',fill:p.cap,stroke:p.edge,'stroke-width':2},g);
  el('path',{d:'M'+(x+w)+' '+y+' l12 -12 v'+h+' l-12 12 Z',fill:p.cap,stroke:p.edge,'stroke-width':2},g);
  el('rect',{x,y,width:w,height:h,fill:p.face,stroke:p.edge,'stroke-width':2},g);
  icon(kind,x+15,y+17,p.edge);
  text(v,x+w/2+26,y+28,title,{font:20,bold:true,max:24});
  return p;
 }
 function panel(x,y,w,h,color){el('rect',{x,y,width:w,height:h,rx:4,fill:'#ffffff',stroke:color,'stroke-width':1.3},v);}
 // Device types are alternatives, not a purchased inventory or one device per role.
 const clients=[{y:30,title:'Desktop computer',icon:'desktop'},{y:215,title:'Laptop computer',icon:'laptop'},{y:400,title:'Smartphone',icon:'phone'}];
 clients.forEach(c=>{
  const p=node(20,c.y,280,158,'«device»\n'+c.title,c.icon,'client');
  panel(34,c.y+65,252,81,p.edge);
  text(v,160,c.y+83,'«executionEnvironment» Browser',{font:15,max:40});
  panel(45,c.y+95,230,40,p.edge);
  text(v,160,c.y+119,'«artifact»\nLaboratory web interface',{font:15,max:32});
 });
 const app=node(460,90,310,420,'«device»\nApplication host','server','app');
 panel(477,164,276,328,app.edge);
 text(v,615,198,'«executionEnvironment»\nWeb application runtime',{font:18,max:30});
 text(v,615,237,'Implementation not yet selected',{font:15,max:38});
 panel(490,260,250,214,app.edge);
 text(v,615,295,'«artifact»\nLaboratory application',{font:19,bold:true,max:29});
 text(v,615,380,'1.0 Accounts / access\n2.0 Reservations / approvals\n3.0 Informational Q&A\n4.0 Equipment / borrowing\n5.0 Lab administration',{font:18,max:31});
 const db=node(920,90,255,375,'«device»\nPersistence host','database','records');
 panel(935,164,225,279,db.edge);
 text(v,1047,198,'«executionEnvironment»\nPersistence / DBMS',{font:17,max:28});
 text(v,1047,233,'Not yet selected',{font:16,max:28});
 panel(948,259,199,165,db.edge);
 text(v,1047,298,'«artifact»\nLogical record schema',{font:17,bold:true,max:25});
 text(v,1047,373,'D1–D10\nPhysical ERD pending',{font:17,max:25});
 node(885,550,290,127,'«device»\nEmail infrastructure','mail','email');
 text(v,1030,637,'Account credentials to Faculty\nProvider / transport unspecified',{font:16,max:39});
 // UML communication paths are undirected; each client connects to the app.
 clients.forEach((c,i)=>{
  const lane=345+i*35,port=215+i*95;
  path(v,[[312,c.y+79],[lane,c.y+79],[lane,port],[460,port]],id,{head:false});
 });
 text(v,382,50,'Web access\nProtocol TBD',{font:16,max:19});
 path(v,[[782,290],[920,290]],id,{head:false});
 text(v,851,267,'Record access\nProtocol TBD',{font:16,max:18});
 path(v,[[770,490],[820,490],[820,610],[885,610]],id,{head:false});
 text(v,1004,509,'Credential email · transport TBD',{font:16,max:40});
 // Device counts and deployment assumptions are intentionally explicit.
 panel(20,586,750,91,'#c8d5e2');
 text(v,37,608,'3 client device types illustrated • Actual unit counts: TBD',{font:19,bold:true,anchor:'start',max:80});
 text(v,37,647,'All six roles use authorized, role-scoped access. Client compatibility needs testing.\nInfrastructure boxes are logical placements and may share a host.\nHTTPS recommended; no direct browser-to-records access or external AI provider assumed.',{font:16,anchor:'start',max:105});
 return v;
}
function html(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n;}
let pageNo=0;
function sheet(group,type,s){
 const code=type==='deployment'?'DEP-01':type==='activity'?'ACT-01':'SEQ-01';
 const id=type==='deployment'?'deployment-view':type+'-'+s.id;
 const wrap=html('div','sheet-scroll'),paper=html('article','sheet');paper.id=id;
 const header=html('header','sheet-head'),titles=html('div');titles.append(html('small','',type+' diagram · NU Fairview laboratory system'),html('h2','',type==='deployment'?'Deployment — technology-neutral design':s.title));header.append(titles,html('span','page-code',code));paper.append(header);
 const subtitle=type==='deployment'?'Documented functions; candidate node placement. No implementation or hosting selection is asserted.':s.actors.join(' · ')+(s.recipient?' | Recipient: '+s.recipient:'');
 paper.append(html('p','sheet-subtitle',subtitle));const canvas=html('div','canvas');canvas.append(type==='deployment'?deployment(id):window.SystemDiagramOverview[type](id));paper.append(canvas);
 paper.append(html('p','sheet-note',type==='deployment'?'The current paper says construction has not begun and the ERD is pending. The documentation site’s hosting and the paused collaboration-workspace draft are not the proposed laboratory application stack.':s.note));
 const foot=html('footer','sheet-foot');const link=html('a','',type==='deployment'?'Sources: Project Overview · Tables 3–22 · DFD 1.0–5.0':'Whole system · DFD 1.0–5.0 · Tables 3–22 · D1–D10');link.href=type==='deployment'?'Docs.html#overview':'assets/figures-v2/dfd-level1/dfd-level1-source.html';
 foot.append(link);if(type!=='deployment'){const pair=html('a','',type==='activity'?'Matching sequence →':'← Matching activity');pair.href='#'+(type==='activity'?'sequence-':'activity-')+s.id;foot.append(pair);}foot.append(html('span','','A4 landscape · '+(++pageNo)));paper.append(foot);wrap.append(paper);document.getElementById(group).append(wrap);
}
const whole={id:'system',title:'Whole-system workflow',actors:['Class Representative','Faculty','Dean','Head Laboratory','Physics Laboratory Staff','Circuits Laboratory Staff'],note:'Branches are alternative authorized operations, not mandatory sequential stages. Validate before saving; errors do not create valid transactions. Faculty scheduled activities need no extra approval; routed requests stay Pending until decided. ¹ Only Head manages logs/tasks/clearance; Class Representative only views own-group clearance. Full conditions remain in Tables 3–22.'};
const decompositionResponse=await fetch('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json');
if(!decompositionResponse.ok)throw new Error('Cannot load the canonical DFD Level 2 subprocesses.');
window.SystemDiagramChildProcesses=await decompositionResponse.json();
sheet('activity','activity',whole);
sheet('sequence','sequence',whole);
sheet('deployment','deployment');
document.getElementById('print').onclick=()=>window.print();
window.__systemDiagramsReady=true;
})().catch(error=>{
 window.__systemDiagramsError=error.message;
 document.getElementById('activity').textContent='Cannot prepare diagrams: '+error.message+'. Serve this page through the website or Live Server, or open the exported PDF.';
});
