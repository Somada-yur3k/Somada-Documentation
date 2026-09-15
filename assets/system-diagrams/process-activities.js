/* One UML Activity view per Level 1 parent. DFD records are evidence, not
 * control-flow arrows: independent operations are alternatives, not forced jobs. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);parent?.append(n);return n;}
function wrap(value,max){return String(value).split('\n').flatMap(part=>{const rows=[];let row='';for(const word of part.split(' ')){if(row&&(row+' '+word).length>max){rows.push(row);row=word;}else row+=(row?' ':'')+word;}rows.push(row);return rows;});}
function draw(model){
 const id='activity-'+model.id,svg=el('svg',{xmlns:NS,viewBox:'0 0 1200 720',role:'img','aria-label':'Activity Diagram — '+model.name,'data-parent':model.id});
 const defs=el('defs',{},svg),marker=el('marker',{id:id+'-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto'},defs);
 el('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#253f58'},marker);
 const edges=el('g',{},svg),shapes=el('g',{},svg),labels=el('g',{},svg),nodes={},routes=[];
 function text(parent,x,y,value,size=18,max=36,bold=false){const rows=wrap(value,max),t=el('text',{'text-anchor':'middle','font-size':size,'font-weight':bold?700:400},parent);rows.forEach((row,i)=>{el('tspan',{x,y:y+i*size*1.14},t).textContent=row;});return rows.length*size*1.14;}
 function action(key,x,y,w,h,title,detail='',child){
  nodes[key]={x:x-w/2,y:y-h/2,w,h,kind:'action'};
  const g=el('g',{'data-activity-node':key,...(child!==undefined?{'data-child-process':model.id+'.'+(child+1),'data-child-name':model.steps[child]}:{})},shapes);
  el('rect',{x:x-w/2,y:y-h/2,width:w,height:h,rx:10,class:'activity-action'},g);
  const heading=child===undefined?title:model.id.slice(1)+'.'+(child+1)+' '+model.steps[child];
  const size=child===undefined?18:19,max=Math.floor((w-24)/(size*.55));
  const used=text(g,x,y-h/2+25,heading,size,max,true);
  if(detail)text(g,x,y-h/2+29+used,detail,17,Math.floor((w-24)/9.2));
 }
 function child(key,index,x,y,w,h,detail){action(key,x,y,w,h,'',detail,index);}
 function decision(key,x,y,title){nodes[key]={x:x-25,y:y-22,w:50,h:44,kind:'decision'};el('path',{d:'M'+x+' '+(y-22)+' L'+(x+25)+' '+y+' L'+x+' '+(y+22)+' L'+(x-25)+' '+y+' Z',class:'activity-action','data-activity-node':key},shapes);if(title)text(labels,Math.min(x+180,1060),y-(wrap(title,28).length>1?37:16),title,18,28,true);}
 function terminal(key,x,y,final=false){nodes[key]={x:x-9,y:y-9,w:18,h:18,kind:final?'final':'initial'};if(final)el('circle',{cx:x,cy:y,r:9,fill:'white',stroke:'#253f58','stroke-width':2},shapes);el('circle',{cx:x,cy:y,r:final?5:8,fill:'#253f58','data-activity-node':key},shapes);}
 function point(key,side){const n=nodes[key];return side==='l'?[n.x,n.y+n.h/2]:side==='r'?[n.x+n.w,n.y+n.h/2]:side==='t'?[n.x+n.w/2,n.y]:[n.x+n.w/2,n.y+n.h];}
 function link(from,fromSide,to,toSide,bends=[],guard){const points=[point(from,fromSide),...bends,point(to,toSide)];el('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),class:'line','marker-end':'url(#'+id+'-arrow)','data-control-from':from,'data-control-to':to},edges);routes.push({from,to,points});if(guard)text(labels,guard[0],guard[1],guard[2],17,46);}
 if(model.id==='p1'){
  terminal('start',600,20);decision('goal',600,100,'Choose access operation');link('start','b','goal','t');
  child('credentials',0,280,220,340,100,'Read D1 account and verify credentials.');
  child('account',2,920,220,340,130,'Validate Student ID and Faculty.\nHead Laboratory only; signed in.');
  link('goal','l','credentials','t',[[280,100]], [295,87,'[Log in: any role]']);
  link('goal','r','account','t',[[920,100]], [1032,128,'[Issue representative\naccount]']);
  decision('valid',280,350,'Credentials valid?');decision('unique',920,350,'Account details valid?');
  link('credentials','b','valid','t');link('account','b','unique','t');
  child('session',1,400,475,300,140,'Apply role and laboratory scope.\nDisplay the role dashboard.');
  action('login-error',100,475,180,90,'Refuse login','No session created.');
  action('save-account',790,475,310,115,'Save account in D1','Email credentials to Faculty\nfor representative hand-off.');
  action('account-error',1110,475,170,120,'Refuse issuance','Duplicate ID or\nmissing Faculty.');
  link('valid','l','login-error','t',[[100,350]],[155,380,'[no]']);link('valid','r','session','t',[[400,350]],[435,380,'[yes]']);
  link('unique','l','save-account','t',[[790,350]],[735,380,'[yes]']);link('unique','r','account-error','t',[[1110,350]],[1155,380,'[no]']);
  decision('done',600,625);for(const k of ['login-error','session','save-account','account-error']){const p=point(k,'b');link(k,'b','done',p[0]<600?'l':'r',[[p[0],625]]);}
  terminal('end',600,695,true);link('done','b','end','t');
 }else if(model.id==='p2'){
  terminal('start',600,20);decision('goal',600,105,'Choose permitted reservation operation');link('start','b','goal','t');
  child('availability',0,215,245,350,90,'Read D2 holds, D3 schedule and D4 items.');
  decision('request-entry',215,335);
  child('request',1,215,420,350,124,'Validate owner, role and timing.\nCheck stock; save valid changes.');
  child('approval',2,650,420,360,120,'Faculty / Dean: decide a routed request.\nNew requests: route for the required decision.');
  child('status',3,990,575,370,115,'Save applicable decision / status;\nshow own status or history.\nRelease cancelled / rejected holds.');
  decision('route',215,560);text(labels,300,510,'Academic approval\nneeded?',18,28,true);decision('status-entry',990,475);
  link('goal','l','availability','t',[[215,105]],[290,90,'[View / submit / reschedule]']);
  link('availability','b','request-entry','t');link('request-entry','b','request','t');
  link('goal','l','request-entry','l',[[20,105],[20,335]],[83,315,'[Cancel]']);
  link('goal','b','approval','t',[[600,165],[650,165]],[774,181,'[Decide routed request]']);
  link('goal','r','status-entry','t',[[990,105]],[1080,140,'[Own status /\nhistory]']);
  link('request','b','route','t');link('route','r','approval','l',[[435,560],[435,420]],[478,512,'[yes]']);
  link('route','r','status','l',[[440,560],[440,575]],[629,601,'[no: scheduled Faculty / cancellation]']);
  link('approval','r','status-entry','l',[[860,420],[860,475]],[925,440,'[Pending /\ndecision]']);link('status-entry','b','status','t');
  action('result',600,670,520,58,'Display availability, result or correction');
  link('request-entry','r','result','l',[[410,335],[410,610],[300,610],[300,670]],[355,597,'[View only]']);
  link('status','b','result','r',[[990,670]]);terminal('end',600,710,true);link('result','b','end','t');
 }else if(model.id==='p3'){
  terminal('start',650,20);child('inquiry',0,650,100,480,95,'Capture the signed-in requester’s question.');link('start','b','inquiry','t');
  decision('scope',650,225,'Informational and permitted?');link('inquiry','b','scope','t');
  child('evidence',1,650,335,480,105,'Retrieve only relevant, authorized\nD2 / D3 / D4 / D8 evidence.');
  action('decline',200,335,310,140,'Decline unsupported action','Direct to the allowed workflow.\nNever submit or approve\na reservation.');
  link('scope','b','evidence','t',[],[695,266,'[yes]']);link('scope','l','decline','t',[[200,225]],[357,209,'[no]']);
  child('answer',2,650,480,480,100,'Answer from evidence or state unavailable;\nnever invent laboratory information.');link('evidence','b','answer','t');
  decision('exchange',650,567);link('answer','b','exchange','t');link('decline','b','exchange','l',[[200,567]]);
  child('history',3,650,640,480,90,'Store requester-scoped conversation in D9;\ndisplay the answer / refusal.');link('exchange','b','history','t');terminal('end',650,710,true);link('history','b','end','t');
 }else if(model.id==='p4'){
  terminal('start',600,20);action('scope',600,88,520,68,'Choose operation in the assigned laboratory','Head Laboratory may work across both laboratories.');link('start','b','scope','t');decision('goal',600,175);link('scope','b','goal','t');
  child('inventory',0,150,300,270,150,'Search / add / update / remove D4 items.\nValidate type, quantities and outstanding issues.');
  child('approved',1,450,300,270,150,'Read approved reservation in D2;\ncheck live D4 availability.');
  child('return',3,750,300,270,150,'Validate returns against D5 issued quantities;\nrestore working items to D4.');
  child('disposal',4,1050,300,270,150,'Physically present, nonrepairable item only;\nvalidate quantity and classification.');
  ['inventory','approved','return','disposal'].forEach((k,i)=>{const x=150+i*300;link('goal',i<2?'l':'r',k,'t',[[x,175]],[x+(i===3?-70:70),208,['[Catalogue]','[Issue]','[Return]','[Dispose]'][i]]);});
  action('stock',150,485,270,115,'Save valid catalogue change','Recompute availability; flag low stock.');
  child('issue',2,450,485,270,150,'Save D5 borrowing slip.\nUpdate D4 stock and D2 status.\nDisplay slip; set Ongoing.');
  action('outcome',750,485,270,115,'Record return outcome','Consumables: consumed. Equipment: broken / lost.\nComplete only if no outstanding balance.');
  action('withdraw',1050,485,270,115,'Save disposal entry','Record D10 and applicable D4 adjustment;\nnever deduct the same quantity twice.');
  [['inventory','stock'],['approved','issue'],['return','outcome'],['disposal','withdraw']].forEach(([a,b])=>link(a,'b',b,'t'));
  decision('done',600,590);['stock','issue','outcome','withdraw'].forEach(k=>{const x=point(k,'b')[0];link(k,'b','done',x<600?'l':'r',[[x,590]]);});
  action('result',600,655,690,65,'Return result or correction','Refuse invalid input; save only authorized, validated transactions.');link('done','b','result','t');terminal('end',600,710,true);link('result','b','end','t');
 }else{
  terminal('start',600,20);action('scope',600,90,630,80,'Choose authorized administration operation','Head Laboratory manages records. Class Representative: own-group clearance view only.');link('start','b','scope','t');decision('goal',600,175);link('scope','b','goal','t');
  child('schedule',0,150,310,270,170,'Check term / room conflicts and held blocks;\nupdate D3 and publish vacant blocks.');
  child('logs',1,450,310,270,170,'Record completed usage in D3 or\na separate daily task in D7.\nHead Laboratory only.');
  child('clearance',2,750,310,270,170,'Head: read D5 evidence; raise / settle D6.\nRepresentative: read own-group status only.');
  child('metrics',3,1050,310,270,170,'Read term reservation, usage, inventory,\nborrowing and daily-task records;\ncompile non-AI metrics.');
  ['schedule','logs','clearance','metrics'].forEach((k,i)=>{const x=150+i*300;link('goal',i<2?'l':'r',k,'t',[[x,175]],[x+(i===3?-100:i===2?65:100),209,['[Schedule]','[Usage / daily task]','[Clearance]','[End-term report]'][i]]);});
  child('report',4,1050,485,270,155,'Include disposal and\noutstanding clearances.\nExport or report failure.');link('metrics','b','report','t');
  decision('done',600,590);['schedule','logs','clearance','report'].forEach(k=>{const x=point(k,'b')[0];link(k,'b','done',x<600?'l':'r',[[x,590]]);});
  action('result',600,655,690,65,'Display permitted records, report or correction','Reject invalid input; never expose another group’s clearance.');link('done','b','result','t');terminal('end',600,710,true);link('result','b','end','t');
 }
 window.SystemActivityGeometry=window.SystemActivityGeometry||{};window.SystemActivityGeometry[model.id]={nodes,routes};return svg;
}
window.SystemProcessActivity=draw;
})();
