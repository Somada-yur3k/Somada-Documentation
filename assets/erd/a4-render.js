(function(){
'use strict';
const model=window.LabErdModel,NS='http://www.w3.org/2000/svg',W=212,HEADER=28,ROW=28,PAGE_W=1700,PAGE_H=2262;
const byName=new Map(model.tables.map(t=>[t.name,t])),home=new Map(model.sheets.flatMap((s,i)=>s.main.map(t=>[t,i+1])));
const relations=model.tables.flatMap(t=>t.fields.filter(f=>f.ref).map(f=>({table:t.name,field:f.name,parent:f.ref.table,key:f.ref.field,optional:!!f.nullable,one:!!f.unique}))).map((r,i)=>({...r,id:'R'+String(i+1).padStart(2,'0')}));
const html=(tag,parent,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;parent?.append(n);return n;};
const el=(tag,a,p)=>{const n=document.createElementNS(NS,tag);Object.entries(a||{}).forEach(([k,v])=>n.setAttribute(k,v));p?.append(n);return n;};
const txt=(p,x,y,value,size=16,anchor='start',bold=false)=>{const n=el('text',{x,y,'font-size':size,'text-anchor':anchor,'font-weight':bold?'700':'400'},p);n.textContent=value;return n;};
const intersects=(a,b,r,pad=0)=>a[0]===b[0]?a[0]>r.x-pad&&a[0]<r.x+r.w+pad&&Math.max(a[1],b[1])>r.y-pad&&Math.min(a[1],b[1])<r.y+r.h+pad:a[1]>r.y-pad&&a[1]<r.y+r.h+pad&&Math.max(a[0],b[0])>r.x-pad&&Math.min(a[0],b[0])<r.x+r.w+pad;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function layout(sheet){
 // Five functional columns with deliberately staggered rows. This uses the
 // portrait page as a routing canvas instead of forcing entities into a rigid
 // table grid, leaving visible horizontal and vertical connector corridors.
 const columns=[
  [['TERM',100],['LABORATORY',400],['SCHEDULE_BLOCK',760],['DAILY_TASK',1250],['KNOWLEDGE_ARTICLE',1900]],
  [['CLASS_GROUP',120],['GROUP_MEMBER',500],['USER_ACCOUNT',800],['STUDENT',1240],['CHAT_EXCHANGE',1690]],
  [['RESERVATION',100],['REQUEST_REVISION',500],['APPROVAL',1000],['REQUEST_ITEM',1360],['REQUEST_MEMBER',1740]],
  [['BORROWING',240],['BORROWING_ITEM',590],['BORROWING_MEMBER',900],['RETURN_ENTRY',1190],['USAGE_LOG',1650]],
  [['ITEM_CATEGORY',100],['ITEM',340],['STOCK_MOVEMENT',760],['DISPOSAL',1220],['CLEARANCE',1700]]
 ],xs=[25,386,747,1108,1469],nodes=[];
 columns.forEach((entries,col)=>entries.forEach(([name,y])=>{const fields=byName.get(name).fields,h=HEADER+fields.length*ROW,placedY=Math.round(40+(y-100)*1.12);nodes.push({name,x:xs[col],y:placedY,w:W,h,fields,reference:false,column:col});}));
 return nodes;
}
function route(start,end,nodes,obstacles,used,relationId,avoidX=[]){
 const xs=[20,PAGE_W-20,...nodes.flatMap(n=>Array.from({length:16},(_,i)=>[n.x-48-i*6.5,n.x+n.w+48+i*6.5]).flat())],ys=[];
 // A continuous vertical lattice prevents long relationships from exhausting
 // the few rows immediately above and below tables. Fourteen SVG units keeps
 // neighboring routes visibly separate after the page is scaled to A4.
 for(let y=70;y<=PAGE_H-42;y+=14)ys.push(y);
 for(const n of nodes)ys.push(n.y-28,n.y-14,n.y+n.h+14,n.y+n.h+28);
 const spaced=values=>{const out=[];for(const value of [...new Set(values)].sort((a,b)=>a-b)){if(out.every(other=>Math.abs(other-value)>=6.5))out.push(value);}return out;};
 const ux=[...spaced(xs).filter(x=>x>=8&&x<=PAGE_W-8&&Math.abs(x-start[0])>=6.5&&Math.abs(x-end[0])>=6.5&&!avoidX.some(lane=>Math.abs(lane-x)<12)),start[0],end[0]].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b),uy=[...spaced(ys).filter(y=>y>=68&&y<=PAGE_H-44&&Math.abs(y-start[1])>=6&&Math.abs(y-end[1])>=6&&obstacles.every(marker=>Math.abs(y-(marker.y+18))>=6)),start[1],end[1]].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b),blocked=[...nodes,...obstacles];
 const segmentClear=(a,b)=>!blocked.some(r=>intersects(a,b,r,5));
 const sourceXs=ux.filter(x=>segmentClear(start,[x,start[1]])),destinationXs=ux.filter(x=>segmentClear([x,end[1]],end));
 if(!sourceXs.length||!destinationXs.length)throw Error('No clear endpoint corridor for '+relationId+' ('+start+' to '+end+')');
 const index=(x,y)=>y*ux.length+x,pos=i=>[ux[i%ux.length],uy[Math.floor(i/ux.length)]],sourceY=uy.indexOf(start[1]),destinationY=uy.indexOf(end[1]),destinations=new Set(destinationXs.map(x=>index(ux.indexOf(x),destinationY))),dist=new Map(),previous=new Map(),pending=[],closed=new Set();
 sourceXs.forEach(x=>{const at=index(ux.indexOf(x),sourceY),score=Math.abs(x-start[0]);dist.set(at,score);pending.push([at,score+Math.abs(x-end[0])+Math.abs(start[1]-end[1])]);});
 let dst;
 while(pending.length){pending.sort((a,b)=>b[1]-a[1]);const [at]=pending.pop();if(closed.has(at))continue;if(destinations.has(at)){dst=at;break;}closed.add(at);
  const x=at%ux.length,y=Math.floor(at/ux.length),a=pos(at);
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||ny<0||nx>=ux.length||ny>=uy.length)continue;const next=index(nx,ny),b=pos(next);
   if(a[1]===b[1]&&(a[1]===start[1]||a[1]===end[1]))continue;
   if(blocked.some(r=>intersects(a,b,r,5)))continue;
   let cost=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
   const prev=previous.get(at);if(prev!==undefined){const p=pos(prev);if((p[0]===a[0])!==(a[0]===b[0]))cost+=18;}
   for(const [c,d,key] of used){
    const vertical=a[0]===b[0],otherVertical=c[0]===d[0];
    if(vertical===otherVertical){const axis=vertical?1:0,perp=1-axis,shared=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]))-Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis])),gap=Math.abs(a[perp]-c[perp]);
     if(shared>0&&gap<6){cost=Infinity;break;}
    }else{const v=vertical?[a,b]:[c,d],h=vertical?[c,d]:[a,b];if(v[0][0]>Math.min(h[0][0],h[1][0])&&v[0][0]<Math.max(h[0][0],h[1][0])&&h[0][1]>Math.min(v[0][1],v[1][1])&&h[0][1]<Math.max(v[0][1],v[1][1]))cost+=90;}
   }
   const score=dist.get(at)+cost;if(score<(dist.get(next)??Infinity)){dist.set(next,score);previous.set(next,at);pending.push([next,score+Math.abs(b[0]-end[0])+Math.abs(b[1]-end[1])]);}
  }
 }
 if(dst===undefined)throw Error('Cannot route '+relationId+' ('+start+' to '+end+')');
 const path=[];let at=dst;while(at!==undefined){path.unshift(pos(at));at=previous.get(at);}
 path.unshift(start);path.push(end);
 return path.filter((p,i)=>i===0||i===path.length-1||!((path[i-1][0]===p[0]&&p[0]===path[i+1][0])||(path[i-1][1]===p[1]&&p[1]===path[i+1][1])));
}
function diagram(sheet,number){
 const svg=el('svg',{xmlns:NS,viewBox:`0 0 ${PAGE_W} ${PAGE_H}`,role:'img','aria-label':sheet.title+' logical ERD'});
 el('style',{},svg).textContent='text{font-family:Arial,Helvetica,sans-serif;fill:#182230}path,line{fill:none;stroke:#17202a;stroke-width:1.5}rect{fill:#fff;stroke:#65758b;stroke-width:1.4}.cardinality-backplate{fill:#fff;stroke:#d5dde8;stroke-width:.8}.cardinality-stroke{fill:#fff;stroke:#243244;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}';
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
 function endMark(p,d,kind,id,end){const group=el('g',{'data-cardinality':kind,'data-relation-id':id,'data-end':end},marks),line=(a,b)=>el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:'cardinality-stroke'},group),at=(u,v=0)=>[p[0]+d*u,p[1]+v],box=symbolBox(p,d);
  // Each endpoint owns a white clearance zone. The relationship itself is
  // restored inside that zone, while unrelated connectors route around it.
  el('rect',{x:box.x,y:box.y,width:box.w,height:box.h,rx:4,class:'cardinality-backplate'},group);
  line(at(0),at(40));
  if(kind==='many'){
   el('circle',{cx:at(8)[0],cy:p[1],r:4,class:'cardinality-stroke'},group);
   line(at(20),at(35,-5));line(at(20),at(35));line(at(20),at(35,5));
  }else if(kind==='optional'){
   el('circle',{cx:at(8)[0],cy:p[1],r:4,class:'cardinality-stroke'},group);line(at(22,-5),at(22,5));
  }else{
   line(at(8,-5),at(8,5));line(at(22,-5),at(22,5));
  }
  txt(group,p[0]+d*20,p[1]-9,kind==='many'?'0..*':kind==='optional'?'0..1':'1',9,'middle',true).setAttribute('data-cardinality-label','true');
 }
 const sheetRelations=relations.filter(r=>sheet.main.includes(r.table));
 // High-degree parent tables use both sides. A relationship keeps the side
 // nearest its child whenever capacity allows. Same-column relationships stay
 // on one side and receive separate ports, avoiding a loop through the table.
 const parentSides=new Map(),byParent=new Map();
 sheetRelations.forEach(r=>{if(!byParent.has(r.parent))byParent.set(r.parent,[]);byParent.get(r.parent).push(r);});
 for(const [name,rels] of byParent){const p=map.get(name),capacity=Math.floor(p.h/28),canLeft=p.x>=48,canRight=p.x+p.w+48<=PAGE_W;
  if(!canLeft||!canRight){rels.forEach(r=>parentSides.set(r.id,canRight?'right':'left'));continue;}
  const naturalLeft=rels.filter(r=>map.get(r.table).x<p.x).length,minLeft=Math.max(0,rels.length-capacity),maxLeft=Math.min(capacity,rels.length);
  let leftCount=Math.max(minLeft,Math.min(maxLeft,naturalLeft));if(rels.length>6)leftCount=Math.max(minLeft,Math.min(maxLeft,Math.floor(rels.length/2)));
  const ranked=[...rels].sort((a,b)=>(map.get(a.table).x-p.x)-(map.get(b.table).x-p.x)||Number(a.id.slice(1))-Number(b.id.slice(1)));
  ranked.forEach((r,i)=>parentSides.set(r.id,i<leftCount?'left':'right'));
 }
 const sides=r=>{const p=map.get(r.parent),c=map.get(r.table),parentSide=parentSides.get(r.id);
  const childSide=p.x<c.x?'left':p.x>c.x?'right':parentSide;return[parentSide,childSide];};
 const routeSpan=r=>{const p=map.get(r.parent),c=map.get(r.table);return Math.abs(p.x-c.x)+Math.abs(p.y-c.y);};
 sheetRelations.sort((a,b)=>routeSpan(b)-routeSpan(a)||a.id.localeCompare(b.id));
 const markerBoxes=[],parentSlots=new Map();
 function symbolBox(p,d){return{x:p[0]+(d>0?0:-40),y:p[1]-18,w:40,h:24};}
 for(const r of sheetRelations){const [ps,cs]=sides(r),b=anchor(map.get(r.table),r.field,cs);markerBoxes.push({...symbolBox(b,cs==='right'?1:-1),id:r.id,end:'child'});}
 for(const [name,rels] of byParent){const parent=map.get(name);
  for(const side of ['left','right']){const group=rels.filter(r=>sides(r)[0]===side);if(!group.length)continue;const pd=side==='right'?1:-1,edge=parent.x+(side==='right'?parent.w:0);
   const phases=[0,14].map(phase=>{const candidates=[];for(let y=parent.y+14+phase;y<=parent.y+parent.h-14;y+=28){const p=[edge+pd*6,y],box=symbolBox(p,pd);if(!markerBoxes.some(b=>overlap(box,b)))candidates.push(y);}return candidates;}).sort((a,b)=>b.length-a.length),available=phases[0];
   if(available.length<group.length)throw Error('No separated parent cardinality ports for '+name+' on '+side);
   const ordered=[...group].sort((a,b)=>anchor(map.get(a.table),a.field,sides(a)[1])[1]-anchor(map.get(b.table),b.field,sides(b)[1])[1]||a.id.localeCompare(b.id)),chosen=[];
   for(let i=0;i<ordered.length;i++){let at=ordered.length===1?Math.floor((available.length-1)/2):Math.round(i*(available.length-1)/(ordered.length-1));while(chosen.includes(at))at++;chosen.push(at);const p=[edge+pd*6,available[at]];parentSlots.set(ordered[i].id,p);markerBoxes.push({...symbolBox(p,pd),id:ordered[i].id,end:'parent'});}
  }
 }
 for(const r of sheetRelations){
  const parent=map.get(r.parent),child=map.get(r.table),[ps,cs]=sides(r),pd=ps==='right'?1:-1,cd=cs==='right'?1:-1;
  const mark=parentSlots.get(r.id),a=[parent.x+(ps==='right'?parent.w:0),mark[1]],b=anchor(child,r.field,cs),sa=[a[0]+pd*48,a[1]],sb=[b[0]+cd*44,b[1]],protectedMarkers=markerBoxes.filter(m=>m.id!==r.id),middle=route(sa,sb,nodes,protectedMarkers,used,r.id),points=[a,...middle,b];
  const d=points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
  el('path',{d,style:'stroke:#fff;stroke-width:5;stroke-linejoin:round'},edges);
  const edge=el('path',{d,'data-relation':r.id},edges);el('title',{},edge).textContent=r.id+': '+r.table+'.'+r.field+' → '+r.parent+'.'+r.key+' | parent '+(r.optional?'0..1':'1')+'; children '+(r.one?'0..1':'0..*');
  // Every parent relationship owns a distinct perimeter port and marker.
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
document.getElementById('summary-counts').textContent=model.tables.length+' entities · '+relations.length+' foreign-key relationships · 11 DFD stores · one A4 portrait diagram';
document.getElementById('print-erd').onclick=()=>window.print();window.ErdRelations=relations;window.__erdReady=true;
})();
