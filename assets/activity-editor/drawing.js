(function(){
'use strict';
const C=window.ActivityEditorCore,NS='http://www.w3.org/2000/svg';
function element(tag,attrs={},parent){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);parent?.append(n);return n;}
function label(parent,x,y,value,size=21,width=250){
 const measure=document.createElement('canvas').getContext('2d');measure.font=size+'px Arial';
 const lines=[];for(const line of String(value).split('\n')){let part='';for(const word of line.split(/\s+/)){if(part&&measure.measureText(part+' '+word).width>width){lines.push(part);part=word;}else part+=(part?' ':'')+word;}lines.push(part);}
 const t=element('text',{'text-anchor':'middle','font-size':size,'font-family':'Arial, Helvetica, sans-serif',fill:'#000',style:'fill:#000'},parent);
 lines.forEach((line,i)=>{element('tspan',{x,y:y+(i-(lines.length-1)/2)*size*1.15+size*.34},t).textContent=line;});return t;
}
function draw(seed,state,selection=null){
 const svg=element('svg',{xmlns:NS,viewBox:`0 0 ${seed.width} ${seed.height}`,role:'img','aria-label':'Activity diagram: '+seed.name});
 const defs=element('defs',{},svg),marker=element('marker',{id:'editor-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:8.5,markerHeight:8.5,orient:'auto'},defs);element('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#000'},marker);
 element('rect',{width:seed.width,height:seed.height,fill:'#fff'},svg);
 label(svg,600,32,seed.name+' — Activity Diagram',26,1150);label(svg,600,78,seed.precondition,18,1140);
 const lines=element('g',{},svg),shapes=element('g',{},svg),labels=element('g',{},svg),handles=element('g',{'data-editor-only':'true'},svg);
 seed.routes.forEach((r,i)=>{
  const ps=C.route(seed,state,i),d=ps.map((p,j)=>(j?'L':'M')+p.join(' ')).join(' ');
  element('path',{d,fill:'none',stroke:'#000','stroke-width':2.2,'marker-end':'url(#editor-arrow)'},lines);
  element('path',{d,class:'route-hit','data-edge':i,'data-editor-only':'true'},lines);
  const value=state.edges[i]?.label??r.guard;
  if(value){let longest=0;for(let j=1;j<ps.length;j++){const length=Math.hypot(ps[j][0]-ps[j-1][0],ps[j][1]-ps[j-1][1]);if(length>Math.hypot(ps[longest+1][0]-ps[longest][0],ps[longest+1][1]-ps[longest][1]))longest=j-1;}
   const a=ps[longest],b=ps[longest+1],t=label(labels,(a[0]+b[0])/2,(a[1]+b[1])/2-12,value,18,260);t.setAttribute('data-edge',i);t.setAttribute('style','paint-order:stroke;stroke:white;stroke-width:5;stroke-linejoin:round');
  }
  if(selection?.type==='edge'&&selection.key===String(i)){
   if(ps.length<4){element('circle',{cx:(ps[0][0]+ps[1][0])/2,cy:(ps[0][1]+ps[1][1])/2,r:10,class:'handle','data-handle':i,'data-segment':-1},handles);}
   else for(let j=1;j<ps.length-2;j++)element('circle',{cx:(ps[j][0]+ps[j+1][0])/2,cy:(ps[j][1]+ps[j+1][1])/2,r:10,class:'handle','data-handle':i,'data-segment':j},handles);
  }
 });
 for(const [key,n]of Object.entries(seed.nodes)){
  const p=state.nodes[key]||{dx:0,dy:0},x=n.x+p.dx,y=n.y+p.dy,cx=x+n.w/2,cy=y+n.h/2;
  const g=element('g',{'data-node':key,class:'node'+(selection?.type==='node'&&selection.key===key?' selected':''),tabindex:0,role:'button','aria-label':p.label||n.title||n.kind},shapes);
  const common={fill:'#fff',stroke:'#000','stroke-width':2.2};
  if(n.kind==='action')element('rect',{x,y,width:n.w,height:n.h,rx:10,...common},g);
  if(['decision','merge'].includes(n.kind))element('path',{d:`M${cx} ${y} L${x+n.w} ${cy} L${cx} ${y+n.h} L${x} ${cy} Z`,...common},g);
  if(n.kind==='initial')element('circle',{cx,cy,r:n.w/2,fill:'#000'},g);
  if(n.kind==='final'){element('circle',{cx,cy,r:n.w/2,...common},g);element('circle',{cx,cy,r:14,fill:'#000'},g);}
  if(['fork','join'].includes(n.kind))element('rect',{x,y,width:n.w,height:n.h,fill:'#000'},g);
  if(n.joinSpec)label(labels,cx-135,y+n.h+29,'{joinSpec = '+n.joinSpec+'}',17,240);
  if(n.title)label(g,cx,cy,p.label??n.title,n.kind==='decision'?18:21,n.w-12);
 }
 return svg;
}
function clean(svg){svg.querySelectorAll('[data-editor-only]').forEach(n=>n.remove());svg.querySelectorAll('[class],[tabindex]').forEach(n=>{n.removeAttribute('class');n.removeAttribute('tabindex');});return svg;}
window.ActivityDrawing={draw,clean};
})();
