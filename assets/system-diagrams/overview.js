/* Whole-system UML overviews. Branches are alternatives, not five mandatory jobs.
 * The detailed source catalogue remains evidence; it is not printed as separate pages. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
function node(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))e.setAttribute(k,v);parent?.append(e);return e;}
function label(parent,x,y,value,{size=18,anchor='middle',bold=false}={}){
 const rows=value.split('\n'),text=node('text',{x,y,'text-anchor':anchor,'font-size':size,'font-weight':bold?700:400},parent);
 rows.forEach((r,i)=>{node('tspan',{x,y:y+(i-(rows.length-1)/2)*size*1.12},text).textContent=r;});return text;
}
function canvas(title,id,height){const s=node('svg',{xmlns:NS,viewBox:`0 0 1200 ${height}`,role:'img','aria-labelledby':id+'-title'});node('title',{id:id+'-title'},s).textContent=title;
 const defs=node('defs',{},s);for(const kind of ['filled','open']){const m=node('marker',{id:id+'-'+kind,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto'},defs);node('path',{d:'M1 1 L9 5 L1 9'+(kind==='filled'?' Z':''),fill:kind==='filled'?'#253f58':'none',stroke:'#253f58','stroke-width':1.4},m);}return s;
}
function edge(s,id,points,reply=false,async=false){return node('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),class:'line'+(reply?' return':''),'marker-end':`url(#${id}-${reply||async?'open':'filled'})`},s);}
function action(s,x,y,w,h,words,attrs={}){const g=node('g',attrs,s);node('rect',{x:x-w/2,y:y-h/2,width:w,height:h,rx:9,class:'activity-action'},g);label(g,x,y+5,words,{size:17});return g;}
function diamond(s,x,y,rx=25,ry=22){node('path',{d:`M${x} ${y-ry} L${x+rx} ${y} L${x} ${y+ry} L${x-rx} ${y} Z`,class:'activity-action'},s);}
function end(s,x,y){node('circle',{cx:x,cy:y,r:10,fill:'white',stroke:'#253f58','stroke-width':2},s);node('circle',{cx:x,cy:y,r:6,fill:'#253f58'},s);}
function activity(id){
 const s=canvas('Whole-system Swimlane Activity Diagram — DFD Level 2',id,960);
 const models=window.SystemDiagramChildProcesses;
 [[0,405,'Authorized human actors'],[405,495,'Laboratory web system'],[900,300,'Persistent records']].forEach(([x,w,name])=>{node('rect',{x:x+2,y:2,width:w-4,height:954,class:'lane-bg'},s);node('rect',{x:x+2,y:2,width:w-4,height:45,fill:'#eef3f8'},s);label(s,x+w/2,30,name,{size:19,bold:true});});
 function processGroup(y,p,indices){
  const model=models.find(m=>m.id===p),height=indices.length*25+18,g=node('g',{'data-process':p},s);
  node('rect',{x:425,y:y-height/2,width:430,height,rx:9,class:'activity-action'},g);
  indices.forEach((index,i)=>{
   const child=p+'.'+(index+1),name=child.slice(1)+' '+model.steps[index];
   const t=label(g,640,y+(i-(indices.length-1)/2)*25+6,name,{size:20});
   t.setAttribute('data-child-process',child);
   t.setAttribute('data-child-name',model.steps[index]);
  });
 }
 node('circle',{cx:170,cy:70,r:8,fill:'#253f58'},s);edge(s,id,[[170,78],[170,86]]);
 action(s,170,110,250,48,'Any documented role:\nenter credentials');
 processGroup(110,'p1',[0,1]);action(s,1022,110,175,48,'D1\nAccount data');
 edge(s,id,[[295,110],[425,110]]);edge(s,id,[[855,110],[934.5,110]]);
 edge(s,id,[[1022,134],[1022,153],[640,153],[640,163]]);diamond(s,640,185);label(s,681,179,'Valid?',{anchor:'start',size:17});
 action(s,170,185,250,40,'Read login failure');edge(s,id,[[615,185],[295,185]]);label(s,450,174,'[no]',{size:17});edge(s,id,[[45,185],[32,185]]);end(s,22,185);
 edge(s,id,[[640,207],[640,224],[170,224],[170,233]]);label(s,659,219,'[yes: scoped session]',{anchor:'start',size:16});
 diamond(s,170,255);label(s,214,252,'Choose permitted goal',{size:18,anchor:'start',bold:true});
 const bands=[
  {p:'p1',y:325,guard:'[Head Laboratory: account issuance]',indices:[2],records:'D1\nAccount record'},
  {p:'p2',y:430,guard:'[Requesters / approvers]',indices:[0,1,2,3],records:'D2 holds / status\nRead D3, D4'},
  {p:'p3',y:550,guard:'[Class Representative / Faculty: inquiry]',indices:[0,1,2,3],records:'Read D2, D3, D4, D8\nWrite D9'},
  {p:'p4',y:685,guard:'[Head / assigned Laboratory Staff]',indices:[0,1,2,3,4],records:'D2 / D4 / D5\nD10 disposal'},
  {p:'p5',y:830,guard:'[Head / Class Representative¹]',indices:[0,1,2,3,4],records:'D2–D7 / D10\nLogical records'}
 ];
 bands.forEach((b,i)=>{
  const t=1-i*.2,start=[145+25*t,255+22*t],lane=133-i*22;
  edge(s,id,[start,[lane,start[1]],[lane,b.y],[425,b.y]]);
  label(s,267,b.y-10,b.guard,{size:15.5});
  processGroup(b.y,b.p,b.indices);action(s,1022,b.y,175,52,b.records);
  edge(s,id,[[855,b.y],[934.5,b.y]]);
  const laneX=1170-i*10,joinY=927-i*3,joinX=918-(930-joinY);
  edge(s,id,[[1109.5,b.y],[laneX,b.y],[laneX,joinY],[joinX,joinY]]);
 });
 diamond(s,900,930,18,18);edge(s,id,[[882,930],[820,930]]);
 action(s,620,930,400,36,'Show result, correction or pending status');edge(s,id,[[420,930],[395,930]]);end(s,385,930);
 return s;
}
function sequence(id){
 const s=canvas('Whole-system Sequence Diagram',id,790),xs=[110,440,785,1090];
 const heads=['Acting role*\n(browser)','Laboratory web system','Logical records\nD1–D10','Faculty\n(email recipient)'];
 heads.forEach((name,i)=>{const human=i===0||i===3;node('rect',{x:xs[i]-(human?100:135),y:5,width:human?200:270,height:64,fill:'#f4f7fa',stroke:'#42566b'},s);label(s,xs[i],33,name,{size:19,bold:true});node('line',{x1:xs[i],y1:77,x2:xs[i],y2:780,stroke:'#788a9b','stroke-dasharray':'5 5'},s);});
 function message(from,to,y,words,{reply=false,async=false}={}){label(s,(xs[from]+xs[to])/2,y-7,words,{size:18});edge(s,id,[[xs[from],y],[xs[to],y]],reply,async);}
 function activation(x,y,h){node('rect',{x:x-5,y,width:10,height:h,fill:'#e5edf5',stroke:'#42566b'},s);}
 activation(xs[1],100,74);activation(xs[2],124,24);
 message(0,1,100,'Credentials');message(1,2,124,'Read D1 account');message(2,1,148,'Role / lab data',{reply:true});message(1,0,174,'Session OR login failure',{reply:true});
 node('rect',{x:8,y:188,width:1184,height:577,class:'fragment'},s);label(s,25,208,'opt [authenticated session — one selected operation]',{size:18,anchor:'start',bold:true});
 node('rect',{x:16,y:220,width:1168,height:484,class:'fragment'},s);
 const bands=[
  {p:'p1',top:220,bottom:338,guard:'alt [Head Laboratory: issue account]',call:'1.3 Issue representative account',db:'Check / save account (D1)',reply:'Account record / refusal',extra:'Email credentials'},
  {p:'p2',top:338,bottom:432,guard:'[Class Rep. / Faculty: request, change, track | Faculty / Dean: approve]',call:'2.1–2.4 Reservation action',db:'D2 + read D3 / D4',reply:'Status / decision / refusal'},
  {p:'p3',top:432,bottom:550,guard:'[Class Representative / Faculty: informational laboratory Q&A]',call:'3.1–3.4 Ask question',db:'Read scoped D2/D3/D4/D8',reply:'Evidence / unavailable',extra:'Write Q&A log (D9)'},
  {p:'p4',top:550,bottom:644,guard:'[Head Laboratory / assigned Lab Staff: inventory, issue, return, disposal]',call:'4.1–4.5 Equipment action',db:'D2 / D4 / D5 / D10',reply:'Slip / stock / outcome'},
  {p:'p5',top:644,bottom:738,guard:'[Head: logs, tasks, clearance, reports | Class Rep.: own-group clearance only]',call:'5.1–5.5 Permitted admin action',db:'Read / write D2–D7 / D10',reply:'Logs / clearance / report'}
 ];
 // One alt fragment spans all five mutually exclusive operands and the same lifelines.
 s.querySelectorAll('.fragment')[1].setAttribute('height',518);
 bands.forEach((b,i)=>{
  const group=node('g',{'data-process':b.p},s);label(group,30,b.top+19,b.guard,{size:17,anchor:'start',bold:true});
  if(i)node('line',{x1:16,y1:b.top,x2:1184,y2:b.top,stroke:'#42566b','stroke-dasharray':'7 5'},s);
  activation(xs[1],b.top+47,b.bottom-b.top-49);activation(xs[2],b.top+69,22);
  message(0,1,b.top+47,b.call);message(1,2,b.top+69,b.db);message(2,1,b.top+91,b.reply,{reply:true});
  if(b.extra)message(1,b.p==='p1'?3:2,b.top+113,b.extra,{async:b.p==='p1'});
 });
 message(1,0,760,'Result / validation error',{reply:true});
 return s;
}
window.SystemDiagramOverview={activity,sequence};
})();
