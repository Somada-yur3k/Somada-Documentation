/* A4 portrait authoring layout. Each canonical flow remains an independent path.
 * User-approved exception: crossings without junctions are allowed; shared runs
 * and ports are not. Plain labels (no white pills) are also user-requested.
 * Visible labels retain the complete canonical flow names.
 */
(async function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const output = params.has('export') || params.has('embed');
  document.body.classList.toggle('output-mode', output);
  const NS = 'http://www.w3.org/2000/svg';
  const W=1880, H=2140, FONT=24, EXTERNAL_LANE_STEP=5.5, STORE_LANE_STEP=5.2, LABEL_GAP=6;
  const E={x:14,w:170,h:264}, P={x:920,w:195,h:390}, D={x:1614,w:250,h:96,idw:64};
  const entityLines={classrep:['Class Rep.'],faculty:['Faculty'],dean:['Dean'],
    headlab:['Head','Laboratory'],physics:['Physics','Lab Staff'],circuits:['Circuits','Lab Staff']};
  const processLines={p1:['Manage User','Access &','Accounts'],p2:['Manage','Reservations,','Availability','& Approvals'],
    p3:['Answer Lab','Questions'],p4:['Manage','Equipment &','Borrowing'],p5:['Manage Lab','Admin. &','Reporting']};
  const storeLines={d1:['User','accounts'],d2:['Reservations','& approvals'],d3:['Lab schedule','& usage logs'],
    d4:['Equipment','inventory'],d5:['Borrowing','slip records'],d6:['Clearance','records'],d7:['Daily task','records'],
    d8:['Knowledge','base'],d9:['Chat history'],d10:['Disposal','records']};
  const storeY={d1:230,d2:610,d8:940,d9:1056,d4:1260,d5:1410,d10:1560,d3:1780,d7:1890,d6:2000};
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
  // Reorder distinct routing lanes to reduce crossings without adding bends,
  // changing ports, grouping flows, or moving labels into the routing corridor.
  function orderLanes(routes, paths) {
    const between=(y,a,b)=>y>Math.min(a,b)&&y<Math.max(a,b);
    ['left','right'].forEach(side=>{
      const entries=routes.filter(r=>r.side===side).map(r=>{
        const points=r.points[0][0]<r.points.at(-1)[0]?r.points:r.points.slice().reverse();
        return {r,a:points[0][1],b:points.at(-1)[1]};
      });
      const cost=(a,b)=>Number(between(a.b,b.a,b.b))+Number(between(b.a,a.a,a.b));
      const score=list=>list.reduce((sum,a,i)=>sum+list.slice(i+1).reduce((s,b)=>s+cost(a,b),0),0);
      let best=entries, bestScore=score(best);
      const seeds=[entries,entries.slice().sort((a,b)=>Math.min(a.a,a.b)-Math.min(b.a,b.b)),
        entries.slice().sort((a,b)=>Math.max(a.a,a.b)-Math.max(b.a,b.b)),
        entries.slice().sort((a,b)=>Math.abs(a.b-a.a)-Math.abs(b.b-b.a))];
      seeds.forEach(seed=>{
        const order=seed.slice();
        for(let pass=0;pass<entries.length*entries.length;pass++) {
          let gain=0,from=-1,to=-1;
          for(let i=0;i<order.length;i++) {
            let delta=0;
            for(let j=i+1;j<order.length;j++) {
              delta+=cost(order[j],order[i])-cost(order[i],order[j]);
              if(delta<gain){gain=delta;from=i;to=j;}
            }
            delta=0;
            for(let j=i-1;j>=0;j--) {
              delta+=cost(order[i],order[j])-cost(order[j],order[i]);
              if(delta<gain){gain=delta;from=i;to=j;}
            }
          }
          if(from<0)break;
          order.splice(to,0,order.splice(from,1)[0]);
        }
        const value=score(order);if(value<bestScore){best=order;bestScore=value;}
      });
      // Give simultaneously visible vertical runs substantially more space.
      // Runs in separate Y regions may use nearby (never identical) X values;
      // no two paths share a lane, segment, bend, port, or arrowhead.
      const base=side==='left'?200:1452, step=side==='left'?10:9, slots=side==='left'?29:16;
      const close=(a,b)=>Math.min(Math.max(a.a,a.b),Math.max(b.a,b.b))+12>=Math.max(Math.min(a.a,a.b),Math.min(b.a,b.b));
      let placedBest=null, placedScore=Infinity;
      const orders=[best,
        best.slice().sort((a,b)=>Math.min(a.a,a.b)-Math.min(b.a,b.b)||Math.abs(b.a-b.b)-Math.abs(a.a-a.b)),
        best.slice().sort((a,b)=>Math.max(b.a,b.b)-Math.max(a.a,a.b)),
        best.slice().sort((a,b)=>Math.abs(b.a-b.b)-Math.abs(a.a-a.b))];
      orders.forEach(order=>{
        const placed=[];
        for(const entry of order) {
          const index=best.indexOf(entry),offset=(index+1)*.015;
          const candidates=Array.from({length:slots},(_,column)=>({column,lane:base+column*step+offset})).filter(candidate=>placed.every(other=>candidate.column!==other.column||!close(entry,other)));
          if(!candidates.length)return;
          const target=index*(side==='left'?EXTERNAL_LANE_STEP:STORE_LANE_STEP);
          const crossingCost=candidate=>placed.reduce((sum,other)=>sum+(other.lane<candidate.lane?cost(other,entry):cost(entry,other)),0);
          candidates.sort((a,b)=>crossingCost(a)-crossingCost(b)||Math.abs(a.lane-base-target)-Math.abs(b.lane-base-target));
          placed.push({...entry,...candidates[0]});
        }
        const value=score(placed.slice().sort((a,b)=>a.lane-b.lane));
        if(value<placedScore){placedBest=placed;placedScore=value;}
      });
      if(!placedBest)throw new Error('The vertical routes do not fit their reserved corridor.');
      placedBest.forEach(({r,lane})=>{
        r.points[1][0]=r.points[2][0]=lane;
        paths.querySelector('[data-flow-id="'+r.id+'"]').setAttribute('d',r.points.map((p,j)=>(j?'L':'M')+p.join(' ')).join(' '));
      });
    });
  }
  try {
    const response=await fetch('dfd-level1-model.json');
    if (!response.ok) throw new Error('Could not load the canonical flow inventory.');
    const model=await response.json();
    const nodes={};
    model.entities.forEach((n,i)=>nodes[n.id]={...n,...E,y:96+i*336,kind:'entity',lines:entityLines[n.id]});
    model.processes.forEach((n,i)=>nodes[n.id]={...n,...P,y:70+i*410,kind:'process',lines:processLines[n.id]});
    model.stores.forEach(n=>nodes[n.id]={...n,...D,y:storeY[n.id],kind:'store',lines:storeLines[n.id]});
    const svg=el('svg',{xmlns:NS,width:W,height:H,viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Physics and Circuits Laboratory Level 1 DFD: five processes and 74 independent data flows'});
    svg.appendChild(el('rect',{width:W,height:H,fill:'#fff'}));
    const defs=el('defs');
    Object.entries({...colors,store:'#27272a'}).forEach(([key,color])=>{
      const marker=el('marker',{id:'arrow-'+key,markerWidth:13,markerHeight:13,refX:12,refY:6,orient:'auto',markerUnits:'userSpaceOnUse'});
      marker.appendChild(el('path',{d:'M0 0 L12 6 L0 12 Z',fill:color}));defs.appendChild(marker);
    });
    svg.appendChild(defs);
    svg.appendChild(text(W/2,36,['Physics and Circuits Laboratory — Data Flow Diagram, Level 1'],{'font-size':34,'font-weight':700}));
    const guideLayer=el('g',{'data-routing-guides':'true'}),paths=el('g'),shapes=el('g'),labels=el('g');
    svg.append(guideLayer,paths,shapes,labels);
    document.getElementById('stage').replaceChildren(svg);
    const orderedByPeer=(a,b)=>{
      const pa=nodes[a.source].kind==='process'?nodes[a.source]:nodes[a.target];
      const pb=nodes[b.source].kind==='process'?nodes[b.source]:nodes[b.target];
      return pa.y-pb.y || model.flows.indexOf(a)-model.flows.indexOf(b);
    };
    const port={}, routes=[], labelBoxes=[];
    // Each process side is partitioned into ordered owner bands. Dense sides
    // alternate label columns, but paths and ports are still completely separate.
    model.processes.forEach(p=>{
      ['external','store'].forEach(kind=>{
        const flows=model.flows.filter(f=>f.kind===kind&&(f.source===p.id||f.target===p.id));
        const peer=f=>nodes[f.source===p.id?f.target:f.source];
        flows.sort((a,b)=>peer(a).y-peer(b).y || model.flows.indexOf(a)-model.flows.indexOf(b));
        const n=nodes[p.id], step=(P.h-48)/Math.max(1,flows.length-1);
        flows.forEach((f,i)=>port[f.id]={py:n.y+24+(flows.length===1?(P.h-48)/2:i*step),order:i,count:flows.length});
        if (params.has('grid')&&!output) {
          const owners=[...new Set(flows.map(f=>peer(f).id))];
          owners.forEach(owner=>{
            const ys=flows.filter(f=>peer(f).id===owner).map(f=>port[f.id].py);
            guideLayer.appendChild(el('rect',{x:kind==='external'?498:P.x+P.w,y:Math.min(...ys)-step/2,
              width:kind==='external'?P.x-498:D.x-P.x-P.w,height:Math.max(...ys)-Math.min(...ys)+step,
              fill:'#2563eb','fill-opacity':.035,stroke:'#64748b','stroke-dasharray':'4 5','data-owner':owner}));
          });
        }
      });
    });
    // Source/destination port Y values must not coincide with another run's Y.
    // Near-parallel runs can look merged even when their Y values differ.
    // Reserve eight units from horizontal rows in the same side corridor.
    const usedY={external:model.flows.filter(f=>f.kind==='external').map(f=>port[f.id].py),
      store:model.flows.filter(f=>f.kind==='store').map(f=>port[f.id].py)};
    let externalLane=0,storeLane=0;
    [...model.entities,...model.stores].sort((a,b)=>nodes[a.id].y-nodes[b.id].y).forEach(peer=>{
      const n=nodes[peer.id];
      const flows=model.flows.filter(f=>f.source===peer.id||f.target===peer.id).sort(orderedByPeer);
      const peerRows=[];
      // Reserve incoming heads first; outgoing tails need less edge clearance.
      flows.slice().sort((a,b)=>Number(b.target===peer.id)-Number(a.target===peer.id)).forEach(f=>{
        const i=flows.indexOf(f);
        const preferred=n.y+12+(i+.5)*(n.h-24)/flows.length;
        let sy=null;
        for(let shift=0;shift<=n.h*2 && sy===null;shift++) for(const sign of [1,-1]) {
          const candidate=preferred+sign*shift*.5;
          if(candidate>=n.y+12 && candidate<=n.y+n.h-12 && usedY[f.kind].every(y=>Math.abs(y-candidate)>=8) && (f.target!==peer.id||peerRows.every(y=>Math.abs(y-candidate)>=14))) {sy=candidate;break;}
        }
        if(sy===null)throw new Error('Cannot separate horizontal approach rows for '+f.id);
        usedY[f.kind].push(sy);
        if(f.target===peer.id)peerRows.push(sy);
        const p=port[f.id],external=f.kind==='external';
        const lane=external?200+(externalLane++)*EXTERNAL_LANE_STEP:1452+(storeLane++)*STORE_LANE_STEP;
        const process=nodes[nodes[f.source].kind==='process'?f.source:f.target];
        const from=[external?n.x+n.w:process.x+process.w,external?sy:p.py];
        const to=[external?process.x:n.x,external?p.py:sy];
        let points=[from,[lane,from[1]],[lane,to[1]],to];
        if ((external&&f.source===process.id)||(!external&&f.source===peer.id)) points.reverse();
        const color=external?colors[peer.id]:'#27272a';
        const path=el('path',{class:'diagram-connector','data-flow-id':f.id,d:points.map((v,j)=>(j?'L':'M')+v.join(' ')).join(' '),
          fill:'none',stroke:color,'stroke-width':2.2,'stroke-linejoin':'round','marker-end':'url(#arrow-'+(external?peer.id:'store')+')'});
        const title=el('title');title.textContent=nodes[f.source].name+' → '+f.label+' → '+nodes[f.target].name;path.appendChild(title);paths.appendChild(path);
        const lx=external?700:1289;
        const label=f.label;
        const group=el('g',{class:'diagram-flow-label','data-flow-id':f.id,'data-full-label':f.label});
        const labelText=text(lx,p.py,[label],{'font-size':FONT});group.appendChild(labelText);labels.appendChild(group);
        const maxWidth=external?384:292, rowHeight=(P.h-48)/Math.max(1,p.count-1);
        const size=Math.min(FONT,FONT*maxWidth/labelText.getBBox().width,(rowHeight-1)/1.1);
        labelText.setAttribute('font-size',size);
        const initial=labelText.getBBox();labelText.querySelector('tspan').setAttribute('y',p.py-initial.y-initial.height/2+p.py);
        const box=labelText.getBBox(),width=box.width+2*LABEL_GAP,height=box.height;
        routes.push({...f,points,peer:peer.id,process:process.id,side:external?'left':'right'});
        labelBoxes.push({id:f.id,x:lx-width/2,y:p.py-height/2,w:width,h:height,text:label,fontSize:size});
      });
    });
    orderLanes(routes,paths);
    Object.values(nodes).forEach(n=>{
      const group=el('g',{'data-node-id':n.id,'data-node-kind':n.kind,'data-canonical-name':n.name});
      const title=el('title');title.textContent=n.name;group.appendChild(title);
      group.appendChild(el('rect',{x:n.x,y:n.y,width:n.w,height:n.h,rx:n.kind==='process'?9:0,fill:'#fff',stroke:n.kind==='store'?'none':'#111','stroke-width':2.3}));
      if(n.kind==='process') {
        group.appendChild(el('line',{x1:n.x,y1:n.y+40,x2:n.x+n.w,y2:n.y+40,stroke:'#111','stroke-width':2}));
        group.appendChild(text(n.x+n.w/2,n.y+31,[n.number],{'font-size':29,'font-weight':700}));
      }
      if(n.kind==='store') {
        group.appendChild(el('path',{'data-store-outline':'open-right',d:`M${n.x+n.w} ${n.y} H${n.x} V${n.y+n.h} H${n.x+n.w}`,fill:'none',stroke:'#111','stroke-width':2.3}));
        group.appendChild(el('line',{x1:n.x+n.idw,y1:n.y,x2:n.x+n.idw,y2:n.y+n.h,stroke:'#111','stroke-width':2}));
        group.appendChild(text(n.x+n.idw/2,n.y+n.h/2+9,[n.number],{'font-size':29,'font-weight':700}));
      }
      const x=n.kind==='store'?n.x+n.idw+(n.w-n.idw)/2:n.x+n.w/2;
      group.appendChild(text(x,n.y+n.h/2+(n.kind==='process'?22:9),n.lines,{'font-size':n.kind==='process'?28.8:29,'font-weight':n.kind==='process'?700:500}));
      shapes.appendChild(group);
    });
    const table=document.querySelector('#flow-reference tbody');
    model.flows.forEach(f=>{
      const row=document.createElement('tr');
      [f.id,nodes[f.source].name,f.label,f.label,nodes[f.target].name].forEach(value=>{
        const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);
      });table.appendChild(row);
    });
    window.__level1={model,nodes,routes,labelBoxes,constants:{W,H,E,P,D,FONT,EXTERNAL_LANE_STEP,STORE_LANE_STEP,LABEL_GAP}};
    clearLabelStrokes(svg);
    // Authored geometry is always used by embeds/exports; saved edits affect only
    // the interactive editor, never the PNG or the Google Docs capture.
    if(!output) {
      const authored=svg.cloneNode(true);
      authored.querySelector('[data-routing-guides]').replaceChildren();
      window.SOMADADiagramEditor.init(svg,{storageKey:'dfd-level1-full-labels-v5'});
      svg.querySelectorAll('.diagram-connector-hit').forEach(hit=>hit.removeAttribute('stroke-dasharray'));
      // Ctrl+P and the Print button both print the checked authored geometry,
      // not potentially overlapping edits saved by an individual browser.
      window.addEventListener('beforeprint',()=>svg.replaceWith(authored));
      window.addEventListener('afterprint',()=>authored.replaceWith(svg));
    }
    window.__done=true;
  } catch(error) {
    window.__error=String(error.message||error);
    document.getElementById('stage').textContent='Diagram failed to load: '+window.__error;
    console.error(error);
  }
}());
