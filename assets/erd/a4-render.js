(function(){
'use strict';
const model=window.LabErdModel,NS='http://www.w3.org/2000/svg',W=250,HEADER=28,ROW=28,PAGE_W=1600,PAGE_H=2262;
const byName=new Map(model.tables.map(t=>[t.name,t])),home=new Map(model.sheets.flatMap((s,i)=>s.main.map(t=>[t,i+1])));
const relations=model.tables.flatMap(t=>t.fields.filter(f=>f.ref).map(f=>({table:t.name,field:f.name,parent:f.ref.table,key:f.ref.field,optional:!!f.nullable,one:!!f.unique}))).map((r,i)=>({...r,id:'R'+String(i+1).padStart(2,'0')}));
const html=(tag,parent,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;parent?.append(n);return n;};
const el=(tag,a,p)=>{const n=document.createElementNS(NS,tag);Object.entries(a||{}).forEach(([k,v])=>n.setAttribute(k,v));p?.append(n);return n;};
const txt=(p,x,y,value,size=16,anchor='start',bold=false)=>{const n=el('text',{x,y,'font-size':size,'text-anchor':anchor,'font-weight':bold?'700':'400'},p);n.textContent=value;return n;};
const intersects=(a,b,r,pad=0)=>a[0]===b[0]?a[0]>r.x-pad&&a[0]<r.x+r.w+pad&&Math.max(a[1],b[1])>r.y-pad&&Math.min(a[1],b[1])<r.y+r.h+pad:a[1]>r.y-pad&&a[1]<r.y+r.h+pad&&Math.max(a[0],b[0])>r.x-pad&&Math.min(a[0],b[0])<r.x+r.w+pad;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function layout(sheet){
 const columns=[
 ['ITEM_CATEGORY','SCHEDULE_BLOCK','LABORATORY','TERM','CLASS_GROUP','CHAT_EXCHANGE','GROUP_MEMBER'],
 ['ITEM','REQUEST_ITEM','DAILY_TASK','RESERVATION','USAGE_LOG','STUDENT'],
 ['DISPOSAL','BORROWING_ITEM','REQUEST_REVISION','USER_ACCOUNT','BORROWING','REQUEST_MEMBER'],
 ['STOCK_MOVEMENT','RETURN_ENTRY','APPROVAL','CLEARANCE','BORROWING_MEMBER','KNOWLEDGE_ARTICLE']
 ];
 const nodes=[];columns.forEach((names,col)=>{let y=110;for(const name of names){const fields=byName.get(name).fields,h=HEADER+fields.length*ROW;nodes.push({name,x:55+col*405,y,w:W,h,fields,reference:false});y+=h+110;}});return nodes;
}
function route(start,end,nodes,labels,used,parentKey,avoidX=[]){
 const xs=[20,PAGE_W-20,...nodes.flatMap(n=>Array.from({length:6},(_,i)=>[n.x-50-i*14,n.x+n.w+50+i*14]).flat()),start[0],end[0]],ys=[84,PAGE_H-20,start[1],end[1]];
 for(const n of nodes){ys.push(n.y-24,n.y-12,n.y+n.h+12,n.y+n.h+24);}
 for(const n of labels){xs.push(n.x-14,n.x+n.w+14);ys.push(n.y-14,n.y+n.h+14);}
 const ux=[...new Set(xs)].filter(x=>x>=8&&x<=PAGE_W-8&&(x===start[0]||x===end[0]||!avoidX.some(lane=>Math.abs(lane-x)<12))).sort((a,b)=>a-b),uy=[...new Set(ys)].filter(y=>y>=68&&y<=PAGE_H-44).sort((a,b)=>a-b),obstacles=[...nodes,...labels];
 const index=(x,y)=>y*ux.length+x,src=index(ux.indexOf(start[0]),uy.indexOf(start[1])),dst=index(ux.indexOf(end[0]),uy.indexOf(end[1]));
 const pos=i=>[ux[i%ux.length],uy[Math.floor(i/ux.length)]],dist=new Map([[src,0]]),previous=new Map(),pending=[[src,0]],closed=new Set();
 while(pending.length){pending.sort((a,b)=>b[1]-a[1]);const [at]=pending.pop();if(closed.has(at))continue;if(at===dst)break;closed.add(at);
  const x=at%ux.length,y=Math.floor(at/ux.length),a=pos(at);
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||ny<0||nx>=ux.length||ny>=uy.length)continue;const next=index(nx,ny),b=pos(next);if(obstacles.some(r=>intersects(a,b,r,5)))continue;
   let cost=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
   const prev=previous.get(at);if(prev!==undefined){const p=pos(prev);if((p[0]===a[0])!==(a[0]===b[0]))cost+=18;}
   for(const [c,d,key] of used){
    const vertical=a[0]===b[0],otherVertical=c[0]===d[0];
    if(vertical===otherVertical){const axis=vertical?1:0,perp=1-axis,shared=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]))-Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis])),gap=Math.abs(a[perp]-c[perp]);
     if(shared>0&&gap<14)cost+=shared*(gap<.1?900:400)+(key===parentKey?0:120);
    }else{const v=vertical?[a,b]:[c,d],h=vertical?[c,d]:[a,b];if(v[0][0]>Math.min(h[0][0],h[1][0])&&v[0][0]<Math.max(h[0][0],h[1][0])&&h[0][1]>Math.min(v[0][1],v[1][1])&&h[0][1]<Math.max(v[0][1],v[1][1]))cost+=90;}
   }
   const score=dist.get(at)+cost;if(score<(dist.get(next)??Infinity)){dist.set(next,score);previous.set(next,at);pending.push([next,score+Math.abs(b[0]-end[0])+Math.abs(b[1]-end[1])]);}
  }
 }
 if(!dist.has(dst))throw Error('Cannot route ERD connector '+start+' to '+end);
 const path=[];let at=dst;while(at!==undefined){path.unshift(pos(at));at=previous.get(at);}
 return path.filter((p,i)=>i===0||i===path.length-1||!((path[i-1][0]===p[0]&&p[0]===path[i+1][0])||(path[i-1][1]===p[1]&&p[1]===path[i+1][1])));
}
function diagram(sheet,number){
 const svg=el('svg',{xmlns:NS,viewBox:`0 0 ${PAGE_W} ${PAGE_H}`,role:'img','aria-label':sheet.title+' logical ERD'});
 el('style',{},svg).textContent='text{font-family:Arial,Helvetica,sans-serif;fill:#182230}path,line{fill:none;stroke:#17202a;stroke-width:1.5}rect{fill:#fff;stroke:#65758b;stroke-width:1.4}';
 const edges=el('g',{},svg),cards=el('g',{},svg),marks=el('g',{},svg),nodes=layout(sheet),map=new Map(nodes.map(n=>[n.name,n])),labelBoxes=[],used=[],paths=[];
 for(const n of nodes){
  const g=el('g',{'data-table':n.name,'data-reference':n.reference},cards);el('rect',{x:n.x,y:n.y,width:n.w,height:n.h},g);
  el('rect',{x:n.x,y:n.y,width:n.w,height:HEADER,style:'fill:#edf2f7;stroke:#65758b;stroke-width:1'},g);
  txt(g,n.x+n.w/2,n.y+20,n.name,16,'middle',true);
  el('line',{x1:n.x,y1:n.y+HEADER,x2:n.x+n.w,y2:n.y+HEADER},g);
  n.fields.forEach((f,i)=>{const y=n.y+HEADER+i*ROW;el('line',{x1:n.x,y1:y+ROW,x2:n.x+n.w,y2:y+ROW,style:'stroke-width:.45'},g);
   if(f.key){txt(g,n.x+6,y+(f.unique?12:20),f.key,f.unique?10:13,'start',true);if(f.unique)txt(g,n.x+6,y+25,'UK',10,'start',true);}const row=txt(g,n.x+32,y+20,f.name+(f.nullable?' ?':''),16);row.setAttribute('data-field',f.name);
   if(f.ref&&!n.reference){const relation=relations.find(r=>r.table===n.name&&r.field===f.name);txt(g,n.x+n.w-6,y+20,relation.id,12,'end').setAttribute('data-fk-relation',relation.id);}
  });
 }
 function anchor(n,field,side){return[n.x+(side==='right'?n.w:0),n.y+HEADER+n.fields.findIndex(f=>f.name===field)*ROW+ROW/2];}
 function endMark(p,d,kind,id,end){const group=el('g',{'data-cardinality':kind,'data-relation-id':id,'data-end':end},marks),line=(a,b)=>el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],style:'stroke-width:1.5'},group),at=(u,v=0)=>[p[0]+d*u,p[1]+v];
  // Restore only this connector over the white symbol backplate. Unrelated
  // crossing lines cannot obscure the label or turn an optional circle into a join.
  line(at(0),at(39));
  if(kind==='many'){line(at(1,-4),at(17));line(at(1,4),at(17));line(at(1),at(17));el('circle',{cx:at(30)[0],cy:p[1],r:3,fill:'#fff',stroke:'#000','stroke-width':1.5},group);}
  else{line(at(7,-4),at(7,4));if(kind==='optional')el('circle',{cx:at(28)[0],cy:p[1],r:3,fill:'#fff',stroke:'#000','stroke-width':1.5},group);else line(at(23,-4),at(23,4));}
  txt(group,p[0]+d*23,p[1]-7,kind==='many'?'0..*':kind==='optional'?'0..1':'1',9,'middle',true).setAttribute('data-cardinality-label','true');
 }
 const sheetRelations=relations.filter(r=>sheet.main.includes(r.table));
 const sides=r=>{const p=map.get(r.parent),c=map.get(r.table);
  if(r.table==='CHAT_EXCHANGE')return ['right','right'];
  return p.x<c.x?['right','left']:p.x>c.x?['left','right']:p.x>PAGE_W/2?['left','left']:['right','right'];};
 const markerBoxes=[],parentSlots=new Map();
 const symbolBox=(p,d)=>({x:p[0]+(d>0?0:-39),y:p[1]-16,w:39,h:21});
 for(const r of sheetRelations){const [ps,cs]=sides(r),b=anchor(map.get(r.table),r.field,cs);markerBoxes.push({...symbolBox(b,cs==='right'?1:-1),id:r.id,end:'child'});}
 for(const r of sheetRelations){const [ps]=sides(r),pd=ps==='right'?1:-1,a=anchor(map.get(r.parent),r.key,ps);
  const siblings=sheetRelations.filter(o=>o.parent===r.parent&&sides(o)[0]===ps);
  let y=a[1]+(siblings.indexOf(r)-(siblings.length-1)/2)*30,found=false;
  for(let attempt=0;attempt<180;attempt++){const delta=attempt===0?0:Math.ceil(attempt/2)*15*(attempt%2?1:-1),p=[a[0]+pd*50,y+delta],box=symbolBox(p,pd);
   if(box.y<72||box.y+box.h>PAGE_H-30||markerBoxes.some(b=>overlap({x:box.x-3,y:box.y-3,w:box.w+6,h:box.h+6},b))||nodes.some(n=>overlap(box,n)))continue;
   parentSlots.set(r.id,p);markerBoxes.push({...box,id:r.id,end:'parent'});found=true;break;}
  if(!found)throw Error('No separated cardinality slot for '+r.id);
 }
 for(const r of sheetRelations){
  const parent=map.get(r.parent),child=map.get(r.table),[ps,cs]=sides(r),pd=ps==='right'?1:-1,cd=cs==='right'?1:-1;
  const a=anchor(parent,r.key,ps),b=anchor(child,r.field,cs),mark=parentSlots.get(r.id),sa=[a[0]+pd*92,mark[1]],sb=[b[0]+cd*49,b[1]],middle=route(sa,sb,nodes,labelBoxes,used,r.parent),points=[a,[a[0]+pd*44,a[1]],[a[0]+pd*44,mark[1]],...middle,b];
  const d=points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
  el('path',{d,style:'stroke:#fff;stroke-width:5;stroke-linejoin:round'},edges);
  const edge=el('path',{d,'data-relation':r.id},edges);el('title',{},edge).textContent=r.id+': '+r.table+'.'+r.field+' → '+r.parent+'.'+r.key+' | parent '+(r.optional?'0..1':'1')+'; children '+(r.one?'0..1':'0..*');
  // Fan out at a shared PK before drawing each relationship's own marker.
  // Optional and mandatory parent symbols must never be superimposed.
  endMark(mark,pd,r.optional?'optional':'one',r.id,'parent');endMark(b,cd,r.one?'optional':'many',r.id,'child');
  // Every relationship is identified on its FK row; floating labels must not
  // obstruct the narrow routing corridors or another relationship endpoint.
  const placed=false;
  middle.slice(1).forEach((p,i)=>used.push([middle[i],p,r.parent]));paths.push({...r,points,labelPlaced:placed,parentSide:ps,childSide:cs,parentMarker:mark});
 }
 // Only the schema belongs in the reusable artwork. Keep explanations and
 // the relationship register on the surrounding website, not in the image.
 // Crop unused gutters without moving any verified PK/FK route or marker.
 svg.setAttribute('viewBox',`0 0 ${PAGE_W} ${PAGE_H}`);
 window.ErdGeometry[sheet.id]={header:HEADER,row:ROW,nodes: nodes.map(n=>({...n,fields:n.fields.map(f=>f.name)})),paths,labelBoxes,markerBoxes};installInteraction(svg,markerBoxes);return svg;
}
window.ErdGeometry={};
function installInteraction(svg,markerBoxes){
 const overlay=el('g',{'pointer-events':'none','data-highlight-layer':'true'},svg);
 svg.insertBefore(overlay,svg.querySelector('[data-cardinality]').parentNode);
 const status=document.getElementById('relationship-status');
 function clear(){svg.querySelectorAll('.relationship-active').forEach(n=>n.classList.remove('relationship-active'));overlay.replaceChildren();svg.removeAttribute('data-active-relation');if(status)status.textContent='Hover or focus a cardinality to trace its relationship.';}
 function select(id){clear();const r=relations.find(r=>r.id===id);svg.setAttribute('data-active-relation',id);
  svg.querySelectorAll('[data-relation-id="'+id+'"]').forEach(n=>n.classList.add('relationship-active'));
  for(const name of [r.parent,r.table])svg.querySelector('[data-table="'+name+'"]').classList.add('relationship-active');
  const path=svg.querySelector('[data-relation="'+id+'"]').cloneNode();path.removeAttribute('data-relation');path.setAttribute('style','stroke:#0065d1;stroke-width:3;fill:none');overlay.append(path);
  if(status)status.textContent=id+': '+r.parent+'.'+r.key+' ('+(r.optional?'0..1':'1')+') — '+r.table+'.'+r.field+' ('+(r.one?'0..1':'0..*')+').';
 }
 svg.querySelectorAll('[data-cardinality]').forEach(mark=>{
  const id=mark.getAttribute('data-relation-id'),r=relations.find(r=>r.id===id),description=id+': '+r.parent+'.'+r.key+' ('+(r.optional?'0..1':'1')+') to '+r.table+'.'+r.field+' ('+(r.one?'0..1':'0..*')+').';
  mark.setAttribute('tabindex','0');mark.setAttribute('role','button');mark.setAttribute('aria-label',description);el('title',{},mark).textContent=description;
  const box=markerBoxes.find(b=>b.id===id&&b.end===mark.getAttribute('data-end'));
  const hit=el('rect',{x:box.x,y:box.y,width:box.w,height:box.h,style:'fill:#fff;stroke:none;pointer-events:all'},mark);mark.prepend(hit);
  mark.addEventListener('pointerenter',()=>select(id));mark.addEventListener('pointerleave',clear);mark.addEventListener('focus',()=>select(id));mark.addEventListener('blur',clear);
  mark.addEventListener('keydown',e=>{if(e.key==='Escape'){mark.blur();clear();}});
 });
 svg.querySelector('style').textContent+=' [data-cardinality]{cursor:pointer;outline:none}.relationship-active[data-cardinality] line,.relationship-active[data-cardinality] circle{stroke:#0065d1!important;stroke-width:2!important}.relationship-active[data-cardinality] text{fill:#0059b8;font-weight:700}.relationship-active[data-cardinality] rect{fill:#dcecff!important}.relationship-active[data-table]>rect{stroke:#0065d1;stroke-width:2.5}';
 window.addEventListener('beforeprint',clear);
}
const container=document.getElementById('erd-sheets');
model.sheets.forEach((sheet,i)=>{
 const nav=html('a',document.getElementById('erd-sections'),String(i+1)+'. '+sheet.title);nav.href='#erd-'+sheet.id;
 const wrap=html('section',container);wrap.className='erd-wrap';const paper=html('article',wrap);paper.className='erd-sheet';paper.id='erd-'+sheet.id;paper.append(diagram(sheet,i+1));
 const download=html('p',wrap);download.className='screen-only downloads';for(const ext of ['png','svg']){const a=html('a',download,'Download '+ext.toUpperCase());a.href='assets/erd/erd-a4-'+sheet.id+'.'+ext;a.download='erd-a4-'+sheet.id+'.'+ext;}
});
const dict=document.getElementById('dictionary');
for(const table of model.tables){const section=html('section',dict);section.id='table-'+table.name;html('h3',section,table.name+' · '+table.store+' · ERD '+home.get(table.name));if(table.note)html('p',section,table.note);const list=html('table',section),head=html('tr',html('thead',list));['Key','Field','Logical type','Nullable','References'].forEach(s=>html('th',head,s));const body=html('tbody',list);
 table.fields.forEach(f=>{const row=html('tr',body);[f.key+(f.unique?' / UK':''),f.name,f.values?f.type+' ('+f.values.join(' / ')+')':f.type,f.name==='reservation_type'?'Required for Class Representative; not applicable to Faculty':f.nullable?'Yes':'No',f.ref?f.ref.table+'.'+f.ref.field:'—'].forEach(s=>html('td',row,s));});
 if(table.unique.length)html('p',section,'Unique combinations: '+table.unique.map(u=>'('+u.join(', ')+')').join('; '));
}
const relBody=document.getElementById('relationships');relations.forEach(r=>{const row=html('tr',relBody);[r.id,r.parent+'.'+r.key,r.optional?'0..1':'1',r.table+'.'+r.field,r.one?'0..1':'0..*'].forEach(v=>html('td',row,v));});
document.getElementById('summary-counts').textContent=model.tables.length+' entities · '+relations.length+' foreign-key relationships · 10 DFD stores · one A4 portrait diagram';
document.getElementById('print-erd').onclick=()=>window.print();window.ErdRelations=relations;window.__erdReady=true;
})();
