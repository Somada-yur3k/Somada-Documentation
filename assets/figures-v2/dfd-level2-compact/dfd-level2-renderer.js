/* Five fixed publication figures, balanced against the current Level 1 model.
 * User-approved exceptions: crossings without junctions; plain labels with only
 * their own stroke interrupted. No grouped parent flows or duplicate nodes. */
(async function(){
  'use strict';
  const params=new URLSearchParams(location.search),output=params.has('embed')||params.has('export');
  const NS='http://www.w3.org/2000/svg',FONT=24,LABEL_GAP=6,LANE_GAP=20;
  let W=2010,H=1486.75;
  document.body.classList.toggle('output-mode',output);
  const entityLines={classrep:['Class Rep.'],faculty:['Faculty'],dean:['Dean'],
    headlab:['Head','Laboratory'],physics:['Physics','Lab Staff'],circuits:['Circuits','Lab Staff']};
  const storeLines={d1:['User','accounts'],d2:['Reservations','& approvals'],d3:['Lab schedule','& usage logs'],
    d4:['Equipment','inventory'],d5:['Borrowing','slip records'],d6:['Clearance','records'],d7:['Daily task','records'],
    d8:['Knowledge','base'],d9:['Chat history'],d10:['Disposal','records']};
  const colors={classrep:'#000000',faculty:'#000000',dean:'#000000',headlab:'#000000',physics:'#000000',circuits:'#000000'};
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

  const childLines={
    p1:[['Validate','Credentials'],['Establish','Role-Scoped','Session'],['Manage Class','Rep. / Faculty','Accounts']],
    p2:[['Retrieve','Availability'],['Validate &','Record','Reservation'],['Route','Approval','Decision'],['Update','Reservation','Status']],
    p3:[['Capture','Signed-In','Inquiry'],['Retrieve','Authorized','Records'],['Compose','Grounded','Answer'],['Record Q&A','Exchange']],
    p4:[['Maintain','Inventory'],['Retrieve','Approved','Reservation'],['Issue Items &','Create Slip'],['Reconcile','Return'],['Record','Disposal'],['Retrieve','Forecast','Inputs'],['Estimate','Next-Month','Needs'],['Present','Inventory','Forecast']],
    p5:[['Maintain','Schedule'],['Record Usage','& Daily Tasks'],['Process','Clearance'],['Compile','Reporting','Metrics'],['Generate','End-Term','Report']]
  };
  const centre=n=>n.y+n.h/2;
  function place(items,targets,height){
    const top=90,bottom=H-85,gap=24;
    const entries=items.map((n,i)=>({...n,desired:targets[n.id],order:i}));
    entries.forEach((n,i)=>n.y=Math.max(top,n.desired-height/2,i?entries[i-1].y+height+gap:top));
    const overflow=entries.at(-1).y+height-bottom;
    if(overflow>0)entries.forEach(n=>n.y-=overflow);
    for(let i=entries.length-2;i>=0;i--)entries[i].y=Math.min(entries[i].y,entries[i+1].y-height-gap);
    if(entries[0].y<top){const delta=top-entries[0].y;entries.forEach(n=>n.y+=delta);}
    return entries;
  }
  try {
    const responses=await Promise.all([fetch('../dfd-level1/dfd-level1-model.json'),fetch('dfd-level2-model.json')]);
    if(responses.some(r=>!r.ok))throw Error('Cannot load DFD flow models.');
    const [parent,models]=await Promise.all(responses.map(r=>r.json()));
    const model=models.find(d=>d.id===params.get('process'))||models[0];
    document.getElementById('picks').replaceChildren(...models.map(d=>{
      const a=document.createElement('a');a.className='pick'+(d.id===model.id?' active':'');a.href='?process='+d.id;
      a.textContent='Process '+d.id.slice(1)+'.0 — '+d.name;return a;
    }));
    const nodes={},routes=[],labelBoxes=[];
    const steps=model.steps.map((name,i)=>({id:model.id+'.'+(i+1),number:model.id.slice(1)+'.'+(i+1),name,lines:childLines[model.id][i]}));
    const counts=steps.flatMap(n=>['external','store'].map(kind=>model.flows.filter(f=>f.kind===kind&&(f.source===n.id||f.target===n.id)).length));
    const P={x:920,w:195,h:Math.max(180,(Math.max(...counts)-1)*36+48)};
    const total=steps.length*P.h+(steps.length-1)*76;
    H=Math.max(H,total+180);
    const first=(H-total)/2;
    steps.forEach((n,i)=>nodes[n.id]={...n,...P,y:first+i*(P.h+76),kind:'process'});
    const peerIds=new Set(model.flows.flatMap(f=>[f.source,f.target]).filter(id=>!nodes[id]));
    const actors=parent.entities.filter(n=>peerIds.has(n.id)),stores=parent.stores.filter(n=>peerIds.has(n.id));
    const targets={};
    [...actors,...stores].forEach(n=>{const links=model.flows.filter(f=>f.source===n.id||f.target===n.id);targets[n.id]=links.reduce((sum,f)=>sum+centre(nodes[f.source===n.id?f.target:f.source]),0)/links.length;});
    const E={x:14,w:170,h:Math.max(170,...actors.map(n=>model.flows.filter(f=>f.source===n.id||f.target===n.id).length*20+20))};
    // Uniform store peers within each figure, sized for its busiest port group.
    const storeX=Math.max(1744,1490+model.flows.filter(f=>f.kind==='store').length*LANE_GAP+30);
    const D={x:storeX,w:250,h:Math.max(120,...stores.map(n=>model.flows.filter(f=>f.source===n.id||f.target===n.id).length*20+20)),idw:64};
    W=Math.max(W,storeX+266);
    // Actor order follows the approved role column; Head Laboratory remains last.
    place(actors,targets,E.h).forEach(n=>nodes[n.id]={...n,...E,kind:'entity',lines:entityLines[n.id]});
    place(stores.slice().sort((a,b)=>targets[a.id]-targets[b.id]),targets,D.h).forEach(n=>nodes[n.id]={...n,...D,kind:'store',lines:storeLines[n.id]});
    const svg=el('svg',{id:'diagram',xmlns:NS,width:1200,height:model.id==='p4'?Math.round(1200*H/W):950,viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Process '+model.id.slice(1)+'.0 — '+model.name});
    svg.appendChild(el('rect',{width:W,height:H,fill:'#fff'}));
    svg.appendChild(el('rect',{x:5,y:58,width:W-10,height:H-112,fill:'none',stroke:'#aaa','stroke-width':1.2}));
    const defs=el('defs');
    Object.entries({...colors,store:'#000000',internal:'#000000'}).forEach(([id,color])=>{
      const marker=el('marker',{id:'arrow-'+id,markerWidth:13,markerHeight:13,refX:12,refY:6,orient:'auto',markerUnits:'userSpaceOnUse'});
      marker.appendChild(el('path',{d:'M0 0 L12 6 L0 12 Z',fill:color}));defs.appendChild(marker);
    });svg.appendChild(defs);
    const paths=el('g'),shapes=el('g'),labels=el('g');svg.append(paths,shapes,labels);
    document.getElementById('stage').replaceChildren(svg);
    const flowPorts={},allY={external:[],store:[]};
    const peer=f=>nodes[nodes[f.source].kind==='process'?f.target:f.source];
    for(const kind of ['external','store']){
      steps.forEach(n=>{
        const own=model.flows.filter(f=>f.kind===kind&&(f.source===n.id||f.target===n.id));
        own.sort((a,b)=>peer(a).y-peer(b).y||model.flows.indexOf(a)-model.flows.indexOf(b));
        own.forEach((f,i)=>{const py=nodes[n.id].y+24+(own.length===1?(P.h-48)/2:i*(P.h-48)/(own.length-1));flowPorts[f.id]={py};allY[kind].push(py);});
      });
      [...actors,...stores].filter(n=>(kind==='external'?actors:stores).includes(n)).forEach(n=>{
        const box=nodes[n.id],process=f=>nodes[f.source===n.id?f.target:f.source];
        const own=model.flows.filter(f=>f.source===n.id||f.target===n.id);
        // User-approved order: highest subprocess first on BOTH peer columns,
        // regardless of direction or distance. Within a subprocess, preserve
        // its approach-port order so paired read/write flows do not swap rows.
        own.sort((a,b)=>process(a).y-process(b).y||flowPorts[a.id].py-flowPorts[b.id].py||model.flows.indexOf(a)-model.flows.indexOf(b));
        let previous=box.y+8;
        own.forEach((f,i)=>{
          const preferred=box.y+20+(i+.5)*(box.h-40)/own.length;let sy=null;
          for(let shift=0;shift<=box.h*2&&sy===null;shift++)for(const sign of [1,-1]){
            const candidate=preferred+sign*shift*.5;
            if(candidate>=previous+14&&candidate>=box.y+12&&candidate<=box.y+box.h-12&&allY[kind].every(y=>Math.abs(y-candidate)>=8)){sy=candidate;break;}
          }
          if(sy===null)throw Error('Cannot separate port rows: '+f.id);
          previous=sy;allY[kind].push(sy);Object.assign(flowPorts[f.id],{sy,peer:n.id,process:process(f).id,peerOrder:i});
        });
      });
    }
    // Mirror lanes across BOTH axes: a peer above the process needs the
    // opposite staircase from a peer below it. Arrow direction is unchanged.
    // Keep upward/downward geometric runs in separate lane bands.
    const processOrder=(a,b)=>flowPorts[a.id].py-flowPorts[b.id].py;
    const left=model.flows.filter(f=>f.kind==='external').sort(processOrder);
    const right=model.flows.filter(f=>f.kind==='store').sort(processOrder);
    const laneById={};
    function assignLanes(flows,start,isLeft){
      const below=flows.filter(f=>flowPorts[f.id].sy>flowPorts[f.id].py);
      const above=flows.filter(f=>flowPorts[f.id].sy<=flowPorts[f.id].py);
      const ordered=isLeft?below.concat(above.reverse()):above.concat(below.reverse());
      ordered.forEach((f,i)=>laneById[f.id]=start+i*LANE_GAP);
    }
    assignLanes(left,200,true);
    assignLanes(right,1490,false);
    function draw(f,points,lx,ly,label,colorKey,side){
      const path=el('path',{class:'diagram-connector','data-flow-id':f.id,d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:'#000000','stroke-width':2.2,'marker-end':'url(#arrow-'+colorKey+')'});
      const title=el('title');title.textContent=f.label;path.appendChild(title);paths.appendChild(path);
      const group=el('g',{class:'diagram-flow-label','data-flow-id':f.id,'data-full-label':f.label});
      const parts=[label];
      if(side==='internal'){
        const words=label.split(' '),middle=Math.ceil(words.length/2);
        if(words.length>1)parts.splice(0,1,words.slice(0,middle).join(' '),words.slice(middle).join(' '));
      }
      const t=text(lx,ly,parts,{'font-size':FONT,'data-line-height':25});group.appendChild(t);labels.appendChild(group);
      const maxWidth=side==='internal'?136:side==='left'?396:326;
      t.setAttribute('font-size',Math.min(FONT,FONT*maxWidth/t.getBBox().width));
      const initial=t.getBBox(),offset=ly-initial.y-initial.height/2;
      t.querySelectorAll('tspan').forEach(span=>span.setAttribute('y',Number(span.getAttribute('y'))+offset));
      const b=t.getBBox();labelBoxes.push({id:f.id,x:b.x-LABEL_GAP,y:b.y-2,w:b.width+2*LABEL_GAP,h:b.height+4});
      routes.push({...f,points,side,...flowPorts[f.id]});
    }
    model.flows.forEach(f=>{
      const {py,sy,peer:peerId,process:processId}=flowPorts[f.id],n=nodes[peerId],p=nodes[processId],lane=laneById[f.id],external=f.kind==='external';
      let points=external?[[n.x+n.w,sy],[lane,sy],[lane,py],[p.x,py]]:[[p.x+p.w,py],[lane,py],[lane,sy],[n.x,sy]];
      if((external&&f.source===p.id)||(!external&&f.source===n.id))points.reverse();
      draw(f,points,external?700:1297,py,f.label,external?peerId:'store',external?'left':'right');
    });
    model.internal.forEach(f=>{
      const a=nodes[f.source],b=nodes[f.target],y=(a.y+a.h+b.y)/2,x1=P.x+10,x2=P.x+P.w-10;
      draw(f,[[x1,a.y+a.h],[x1,y],[x2,y],[x2,b.y]],(x1+x2)/2,y,f.label,'internal','internal');
    });
    Object.values(nodes).forEach(n=>{
      const group=el('g',{'data-node-id':n.id,'data-node-kind':n.kind});
      group.appendChild(el('rect',{x:n.x,y:n.y,width:n.w,height:n.h,rx:n.kind==='process'?9:0,fill:'#fff',stroke:n.kind==='store'?'none':'#111','stroke-width':2.3}));
      if(n.kind==='process'){
        group.appendChild(el('line',{x1:n.x,y1:n.y+40,x2:n.x+n.w,y2:n.y+40,stroke:'#111','stroke-width':2}));
        group.appendChild(text(n.x+n.w/2,n.y+31,[n.number],{'font-size':29,'font-weight':700}));
      }
      if(n.kind==='store'){
        group.appendChild(el('path',{'data-store-outline':'open-right',d:`M${n.x+n.w} ${n.y} H${n.x} V${n.y+n.h} H${n.x+n.w}`,fill:'none',stroke:'#111','stroke-width':2.3}));
        group.appendChild(el('line',{x1:n.x+n.idw,y1:n.y,x2:n.x+n.idw,y2:n.y+n.h,stroke:'#111','stroke-width':2}));
        group.appendChild(text(n.x+n.idw/2,n.y+n.h/2+9,[n.number],{'font-size':29,'font-weight':700}));
      }
      const x=n.kind==='store'?n.x+n.idw+(n.w-n.idw)/2:n.x+n.w/2;
      group.appendChild(text(x,n.y+n.h/2+(n.kind==='process'?22:9),n.lines,{'font-size':n.kind==='process'?27:29,'font-weight':n.kind==='process'?700:500}));shapes.appendChild(group);
    });
    const tbody=document.querySelector('#flow-reference tbody');
    [...model.flows,...model.internal].forEach(f=>{
      const row=document.createElement('tr');[f.parentFlow||'Internal',nodes[f.source].name,f.label,f.label,nodes[f.target].name].forEach(value=>{const td=document.createElement('td');td.textContent=value;row.appendChild(td);});tbody.appendChild(row);
    });
    document.getElementById('heading').textContent='DFD Level 2 — Process '+model.id.slice(1)+'.0';
    clearLabelStrokes(svg);
    window.__level2={model,parent,nodes,routes,labelBoxes,constants:{W,H,P,E,D,FONT,LANE_GAP}};
    if(!output){
      const authored=svg.cloneNode(true);window.SOMADADiagramEditor.init(svg,{storageKey:'dfd-level2-traceability-'+model.id+'-full-labels-v9'});
      svg.querySelectorAll('.diagram-connector-hit').forEach(hit=>hit.removeAttribute('stroke-dasharray'));
      window.addEventListener('beforeprint',()=>svg.replaceWith(authored));window.addEventListener('afterprint',()=>authored.replaceWith(svg));
    }
    window.__done=true;
  }catch(error){window.__error=String(error.message||error);document.getElementById('stage').textContent=window.__error;console.error(error);}
}());
