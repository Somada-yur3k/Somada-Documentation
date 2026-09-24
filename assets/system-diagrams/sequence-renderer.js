/* Monochrome A4 sequence renderer. Calls/replies have matched execution scopes;
 * alternatives clone the current call stack rather than serializing all outcomes. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg',W=1200,H=1697;
const el=(tag,attrs={},parent)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);parent?.append(n);return n;};
window.SystemSequenceDiagram=function(model){
 const id='sequence-'+model.id,s=el('svg',{xmlns:NS,viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':model.title+' — Sequence Diagram','data-sequence':model.id});
 const defs=el('defs',{},s);
 el('style',{},defs).textContent='.sequence-ink text{font-family:Arial,Helvetica,sans-serif;fill:#000}.sequence-message{fill:none;stroke:#000;stroke-width:2.3}.sequence-reply{stroke-dasharray:9 6}';
 s.classList.add('sequence-ink');
 for(const kind of ['filled','open']){
  const marker=el('marker',{id:id+'-'+kind,viewBox:'0 0 12 12',refX:10,refY:6,markerWidth:8,markerHeight:8,orient:'auto'},defs);
  el('path',{d:'M2 2 L10 6 L2 10'+(kind==='filled'?' Z':''),fill:kind==='filled'?'#000':'none',stroke:'#000','stroke-width':1.4},marker);
 }
 const frames=el('g',{},s),lifelines=el('g',{},s),bars=el('g',{},s),arrows=el('g',{},s),labels=el('g',{},s);
 const positions={3:[120,590,1070],4:[120,445,775,1080],5:[70,260,450,720,1080]};
 const xs=positions[model.participants.length];
 if(!xs)throw Error(model.id+': sequence supports three to five participants');
 const participants=Object.fromEntries(model.participants.map((p,i)=>[p.id,{...p,x:xs[i]}]));
 const measure=document.createElement('canvas').getContext('2d');
 function wrap(value,size,width){
  measure.font=size+'px Arial';const rows=[];
  for(const line of value.split('\n')){let row='';for(const word of line.split(' ')){const next=row?row+' '+word:word;if(row&&measure.measureText(next).width>width){rows.push(row);row=word;}else row=next;}rows.push(row);}
  return rows;
 }
 function text(parent,x,y,rows,size=24,anchor='middle',bold=false,halo=false){
  const t=el('text',{'text-anchor':anchor,'font-size':size,'font-weight':bold?700:400,...(halo?{stroke:'#fff','stroke-width':6,'paint-order':'stroke','stroke-linejoin':'round'}:{})},parent);
  rows.forEach((r,i)=>el('tspan',{x,y:y+i*size*1.16},t).textContent=r);return t;
 }
 // Titles and sequence codes belong to the document captions/navigation, not the artwork.
 text(labels,600,82,wrap(model.precondition,19,1120),19);
 const headerBottom=280,top=318,bottom=1650;
 model.participants.forEach(p=>{
  const x=participants[p.id].x,g=el('g',{'data-sequence-participant':p.id,'data-participant-kind':p.kind},lifelines);
  if(p.kind==='actor'){
   const ink={fill:'none',stroke:'#000','stroke-width':2.5};
   el('circle',{cx:x,cy:122,r:13,...ink},g);el('path',{d:`M${x} 135 V164 M${x-25} 145 H${x+25} M${x} 164 L${x-24} 189 M${x} 164 L${x+24} 189`,...ink},g);
   text(g,x,216,wrap(p.label,22,210),22,'middle',true);
  }else{
   el('rect',{x:x-117,y:125,width:234,height:115,fill:'#fff',stroke:'#000','stroke-width':2.2},g);
   const rows=wrap(p.label,23,220);text(g,x,176-(rows.length-1)*13,rows,23,'middle',true);
  }
  el('line',{x1:x,y1:p.kind==='actor'?headerBottom:240,x2:x,y2:bottom+15,stroke:'#000','stroke-width':1.7,'stroke-dasharray':'8 7','data-lifeline':p.id},g);
 });
 let compact=false;
 function plan(steps,size){return steps.map(step=>{
  if(['alt','opt','par'].includes(step.kind)){
   const operands=step.operands.map(o=>{const guard=wrap(step.kind==='par'?o.guard:'['+o.guard+']',size-1,1010),children=plan(o.steps,size);return{...o,guard,children,header:guard.length*(size-1)*1.16+(compact?16:22),height:children.reduce((h,c)=>h+c.height,0)};});
   return{...step,operands,height:operands.reduce((h,o)=>h+o.header+o.height,0)+20};
  }
  const from=participants[step.from],to=participants[step.to];
  const width=step.kind==='self'?participants.db.x-from.x-145:Math.abs(to.x-from.x)-48;
  const rows=wrap(step.label,size,width);
  return{...step,rows,height:Math.max(step.kind==='self'?(compact?60:70):0,rows.length*size*1.16+(compact?22:30))};
 });}
 let size=28,planned,total;
 for(const candidate of [28,26,24,22,20,18]){size=candidate;planned=plan(model.steps,size);total=planned.reduce((h,n)=>h+n.height,0);if(total<=bottom-top)break;}
 if(total>bottom-top){compact=true;planned=plan(model.steps,size);total=planned.reduce((h,n)=>h+n.height,0);}
 if(total>bottom-top)throw Error(model.id+': interaction too dense for readable A4; split the workflow');
 const scale=(bottom-top)/total,messages=[],activations=[],fragments=[];
 function activation(participant,start,end,nested=false){
  if(end<=start)return;const x=participants[participant].x+(nested?10:0);
  el('rect',{x:x-7,y:start,width:14,height:end-start,fill:'#fff',stroke:'#000','stroke-width':1.8,'data-activation':participant},bars);
  activations.push({participant,start,end,nested});
 }
 const active=(stack,p)=>stack.some(a=>a.to===p);
 function draw(nodes,start,stack,depth=0){
  let y=start;
  for(const n of nodes){
   const height=n.height*scale;
   if(['alt','opt','par'].includes(n.kind)){
    const frame={kind:n.kind,x:15+depth*16,y,w:1170-depth*32,h:height,operands:[]};fragments.push(frame);
    el('rect',{x:frame.x,y,width:frame.w,height:frame.h,fill:'none',stroke:'#000','stroke-width':1.8,'data-fragment':n.kind},frames);
    el('path',{d:`M${frame.x} ${y+31} H${frame.x+49} L${frame.x+65} ${y+18} V${y}`,fill:'none',stroke:'#000','stroke-width':1.5},frames);
    text(labels,frame.x+10,y+23,[n.kind],20,'start',true);
    // Common execution reaches the choice; each operand has its own interval.
    stack.forEach(a=>activation(a.to,a.start,y));
    let cursor=y+10*scale;const endings=[];
    n.operands.forEach((o,index)=>{
     if(index)el('line',{x1:frame.x,y1:cursor,x2:frame.x+frame.w,y2:cursor,stroke:'#000','stroke-width':1.5,'stroke-dasharray':'8 6'},frames);
     text(labels,frame.x+80,cursor+size,o.guard,size-1,'start',false,true);
     const begin=cursor+o.header*scale,copy=stack.map(a=>({...a,start:begin}));
     const result=draw(o.children,begin,copy,depth+1);result.stack.forEach(a=>activation(a.to,a.start,result.y));
     endings.push(result.stack);frame.operands.push({guard:o.guard.join(' '),top:cursor,bottom:result.y});cursor=result.y;
    });
    if(n.kind==='opt')endings.push(stack);
    const signature=a=>JSON.stringify(a.map(({from,to})=>[from,to]));
    if(endings.some(a=>signature(a)!==signature(endings[0])))throw Error(model.id+': unbalanced calls between '+n.kind+' operands');
    stack=endings[0].map(a=>({...a,start:y+height}));y+=height;continue;
   }
   const from=participants[n.from],to=participants[n.to];
   const arrowY=y+height-13;
   let points;
   if(n.kind==='self'){
    if(!active(stack,n.from))throw Error(model.id+': internal work outside an activation');
    const loopY=y+height/2-16;
    points=[[from.x+7,loopY],[from.x+88,loopY],[from.x+88,loopY+30],[from.x+17,loopY+30]];
    activation(n.from,loopY+30,loopY+43,true);
    text(labels,from.x+108,y+height/2-(n.rows.length-1)*size*.58,n.rows,size,'start',false,true);
   }else{
    const direction=to.x>from.x?1:-1;
    const startX=from.x+(active(stack,n.from)?direction*7:0);
    const endX=to.x-((n.kind==='call'||active(stack,n.to))?direction*7:0);
    points=[[startX,arrowY],[endX,arrowY]];
    text(labels,(from.x+to.x)/2,arrowY-13-(n.rows.length-1)*size*1.16,n.rows,size,'middle',false,true);
    if(n.kind==='call'){
     if(from.kind!=='actor'&&!active(stack,n.from))throw Error(model.id+': call outside active execution');
     stack.push({from:n.from,to:n.to,start:arrowY});
    }else if(n.kind==='reply'){
     const request=stack.pop();if(!request||request.from!==n.to||request.to!==n.from)throw Error(model.id+': reply does not match its caller');
     activation(n.from,request.start,arrowY);
    }else if(n.kind==='signal'&&!active(stack,n.from))throw Error(model.id+': notification outside active work');
   }
   el('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),class:'sequence-message'+(n.kind==='reply'?' sequence-reply':''),'marker-end':`url(#${id}-${['reply','signal'].includes(n.kind)?'open':'filled'})`,'data-message-kind':n.kind,'data-message-from':n.from,'data-message-to':n.to},arrows);
   messages.push({kind:n.kind,from:n.from,to:n.to,label:n.label,points});y+=height;
  }
  return{y,stack};
 }
 const result=draw(planned,top,[]);if(result.stack.length)throw Error(model.id+': call has no result');
 window.SystemSequenceGeometry=window.SystemSequenceGeometry||{};
 window.SystemSequenceGeometry[model.id]={participants,messages,activations,fragments,width:W,height:H,fontSize:size,bodyBottom:result.y};
 return s;
};
})();
