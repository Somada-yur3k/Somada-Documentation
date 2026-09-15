/* A4 portrait context diagram: all 46 current Level 1 boundary exchanges. */
(async function(){
  'use strict';
  const params=new URLSearchParams(location.search),output=params.has('embed')||params.has('export');
  const NS='http://www.w3.org/2000/svg',W=1200,H=1500,FONT=20,LABEL_GAP=6;
  document.body.classList.toggle('export-mode',output);
  const entityLines={classrep:['Class Rep.'],faculty:['Faculty'],dean:['Dean'],
    headlab:['Head','Laboratory'],physics:['Physics','Lab Staff'],circuits:['Circuits','Lab Staff']};
  const storeLines={d1:['User','accounts'],d2:['Reservations','& approvals'],d3:['Lab schedule','& usage logs'],
    d4:['Equipment','inventory'],d5:['Borrowing','slip records'],d6:['Clearance','records'],d7:['Daily task','records'],
    d8:['Knowledge','base'],d9:['Chat history'],d10:['Disposal','records']};
  const colors={classrep:'#1e40af',faculty:'#9f1239',dean:'#6b21a8',headlab:'#166534',physics:'#92400e',circuits:'#115e59'};
  function el(tag,attrs={},children=[]) {
    const node=document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));
    children.forEach(child=>node.appendChild(child)); return node;
  }
  function text(x,y,lines,attrs={}) {
    const node=el('text',{x,'text-anchor':'middle','font-family':'Arial, Helvetica, sans-serif','font-size':FONT,fill:'#111',...attrs});
    const step=attrs['data-line-height'] || 32;
    lines.forEach((line,i)=>{
      const span=el('tspan',{x,y:y+(i-(lines.length-1)/2)*step});span.textContent=line;node.appendChild(span);
    });return node;
  }
  // Plain text, not a white rectangle: omit only the part of its own stroke
  // behind the label. The connector remains one path with fixed endpoints.
  // Recompute that transparent gap when a label or internal route is dragged.
  function clearLabelStrokes(svg) {
    svg.querySelectorAll('.diagram-flow-label').forEach(label=>{
      const path=svg.querySelector('.diagram-connector[data-flow-id="'+label.dataset.flowId+'"]');
      function update() {
        const box=label.getBBox(), matrix=label.transform.baseVal.consolidate()?.matrix;
        const corners=[[box.x-LABEL_GAP,box.y-2],[box.x+box.width+LABEL_GAP,box.y+box.height+2]].map(([x,y])=>{
          const point=new DOMPoint(x,y);return matrix?point.matrixTransform(matrix):point;
        });
        const xmin=Math.min(...corners.map(p=>p.x)),xmax=Math.max(...corners.map(p=>p.x));
        const ymin=Math.min(...corners.map(p=>p.y)),ymax=Math.max(...corners.map(p=>p.y));
        const values=path.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number),points=[];
        for(let i=0;i<values.length;i+=2)points.push([values[i],values[i+1]]);
        let distance=0;const gaps=[];
        points.slice(1).forEach((b,i)=>{
          const a=points[i],horizontal=a[1]===b[1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
          const axis=horizontal?0:1,fixed=1-axis;
          const min=horizontal?xmin:ymin,max=horizontal?xmax:ymax;
          const crosses=horizontal?a[fixed]>=ymin&&a[fixed]<=ymax:a[fixed]>=xmin&&a[fixed]<=xmax;
          if(length&&crosses) {
            const lo=Math.max(min,Math.min(a[axis],b[axis])),hi=Math.min(max,Math.max(a[axis],b[axis]));
            if(hi>lo){const start=Math.min(Math.abs(lo-a[axis]),Math.abs(hi-a[axis]));gaps.push([distance+start,distance+start+hi-lo]);}
          }
          distance+=length;
        });
        let cursor=0;const dash=[];
        gaps.forEach(([start,end])=>{dash.push(Math.max(0,start-cursor),end-start);cursor=end;});
        if(dash.length){dash.push(distance-cursor+1,0);path.setAttribute('stroke-dasharray',dash.join(' '));}
        else path.removeAttribute('stroke-dasharray');
      }
      update();
      if(!output){const observer=new MutationObserver(update);observer.observe(label,{attributes:true,attributeFilter:['transform']});observer.observe(path,{attributes:true,attributeFilter:['d']});}
    });
  }


  const response=await fetch('../dfd-level1/dfd-level1-model.json');
  if(!response.ok)throw new Error('Unable to load the canonical Level 1 model.');
  const model=await response.json(),entityIds=new Set(model.entities.map(e=>e.id));
  const flows=model.flows.filter(f=>f.kind==='external').map(f=>({...f,entity:entityIds.has(f.source)?f.source:f.target,dir:entityIds.has(f.source)?'in':'out'}));
  window.FLOWS=flows;
  const nodes={},positions={classrep:[10,95],faculty:[10,530],dean:[10,965],physics:[1025,95],circuits:[1025,530],headlab:[1025,965]};
  model.entities.forEach(e=>{const [x,y]=positions[e.id];nodes[e.id]={id:e.id,x,y,w:165,h:410};});
  const system={id:'system',x:480,y:80,w:240,h:1330};nodes.system=system;
  const svg=el('svg',{id:'diagram',xmlns:NS,width:W,height:H,viewBox:`0 0 ${W} ${H}`});
  const defs=el('defs');
  model.entities.forEach(e=>defs.appendChild(el('marker',{id:'arrow-'+e.id,markerWidth:10,markerHeight:10,refX:9,refY:4,orient:'auto',markerUnits:'userSpaceOnUse'},[el('path',{d:'M0,0 L9,4 L0,8 Z',fill:colors[e.id]})])));
  svg.append(defs,el('rect',{width:W,height:H,fill:'#fff'}),text(W/2,40,['Context Diagram — DFD Level 0'],{'font-size':28,'font-weight':'700'}));
  const routes=[],flowLayer=el('g'),nodeLayer=el('g');svg.append(flowLayer,nodeLayer);
  document.getElementById('stage').append(svg);
  const reference=document.getElementById('flow-reference');
  for(const entity of model.entities){
    const n=nodes[entity.id],left=n.x<system.x,own=flows.filter(f=>f.entity===entity.id);
    own.forEach((f,i)=>{
      const y=n.y+n.h/2+(i-(own.length-1)/2)*32;
      const a=[left?n.x+n.w:n.x,y],b=[left?system.x:system.x+system.w,y];
      const points=f.dir==='in'?[a,b]:[b,a];
      const path=el('path',{class:'diagram-connector','data-flow-id':f.id,d:`M ${points[0].join(' ')} L ${points[1].join(' ')}`,fill:'none',stroke:colors[entity.id],'stroke-width':2.2,'marker-end':'url(#arrow-'+entity.id+')'});
      const title=el('title');title.textContent=f.label;path.append(title);
      const label=el('g',{class:'diagram-flow-label','data-flow-id':f.id,'data-full-label':f.label},[text((a[0]+b[0])/2,y+6,[f.label])]);
      flowLayer.append(path,label);
      const t=label.querySelector('text'),maxWidth=Math.abs(a[0]-b[0])-52;
      t.setAttribute('font-size',Math.min(FONT,FONT*maxWidth/t.getBBox().width));
      routes.push({id:f.id,source:f.dir==='in'?entity.id:'system',target:f.dir==='in'?'system':entity.id,points});
      const row=document.createElement('tr');
      [f.id,f.dir==='in'?entity.name:'System',f.label,f.label,f.dir==='in'?'System':entity.name].forEach(value=>{const td=document.createElement('td');td.textContent=value;row.append(td);});reference.append(row);
    });
    const group=el('g',{'data-node-id':entity.id},[el('rect',{x:n.x,y:n.y,width:n.w,height:n.h,fill:'#fff',stroke:'#111','stroke-width':2.3}),text(n.x+n.w/2,n.y+n.h/2,entityLines[entity.id],{'font-size':24,'data-line-height':29})]);nodeLayer.append(group);
  }
  nodeLayer.append(el('g',{'data-node-id':'system'},[
    el('rect',{x:system.x,y:system.y,width:system.w,height:system.h,rx:10,fill:'#fff',stroke:'#111','stroke-width':2.3}),
    el('path',{d:'M480 125 H720',stroke:'#111','stroke-width':2.3}),
    text(600,112,['0'],{'font-size':28}),
    text(600,690,['A Web-Based','Physics and Circuits','Laboratory','Management System','with AI Capabilities','for NU Fairview'],{'font-size':23,'data-line-height':35})
  ]));
  document.getElementById('stage').append(svg);
  await document.fonts.ready;clearLabelStrokes(svg);
  const labelBoxes=[...svg.querySelectorAll('.diagram-flow-label')].map(g=>{const b=g.getBBox();return{id:g.dataset.flowId,x:b.x-6,y:b.y-2,w:b.width+12,h:b.height+4};});
  window.__level0={nodes,routes,labelBoxes,flows,W,H,FONT};
  if(!output){
    const authored=svg.cloneNode(true);let editing=null;
    window.SOMADADiagramEditor.init(svg,{storageKey:'dfd-level0-full-labels-v3'});
    svg.querySelectorAll('.diagram-connector-hit').forEach(p=>p.removeAttribute('stroke-dasharray'));
    window.addEventListener('beforeprint',()=>{editing=svg;svg.replaceWith(authored);});
    window.addEventListener('afterprint',()=>{if(editing){authored.replaceWith(editing);editing=null;}});
  }
  window.__done=true;
})().catch(error=>{window.__error=error.message;document.getElementById('stage').textContent=error.message;});
