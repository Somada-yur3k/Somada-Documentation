(function(){
'use strict';
const model=window.LabErdModel,NS='http://www.w3.org/2000/svg',W=300,HEADER=28,ROW=30,PAGE_W=2850,PAGE_H=2080;
const groups=[
 [
  "Item Management",
  40,
  100,
  940,
  410,
  "#ddf6ff",
  "#26b4e0"
 ],
 [
  "Inventory & Movement",
  1010,
  100,
  1250,
  410,
  "#e4faeb",
  "#42c876"
 ],
 [
  "Returns & Approvals",
  2330,
  100,
  470,
  780,
  "#ffe7f0",
  "#ed75ac"
 ],
 [
  "Laboratory & Scheduling",
  40,
  540,
  440,
  830,
  "#eee5ff",
  "#b290ed"
 ],
 [
  "Requests & Borrowing",
  520,
  540,
  1740,
  340,
  "#fff5d9",
  "#eac65b"
 ],
 [
  "Tasks & Revisions",
  520,
  910,
  1740,
  460,
  "#dcf6ff",
  "#4fc4e3"
 ],
 [
  "Clearance",
  2330,
  910,
  470,
  460,
  "#ddf9fa",
  "#52cbd2"
 ],
 [
  "Academic",
  40,
  1400,
  440,
  620,
  "#e7f8e7",
  "#66c47e"
 ],
 [
  "Reservations & Usage",
  520,
  1400,
  460,
  620,
  "#ffe7ef",
  "#ed81aa"
 ],
 [
  "User Management",
  1010,
  1400,
  1250,
  310,
  "#eee7ff",
  "#b69ae9"
 ],
 [
  "Student & Membership",
  1010,
  1740,
  1250,
  280,
  "#e0f7ff",
  "#5ec9ea"
 ],
 [
  "Communication",
  2330,
  1400,
  470,
  310,
  "#ffe5ec",
  "#ed82a6"
 ],
 [
  "Reference",
  2330,
  1740,
  470,
  280,
  "#fff6d9",
  "#e5cb69"
 ]
];
const byName=new Map(model.tables.map(t=>[t.name,t])),home=new Map(model.sheets.flatMap((s,i)=>s.main.map(t=>[t,i+1])));
const relations=model.tables.flatMap(t=>t.fields.filter(f=>f.ref).map(f=>({table:t.name,field:f.name,parent:f.ref.table,key:f.ref.field,optional:!!f.nullable,one:!!f.unique}))).map((r,i)=>({...r,id:'R'+String(i+1).padStart(2,'0')}));
const html=(tag,parent,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;parent?.append(n);return n;};
const el=(tag,a,p)=>{const n=document.createElementNS(NS,tag);Object.entries(a||{}).forEach(([k,v])=>n.setAttribute(k,v));p?.append(n);return n;};
const txt=(p,x,y,value,size=17,anchor='start',bold=false)=>{const n=el('text',{x,y,'font-size':size,'text-anchor':anchor,'font-weight':bold?'700':'400'},p);n.textContent=value;return n;};
const intersects=(a,b,r,pad=0)=>a[0]===b[0]?a[0]>r.x-pad&&a[0]<r.x+r.w+pad&&Math.max(a[1],b[1])>r.y-pad&&Math.min(a[1],b[1])<r.y+r.h+pad:a[1]>r.y-pad&&a[1]<r.y+r.h+pad&&Math.max(a[0],b[0])>r.x-pad&&Math.min(a[0],b[0])<r.x+r.w+pad;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function layout(sheet){
 const positions={"ITEM_CATEGORY":[100,180],"ITEM":[650,180],"DISPOSAL":[1250,180],"STOCK_MOVEMENT":[1850,180],"RETURN_ENTRY":[2430,180],"APPROVAL":[2430,620],"LABORATORY":[100,620],"SCHEDULE_BLOCK":[100,860],"TERM":[100,1170],"REQUEST_ITEM":[650,620],"BORROWING_ITEM":[1080,620],"BORROWING":[1510,620],"BORROWING_MEMBER":[1940,620],"DAILY_TASK":[1100,1010],"REQUEST_REVISION":[1800,990],"CLEARANCE":[2430,990],"CLASS_GROUP":[100,1480],"GROUP_MEMBER":[100,1820],"RESERVATION":[600,1450],"USAGE_LOG":[600,1740],"USER_ACCOUNT":[1350,1440],"STUDENT":[1150,1820],"REQUEST_MEMBER":[1800,1820],"CHAT_EXCHANGE":[2430,1470],"KNOWLEDGE_ARTICLE":[2430,1820]};
 return Object.entries(positions).map(([name,[x,y]])=>{const fields=byName.get(name).fields;return{name,x,y,w:W,h:HEADER+fields.length*ROW,fields,reference:false};});
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
     if(shared>0&&gap<14)cost+=shared*(gap<.1?180:50)+(key===parentKey?0:120);
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
 el('style',{},svg).textContent='text{font-family:Arial,Helvetica,sans-serif;fill:#082254}path,line{fill:none;stroke:#17202a;stroke-width:1.5}rect{fill:#fff;stroke:#1763dc;stroke-width:1.4}';
 const backdrop=el('g',{'data-module-panels':'true'},svg);
 groups.forEach(([name,x,y,w,h,fill,stroke])=>{el('rect',{x,y,width:w,height:h,rx:12,style:`fill:${fill};stroke:${stroke};stroke-width:2`},backdrop);txt(backdrop,x+20,y+35,name,28,'start',true);});
 const title=el('g',{'data-diagram-title':'true'},svg);el('rect',{x:750,y:15,width:1500,height:62,rx:12,style:'fill:#07265b;stroke:none'},title);txt(title,1500,57,'Laboratory Management System – ERD',36,'middle',true).style.fill='#fff';
 const edges=el('g',{},svg),cards=el('g',{},svg),marks=el('g',{},svg),labels=el('g',{},svg),nodes=layout(sheet),map=new Map(nodes.map(n=>[n.name,n])),labelBoxes=[],used=[],paths=[];
 groups.forEach(([name,x,y])=>labelBoxes.push({x:x+14,y:y+8,w:name.length*17,h:34}));
 for(const n of nodes){
  const g=el('g',{'data-table':n.name,'data-reference':n.reference},cards);el('rect',{x:n.x,y:n.y,width:n.w,height:n.h},g);
  el('rect',{x:n.x,y:n.y,width:n.w,height:HEADER,style:'fill:#b9e5ff;stroke:#1763dc;stroke-width:1'},g);
  txt(g,n.x+n.w/2,n.y+20,n.name,16,'middle',true);
  el('line',{x1:n.x,y1:n.y+HEADER,x2:n.x+n.w,y2:n.y+HEADER},g);
  n.fields.forEach((f,i)=>{const y=n.y+HEADER+i*ROW;el('line',{x1:n.x,y1:y+ROW,x2:n.x+n.w,y2:y+ROW,style:'stroke-width:.45'},g);
   if(f.key){txt(g,n.x+6,y+(f.unique?12:20),f.key,f.unique?10:13,'start',true);if(f.unique)txt(g,n.x+6,y+25,'UK',10,'start',true);}const row=txt(g,n.x+32,y+20,f.name+(f.nullable?' ?':''),18);row.setAttribute('data-field',f.name);
   if(f.ref&&!n.reference){const relation=relations.find(r=>r.table===n.name&&r.field===f.name);txt(g,n.x+n.w-6,y+20,relation.id,12,'end').setAttribute('data-fk-relation',relation.id);}
  });
 }
 function anchor(n,field,side){return[n.x+(side==='right'?n.w:0),n.y+HEADER+n.fields.findIndex(f=>f.name===field)*ROW+ROW/2];}
 function endMark(p,d,kind,id,end){const group=el('g',{'data-cardinality':kind,'data-relation-id':id,'data-end':end},marks),line=(a,b)=>el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],style:'stroke-width:1.9'},group),at=(u,v=0)=>[p[0]+d*u,p[1]+v];
  if(kind==='many'){line(at(1,-9),at(17));line(at(1,9),at(17));line(at(1),at(17));el('circle',{cx:at(30)[0],cy:p[1],r:5,fill:'#fff',stroke:'#000','stroke-width':1.9},group);}
  else{line(at(7,-9),at(7,9));if(kind==='optional')el('circle',{cx:at(28)[0],cy:p[1],r:5,fill:'#fff',stroke:'#000','stroke-width':1.9},group);else line(at(23,-9),at(23,9));}
  txt(group,p[0]+d*23,p[1]-13,kind==='many'?'0..*':kind==='optional'?'0..1':'1',12,'middle',true).setAttribute('data-cardinality-label','true');
 }
 const sheetRelations=relations.filter(r=>sheet.main.includes(r.table));
 const sides=r=>{const p=map.get(r.parent),c=map.get(r.table);
  return p.x<c.x?['right','left']:p.x>c.x?['left','right']:p.x>PAGE_W/2?['left','left']:['right','right'];};
 for(const r of sheetRelations){
  const parent=map.get(r.parent),child=map.get(r.table),[ps,cs]=sides(r),pd=ps==='right'?1:-1,cd=cs==='right'?1:-1;
  const siblings=sheetRelations.filter(other=>other.parent===r.parent&&other.key===r.key&&sides(other)[0]===ps),offset=(siblings.indexOf(r)-(siblings.length-1)/2)*24;
  const a=anchor(parent,r.key,ps),b=anchor(child,r.field,cs),mark=[a[0]+pd*20,a[1]+offset],sa=[a[0]+pd*60,mark[1]],sb=[b[0]+cd*50,b[1]],middle=route(sa,sb,nodes,labelBoxes,used,r.parent),points=[a,[a[0]+pd*14,a[1]],[a[0]+pd*14,mark[1]],...middle,b];
  const d=points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
  el('path',{d,style:'stroke:#fff;stroke-width:5;stroke-linejoin:round'},edges);
  const edge=el('path',{d,'data-relation':r.id},edges);el('title',{},edge).textContent=r.id+': '+r.table+'.'+r.field+' → '+r.parent+'.'+r.key+' | parent '+(r.optional?'0..1':'1')+'; children '+(r.one?'0..1':'0..*');
  // Fan out at a shared PK before drawing each relationship's own marker.
  // Optional and mandatory parent symbols must never be superimposed.
  endMark(mark,pd,r.optional?'optional':'one',r.id,'parent');endMark(b,cd,r.one?'optional':'many',r.id,'child');
  // Every relationship is identified on its FK row; floating labels must not
  // obstruct the narrow routing corridors or another relationship endpoint.
  const placed=false;
  points.slice(1).forEach((p,i)=>used.push([points[i],p,r.parent]));paths.push({...r,points,labelPlaced:placed,parentSide:ps,childSide:cs,parentMarker:mark});
 }
 // Only the schema belongs in the reusable artwork. Keep explanations and
 // the relationship register on the surrounding website, not in the image.
 // Crop unused gutters without moving any verified PK/FK route or marker.
 const bounds=[...nodes.flatMap(n=>[[n.x,n.y],[n.x+n.w,n.y+n.h]]),...paths.flatMap(p=>p.points)];
 const left=Math.min(...bounds.map(p=>p[0]))-12,top=Math.min(...bounds.map(p=>p[1]))-12;
 const right=Math.max(...bounds.map(p=>p[0]))+12,bottom=Math.max(...bounds.map(p=>p[1]))+12;
 svg.setAttribute('viewBox',`0 0 ${PAGE_W} ${PAGE_H}`);
 window.ErdGeometry[sheet.id]={header:HEADER,row:ROW,nodes: nodes.map(n=>({...n,fields:n.fields.map(f=>f.name)})),paths,labelBoxes};return svg;
}
window.ErdGeometry={};
const container=document.getElementById('erd-sheets');
model.sheets.forEach((sheet,i)=>{
 const nav=html('a',document.getElementById('erd-sections'),String(i+1)+'. '+sheet.title);nav.href='#erd-'+sheet.id;
 const wrap=html('section',container);wrap.className='erd-wrap';const paper=html('article',wrap);paper.className='erd-sheet';paper.id='erd-'+sheet.id;paper.append(diagram(sheet,i+1));
 const download=html('p',wrap);download.className='screen-only downloads';for(const ext of ['png','svg']){const a=html('a',download,'Download '+ext.toUpperCase());a.href='assets/erd/erd-'+sheet.id+'.'+ext;a.download='erd-'+sheet.id+'.'+ext;}
});
const dict=document.getElementById('dictionary');
for(const table of model.tables){const section=html('section',dict);section.id='table-'+table.name;html('h3',section,table.name+' · '+table.store+' · ERD '+home.get(table.name));if(table.note)html('p',section,table.note);const list=html('table',section),head=html('tr',html('thead',list));['Key','Field','Logical type','Nullable','References'].forEach(s=>html('th',head,s));const body=html('tbody',list);
 table.fields.forEach(f=>{const row=html('tr',body);[f.key+(f.unique?' / UK':''),f.name,f.values?f.type+' ('+f.values.join(' / ')+')':f.type,f.name==='reservation_type'?'Required for Class Representative; not applicable to Faculty':f.nullable?'Yes':'No',f.ref?f.ref.table+'.'+f.ref.field:'—'].forEach(s=>html('td',row,s));});
 if(table.unique.length)html('p',section,'Unique combinations: '+table.unique.map(u=>'('+u.join(', ')+')').join('; '));
}
const relBody=document.getElementById('relationships');relations.forEach(r=>{const row=html('tr',relBody);[r.id,r.parent+'.'+r.key,r.optional?'0..1':'1',r.table+'.'+r.field,r.one?'0..1':'0..*'].forEach(v=>html('td',row,v));});
document.getElementById('summary-counts').textContent=model.tables.length+' entities · '+relations.length+' foreign-key relationships · 11 DFD stores · one grouped landscape diagram';
document.getElementById('print-erd').onclick=()=>window.print();window.ErdRelations=relations;window.__erdReady=true;
})();
