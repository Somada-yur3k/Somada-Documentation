(function(){
'use strict';
const schema=window.LabErdModel,book=window.LabErdPrintModel,NS='http://www.w3.org/2000/svg';
const W=book.width,H=book.height,HEADER=28,ROW=20,REL_ROW=36,TABLE_W=340;
const byName=new Map(schema.tables.map(t=>[t.name,t])),home=new Map(book.sheets.flatMap(s=>s.main.map(n=>[n,s])));
const relations=schema.tables.flatMap(t=>t.fields.filter(f=>f.ref).map(f=>({table:t.name,field:f.name,parent:f.ref.table,key:f.ref.field,optional:!!f.nullable,one:!!f.unique}))).map((r,i)=>({...r,id:'R'+String(i+1).padStart(2,'0')}));
const el=(tag,a={},parent)=>{const n=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));parent?.append(n);return n;};
const html=(tag,parent,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;parent?.append(n);return n;};
const txt=(p,x,y,value,size=16,anchor='start',bold=false)=>{const t=el('text',{x,y,'font-size':size,'text-anchor':anchor,'font-weight':bold?700:400},p);t.textContent=value;return t;};
function base(id,title,subtitle){
 const svg=el('svg',{xmlns:NS,viewBox:'0 0 '+W+' '+H,role:'img','aria-label':title,'data-print-page':id});
 el('style',{},svg).textContent='text{font-family:Arial,Helvetica,sans-serif;fill:#111}rect{fill:#fff;stroke:#64748b;stroke-width:1}line,path{fill:none;stroke:#111;stroke-width:1.3}a text{fill:#164e85}.head{fill:#eef2f6}.relation-active rect{fill:#e7f1ff;stroke:#0065d1}.relation-active line,.relation-active circle{stroke:#0065d1;stroke-width:2}.relation-active text{fill:#0059b8}[data-cardinality]{outline:none;cursor:pointer}';
 txt(svg,24,24,'Laboratory Management System - ERD',20,'start',true);
 txt(svg,24,49,title,18,'start',true);txt(svg,24,70,subtitle,13);
 el('line',{x1:24,y1:79,x2:736,y2:79},svg);return svg;
}
function footer(svg,label){
 el('line',{x1:24,y1:1062,x2:736,y2:1062},svg);
 txt(svg,24,1083,'A4 portrait | 25 tables | 51 relationships | Logical draft',12);
 txt(svg,736,1083,label,12,'end');
}
function pageLink(parent,x,y,sheet,anchor='start'){
 const a=el('a',{href:'#erd-print-'+sheet.id,'data-detail-reference':sheet.code},parent);
 txt(a,x,y,sheet.code,14,anchor,true);return a;
}
function cardinality(parent,x,y,d,kind,id,end){
 const g=el('g',{'data-cardinality':kind,'data-relation-id':id,'data-end':end,tabindex:'0',role:'button'},parent);
 el('rect',{x:d>0?x:x-40,y:y-20,width:40,height:28,style:'fill:transparent;stroke:none;pointer-events:all'},g);
 const line=(u,v,u2,v2)=>el('line',{x1:x+d*u,y1:y+v,x2:x+d*u2,y2:y+v2},g);
 line(0,4,40,4);
 if(kind==='many'){
  el('circle',{cx:x+d*25,cy:y+4,r:3.6,style:'fill:#fff;stroke:#111;stroke-width:1.3'},g);
  line(15,4,3,-1);line(15,4,3,4);line(15,4,3,9);
 }else if(kind==='optional'){
  el('circle',{cx:x+d*8,cy:y+4,r:3.6,style:'fill:#fff;stroke:#111;stroke-width:1.3'},g);
  line(22,-1,22,9);
 }else{line(8,-1,8,9);line(22,-1,22,9);}
 txt(g,x+d*20,y-6,kind==='many'?'0..*':kind==='optional'?'0..1':'1',14,'middle',true).setAttribute('data-cardinality-label','true');
 return g;
}
function relationshipRows(svg,list,y,detailId){
 txt(svg,24,y,'ID',14,'start',true);txt(svg,62,y,'Parent / PK',14,'start',true);
 txt(svg,336,y,'Cardinality',14,'middle',true);txt(svg,395,y,'Child / FK',14,'start',true);
 txt(svg,699,y,'Details',14,'middle',true);y+=24;
 const start=y,rows=[];
 list.forEach((r,i)=>{
  const baseline=y+i*REL_ROW,row=el('g',{'data-relationship-row':r.id},svg),parent=home.get(r.parent),child=home.get(r.table);
  el('rect',{x:24,y:baseline-23,width:712,height:REL_ROW,style:'fill:'+(i%2?'#f7f9fc':'#fff')+';stroke:none'},row);
  txt(row,25,baseline,r.id,13,'start',true);
  const parentText=el('g',{'data-parent-field':r.id,'data-reference':r.parent+'.'+r.key},row);
  el('rect',{x:59,y:baseline-20,width:229,height:34,style:'fill:#fff;stroke:#b8c2ce;stroke-width:.65'},parentText);
  txt(parentText,62,baseline-6,r.parent,14,'start',true);txt(parentText,62,baseline+10,'PK '+r.key,14);
  const childText=el('g',{'data-child-field':r.id,'data-reference':r.table+'.'+r.field},row);
  el('rect',{x:391,y:baseline-20,width:266,height:34,style:'fill:#fff;stroke:#b8c2ce;stroke-width:.65'},childText);
  txt(childText,395,baseline-6,r.table,14,'start',true);txt(childText,395,baseline+10,'FK '+r.field,14);
  el('line',{x1:288,y1:baseline+1,x2:391,y2:baseline+1,'data-relation':r.id},row);
  cardinality(row,294,baseline-3,1,r.optional?'optional':'one',r.id,'parent');
  cardinality(row,378,baseline-3,-1,r.one?'optional':'many',r.id,'child');
  pageLink(row,668,baseline,parent);txt(row,692,baseline,'/',13);pageLink(row,707,baseline,child);
  const label=r.id+': '+r.parent+'.'+r.key+'; parents per child '+(r.optional?'0..1':'1')+'; '+r.table+'.'+r.field+'; children per parent '+(r.one?'0..1':'0..*')+'. Parent in '+parent.code+', child in '+child.code+'.';
  row.querySelectorAll('[data-cardinality]').forEach(mark=>{
   mark.setAttribute('aria-label',label);el('title',{},mark).textContent=label;
   const select=()=>{clear(svg);row.classList.add('relation-active');svg.setAttribute('data-active-relation',r.id);svg.querySelectorAll('[data-table="'+r.parent+'"],[data-table="'+r.table+'"]').forEach(t=>t.classList.add('relation-active'));document.getElementById('relationship-status').textContent=label;};
   mark.addEventListener('pointerenter',select);mark.addEventListener('pointerleave',()=>clear(svg));mark.addEventListener('focus',select);mark.addEventListener('blur',()=>clear(svg));mark.addEventListener('keydown',e=>{if(e.key==='Escape'){mark.blur();clear(svg);}});
  });
  rows.push({...r,y:baseline,parentPage:parent.code,childPage:child.code});
 });
 return{start,bottom:y+list.length*REL_ROW,rows};
}
function clear(svg){
 svg.querySelectorAll('.relation-active').forEach(n=>n.classList.remove('relation-active'));svg.removeAttribute('data-active-relation');
 document.getElementById('relationship-status').textContent='Hover or focus either cardinality to highlight its relationship and the tables present on this page.';
}
function detail(sheet){
 const svg=base(sheet.id,'Detail '+sheet.code+' - '+sheet.title,'Left: parents per child. Right: children per parent. ? = nullable. R-tags match the FK rows.');
 const nodes=[];
 sheet.columns.forEach((names,column)=>{
  let y=86;const x=column===0?24:396;
  names.forEach(name=>{
   const table=byName.get(name),h=HEADER+ROW*table.fields.length,g=el('g',{'data-table':name,'data-full-definition':'true',id:'erd-print-'+sheet.id+'-'+name},svg);
   el('rect',{x,y,width:TABLE_W,height:h},g);el('rect',{x,y,width:TABLE_W,height:HEADER,class:'head'},g);
   txt(g,x+12,y+21,name,16,'start',true);txt(g,x+TABLE_W-10,y+21,table.store,13,'end');
   table.fields.forEach((f,i)=>{
    const top=y+HEADER+i*ROW,baseline=top+15;
    el('line',{x1:x,y1:top+ROW,x2:x+TABLE_W,y2:top+ROW,style:'stroke:#d4dae2;stroke-width:.6'},g);
    if(f.key)txt(g,x+8,baseline,f.key+(f.unique?'/UK':''),13,'start',true);
    txt(g,x+58,baseline,f.name+(f.nullable?' ?':''),16).setAttribute('data-field',f.name);
    if(f.ref){const r=relations.find(r=>r.table===name&&r.field===f.name);txt(g,x+TABLE_W-9,baseline,r.id,13,'end',true).setAttribute('data-fk-relation',r.id);}
   });
   nodes.push({name,x,y,w:TABLE_W,h,fields:table.fields.map(f=>f.name)});y+=h+12;
  });
 });
 const list=relations.filter(r=>sheet.main.includes(r.table)),tableBottom=Math.max(...nodes.map(n=>n.y+n.h));
 const registers=relationshipRows(svg,list,tableBottom+18,sheet.id);
 // Left cardinality is parents per child; right is children per parent.
 if(registers.bottom+24<1055)txt(svg,24,registers.bottom+24,sheet.note,12);
 footer(svg,'Detail '+sheet.code+' | Print page '+sheet.printPage+' / 7');
 window.ErdPrintGeometry[sheet.id]={nodes,relationships:registers.rows,tableBottom,registerBottom:registers.bottom};
 return svg;
}
function overview(){
 const svg=base('overview','Schema overview and detail-page index','All 25 tables are listed. Only selected transaction relationships are shown; this is not the full ERD.');
 const placements=[[24,96,340],[396,96,340],[24,322,340],[396,322,340],[24,514,340],[396,514,340]];
 book.sheets.forEach((s,i)=>{
  const [x,y,w]=placements[i],h=i<2?204:i<4?174:134,g=el('g',{'data-module-index':s.id},svg);
  el('rect',{x,y,width:w,height:h,rx:4},g);txt(g,x+12,y+25,s.title,16,'start',true);
  pageLink(g,x+w-14,y+25,s,'end');
  s.main.forEach((name,j)=>txt(g,x+12,y+52+j*23,name,16).setAttribute('data-overview-table',name));
 });
 txt(svg,24,677,'Selected transaction relationships - exact FK pairs',16,'start',true);
 const registers=relationshipRows(svg,book.selectedRelationships.map(id=>relations.find(r=>r.id===id)),703,'overview');
 txt(svg,24,registers.bottom+13,'All remaining relationships and complete attributes are shown in Details A1-A6.',13);
 footer(svg,'Overview | Print page 1 / 7');
 window.ErdPrintGeometry.overview={nodes:[],relationships:registers.rows};
 return svg;
}
window.ErdPrintGeometry={};
const container=document.getElementById('erd-sheets');
for(const [id,title,svg]of [['overview','Schema overview',overview()],...book.sheets.map(s=>[s.id,'Detail '+s.code+' - '+s.title,detail(s)])]){
 const wrap=html('section',container);wrap.className='erd-wrap';const article=html('article',wrap);article.className='erd-sheet';article.id='erd-print-'+id;article.append(svg);
 const nav=html('a',document.getElementById('erd-sections'),title);nav.href='#erd-print-'+id;
 const downloads=html('p',wrap);downloads.className='screen-only downloads';
 for(const ext of ['png','svg']){const a=html('a',downloads,'Download '+ext.toUpperCase());a.href='assets/erd/erd-print-'+id+'.'+ext;a.download='erd-print-'+id+'.'+ext;}
}
const register=html('table',document.getElementById('relationships')),head=html('tr',html('thead',register));
['ID','Parent PK','Parents per child','Child FK','Children per parent','Parent / child details'].forEach(v=>html('th',head,v));
const tbody=html('tbody',register);
relations.forEach(r=>{const row=html('tr',tbody);[r.id,r.parent+'.'+r.key,r.optional?'0..1':'1',r.table+'.'+r.field,r.one?'0..1':'0..*',home.get(r.parent).code+' / '+home.get(r.table).code].forEach(v=>html('td',row,v));});
document.getElementById('summary-counts').textContent=schema.tables.length+' tables | '+relations.length+' relationships | one overview + six A4 detail pages | no schema changes';
document.getElementById('print-erd').onclick=()=>window.print();
window.addEventListener('beforeprint',()=>document.querySelectorAll('.erd-sheet svg').forEach(clear));
window.ErdPrintRelations=relations;window.__erdPrintReady=true;
})();
