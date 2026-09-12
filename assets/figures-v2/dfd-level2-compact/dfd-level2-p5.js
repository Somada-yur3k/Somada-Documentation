/* Legacy renderer, no longer loaded. Use dfd-level2-renderer.js and
 * dfd-level2-model.json for the active five-figure publication.
 * Process 5 publication layout. The larger authoring coordinates reserve
 * separate label bays; the publication frame remains exactly 1200 x 950.
 * Crossings are allowed by the project owner, never shared segments or ports. */
(function(){
  const previousRender=render;
  const aliases={'Schedule / Usage Record':'Schedule / usage rec.','Schedule / Usage Data':'Schedule / usage data',
    'Reservation Summary':'Reservation totals','Inventory Summary':'Inventory totals','Borrowing Summary':'Borrowing totals',
    'Daily Task Record':'Daily task record','Daily Task Data':'Daily task data','Disposal Summary':'Disposal totals'};
  render=function(index){
    if(DATA[index].id!=='p5'){document.querySelector('#diagram').setAttribute('viewBox','0 0 1200 950');previousRender(index);return;}
    const data=DATA[index],svg=document.querySelector('#diagram'),boxes={},routes=[],labels=[];
    svg.replaceChildren();svg.setAttribute('viewBox','0 0 1600 1266.666667');
    const make=(tag,attrs={},parent=svg,value)=>{const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(value!==undefined)el.textContent=value;parent.appendChild(el);return el;};
    const text=(parent,x,y,lines,size=22,weight=400)=>{
      const el=make('text',{'text-anchor':'middle','font-family':'Arial, sans-serif','font-size':size,'font-weight':weight,fill:'#111'},parent);
      lines.forEach((line,i)=>make('tspan',{x,y:y+(i-(lines.length-1)/2)*(size+4)},el,line));return el;
    };
    make('rect',{width:1600,height:1267,fill:'#fff'});
    make('rect',{x:10,y:62,width:1580,height:1190,fill:'none',stroke:'#777','stroke-width':1.5});
    text(svg,800,35,['Process 5.0 — Manage Laboratory Administration & Reporting'],28,700);
    const defs=make('defs'),marker=make('marker',{id:'p5-arrow',markerWidth:8,markerHeight:8,refX:7,refY:3.5,orient:'auto',markerUnits:'userSpaceOnUse'},defs);
    make('path',{d:'M0 0 L7 3.5 L0 7 Z',fill:'#333'},marker);
    const paths=make('g'),nodes=make('g'),labelLayer=make('g');
    const actorLines=[['Class','Representative'],['Head','Laboratory'],['Physics','Laboratory Staff'],['Circuits','Laboratory Staff']];
    const actorY=[690,900,330,510];
    data.actors.forEach((name,i)=>boxes['e'+i]={id:'e'+i,kind:'entity',name,x:20,y:actorY[i],w:190,h:160,lines:actorLines[i]});
    const steps=[['Maintain','Schedule'],['Record Usage &','Head Lab Tasks'],['Process','Clearance'],['Compile','Reporting Metrics'],['Generate','End-Term Report']];
    data.steps.forEach((name,i)=>boxes['p'+i]={id:'p'+i,kind:'process',name,x:680,y:90+i*235,w:240,h:160,lines:steps[i],number:'5.'+(i+1)});
    const storeY=[645,125,790,935,430,280,1080],storeLines=[['Reservation &','approval records'],['Lab schedule','& usage logs'],['Equipment','inventory'],['Borrowing slip','records'],['Clearance','records'],['Daily task','records'],['Disposal','records']];
    data.stores.forEach(([number,name],i)=>boxes['d'+i]={id:'d'+i,kind:'store',name,number,x:1370,y:storeY[i],w:210,h:120,lines:storeLines[i]});
    const key=v=>typeof v==='number'?'p'+v:v;
    const flows=[...data.left,...data.right].map(([a,b,label],i)=>({id:'p5-flow-'+i,source:key(a),target:key(b),label,side:i<data.left.length?'left':'right'}));
    const cy=n=>n.y+n.h/2;
    const usedY=new Set();
    for(const side of ['left','right']){
      const list=flows.filter(f=>f.side===side),peer=f=>boxes[f.source[0]==='p'?f.target:f.source],process=f=>boxes[f.source[0]==='p'?f.source:f.target];
      for(const n of Object.values(boxes)){
        const own=list.filter(f=>f.source===n.id||f.target===n.id);
        own.sort((a,b)=>n.kind==='process'?cy(peer(a))-cy(peer(b))||flows.indexOf(a)-flows.indexOf(b):Math.abs(cy(process(a))-cy(n))-Math.abs(cy(process(b))-cy(n))||flows.indexOf(a)-flows.indexOf(b));
        const padding=n.kind==='process'?4:20;
        own.forEach((f,i)=>{let y=n.y+padding+(i+.5)*(n.h-2*padding)/own.length;while(usedY.has(y))y+=.17;usedY.add(y);f[n.kind==='process'?'py':'sy']=y;});
      }
      // Shorter entity routes get the outer/right lane. Every X is distinct.
      list.sort((a,b)=>side==='left'?cy(peer(a))-cy(peer(b))||Math.abs(a.py-a.sy)-Math.abs(b.py-b.sy):cy(peer(a))-cy(peer(b))||flows.indexOf(a)-flows.indexOf(b));
      list.forEach((f,i)=>{
        const n=peer(f),p=process(f),lane=side==='left'?358-i*16:1210+i*16;
        let points=side==='left'?[[n.x+n.w,f.sy],[lane,f.sy],[lane,f.py],[p.x,f.py]]:[[p.x+p.w,f.py],[lane,f.py],[lane,f.sy],[n.x,f.sy]];
        if((side==='left'&&f.source===p.id)||(side==='right'&&f.source===n.id))points.reverse();
        draw(f,points,side==='left'?520:1060,f.py,aliases[f.label]||f.label,22);
      });
    }
    // These two child exchanges are actual dependencies, not a generic workflow
    // chain through independent clearance work. The dogleg reserves a label bay.
    [[0,1,'Schedule data'],[3,4,'Report metrics']].forEach(([a,b,label],i)=>{
      const upper=boxes['p'+a],lower=boxes['p'+b],y=(upper.y+upper.h+lower.y)/2;
      draw({id:'p5-internal-'+i,source:upper.id,target:lower.id,label,side:'internal'},[[720,upper.y+upper.h],[720,y],[880,y],[880,lower.y]],800,y,label,18);
    });
    function draw(f,points,x,y,label,size){
      const group=make('g',{'data-flow-id':f.id,class:'dfd-flow'},paths);
      const path=make('path',{class:'flow-line',d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:'#333','stroke-width':2,'marker-end':'url(#p5-arrow)'},group);
      const g=make('g',{'data-flow-id':f.id},labelLayer),t=text(g,x,y+size*.32,[label],size),b=t.getBBox();
      make('title',{},g,f.label);
      const gap={x:b.x-4,y:b.y-2,w:b.width+8,h:b.height+4};
      let distance=0,dash=[];
      points.slice(1).forEach((end,i)=>{const start=points[i],length=Math.hypot(end[0]-start[0],end[1]-start[1]);
        if(start[1]===end[1]&&start[1]>=gap.y&&start[1]<=gap.y+gap.h&&Math.min(start[0],end[0])<=gap.x&&Math.max(start[0],end[0])>=gap.x+gap.w){const before=Math.min(Math.abs(gap.x-start[0]),Math.abs(gap.x+gap.w-start[0]));dash=[distance+before,gap.w];}distance+=length;
      });
      if(dash.length)path.setAttribute('stroke-dasharray',dash.concat(distance-dash[0]-dash[1]+1,0).join(' '));
      routes.push({...f,points});labels.push({...gap,id:f.id});
      const highlight=active=>{paths.querySelectorAll('.dfd-flow').forEach(el=>el.style.opacity=active&&el!==group?.18:1);labelLayer.querySelectorAll(':scope > g').forEach(el=>el.style.opacity=active&&el!==g?.18:1);};
      [group,g].forEach(el=>{el.addEventListener('pointerenter',()=>highlight(true));el.addEventListener('pointerleave',()=>highlight(false));});
    }
    Object.values(boxes).forEach(n=>{
      const g=make('g',{'data-node-id':n.id},nodes);
      make('rect',{x:n.x,y:n.y,width:n.w,height:n.h,rx:n.kind==='process'?8:0,fill:'#fff',stroke:'#111','stroke-width':2},g);
      if(n.kind==='process'){make('line',{x1:n.x,y1:n.y+35,x2:n.x+n.w,y2:n.y+35,stroke:'#111'},g);text(g,n.x+n.w/2,n.y+26,[n.number],24,700);}
      if(n.kind==='store'){make('line',{x1:n.x+42,y1:n.y,x2:n.x+42,y2:n.y+n.h,stroke:'#111'},g);text(g,n.x+21,n.y+n.h/2+7,[n.number],20,700);}
      text(g,n.x+n.w/2+(n.kind==='store'?21:0),n.y+n.h/2+(n.kind==='process'?22:7),n.lines,n.kind==='store'?20:24,n.kind==='process'?700:400);
    });
    text(svg,800,1235,['Daily Task actions: Head Laboratory only. Crossings without dots are not junctions.'],20);
    document.querySelector('#heading').textContent='DFD Level 2 — Process 5.0';
    document.querySelectorAll('.pick').forEach((button,i)=>button.classList.toggle('active',i===index));
    window.__p5={boxes,routes,labels};
  };
  render(chosen);
}());
