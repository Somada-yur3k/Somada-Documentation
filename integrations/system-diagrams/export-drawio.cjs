// Native, editable draw.io copies of the current published diagrams (ERD excluded).
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const zlib = require('node:zlib'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Eurika/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'output/drawio'), qa = path.join(root, 'tmp/drawio-all-qa');
const entries = [
  { id: 'use-case', name: 'Use Case', url: 'assets/figures-v2/usecase-diagram-source.html?export=1' },
  { id: 'dfd-level-0', name: 'DFD Level 0 - Context', url: 'assets/figures-v2/dfd-level0/dfd-level0-source.html?export=1' },
  { id: 'dfd-level-1', name: 'DFD Level 1', url: 'assets/figures-v2/dfd-level1/dfd-level1-source.html?export=1' },
  ...[1,2,3,4,5].map(i => ({ id: `dfd-level-2-p${i}`, name: `DFD Level 2 - Process ${i}.0`, url: `assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process=p${i}&export=1` })),
  ...[1,2,3,4,5].map(i => ({ id: `activity-p${i}`, name: `Activity - Process ${i}.0`, svg: `assets/system-diagrams/activity-p${i}.svg` })),
  { id: 'swimlane-system', name: 'Whole-System Swimlane', svg: 'assets/system-diagrams/swimlane-system.svg' },
  ...[1,2].map(i => ({ id: `sequence-whole-${i}`, name: `Whole-System Sequence - Page ${i}`, svg: `assets/system-diagrams/sequence-whole-${i}.svg` })),
  { id: 'deployment', name: 'Deployment', svg: 'assets/system-diagrams/deployment.svg' },
  ...[1,2,3,4,5].map(i => ({ id: `sequence-p${i}`, name: `Process Sequence - ${i}.0`, svg: `assets/system-diagrams/sequence-p${i}.svg` }))
];
const esc = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'&#xa;');
const attrs = values => Object.entries(values).map(([key,value]) => `${key}="${esc(value)}"`).join(' ');
const n = value => +Number(value).toFixed(5);
const color = value => !value || value === 'none' || value === 'transparent' ? 'none' : value.startsWith('rgb') ? '#' + value.match(/[\d.]+/g).slice(0,3).map(v => Math.round(+v).toString(16).padStart(2,'0')).join('') : value;
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://local').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,data) => { if(error) return res.writeHead(404).end(); res.writeHead(200,{'Content-Type':({'.html':'text/html','.svg':'image/svg+xml','.js':'text/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)] || 'application/octet-stream'}).end(data); });
});

// Extract only visible SVG artwork. Browser CSS resolution preserves published
// fonts/colors; matrices are flattened into original viewBox coordinates.
async function capture(page, entry, base) {
  if (entry.url) {
    await page.goto(base + '/' + entry.url);
    await page.waitForFunction(() => window.__done || window.__error, null, { timeout: 60000 });
    const error = await page.evaluate(() => window.__error);
    if(error) throw new Error(error);
  } else {
    await page.setContent('<html><body style="margin:0">' + fs.readFileSync(path.join(root,entry.svg),'utf8') + '</body></html>');
  }
  return page.evaluate(() => {
    const svg = document.querySelector('#stage svg') || document.querySelector('svg');
    if (!svg) throw new Error('Diagram has no SVG');
    svg.querySelectorAll('.diagram-connector-hit,.diagram-handle-layer').forEach(element => element.remove());
    const view = svg.viewBox.baseVal;
    svg.style.width = view.width + 'px'; svg.style.height = view.height + 'px'; svg.style.maxHeight = 'none';
    const groupSelector = 'g[data-activity-node],g[data-swimlane-node],g[data-node-id],g[data-node],g[data-participant],g[data-container],g[data-environment],g[data-artifact],g[data-component],g[data-store]';
    const allGroups = [...svg.querySelectorAll(groupSelector)], ids = new Map(allGroups.map((element,index) => [element,`g${index}`]));
    const matrix = element => svg.getCTM().inverse().multiply(element.getCTM());
    const point = (m,x,y) => ({x:m.a*x+m.c*y+m.e, y:m.b*x+m.d*y+m.f});
    const box = element => { const b=element.getBBox(), m=matrix(element), corners=[point(m,b.x,b.y),point(m,b.x+b.width,b.y),point(m,b.x,b.y+b.height),point(m,b.x+b.width,b.y+b.height)]; return {x:Math.min(...corners.map(p=>p.x)),y:Math.min(...corners.map(p=>p.y)),width:Math.max(...corners.map(p=>p.x))-Math.min(...corners.map(p=>p.x)),height:Math.max(...corners.map(p=>p.y))-Math.min(...corners.map(p=>p.y))}; };
    const metadata = element => Object.fromEntries([...element.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value]));
    const parent = element => { const g=element.parentElement?.closest(groupSelector); return ids.get(g)||'1'; };
    const items=[];
    for(const element of svg.querySelectorAll('g,rect,circle,ellipse,line,polygon,polyline,path,text')) {
      if(element.closest('defs,marker,clipPath,mask') || element.closest('[data-highlight-layer]')) continue;
      const style=getComputedStyle(element); if(style.display==='none'||style.visibility==='hidden'||+style.opacity===0)continue;
      if(element.localName==='g') { if(ids.has(element))items.push({id:ids.get(element),tag:'group',box:box(element),parent:parent(element),meta:metadata(element)}); continue; }
      const m=matrix(element), transform=[m.a,m.b,m.c,m.d,m.e,m.f];
      const common={parent:parent(element),meta:metadata(element),transform,fill:style.fill,stroke:style.stroke,strokeWidth:parseFloat(style.strokeWidth),dash:style.strokeDasharray,opacity:style.opacity,fillOpacity:style.fillOpacity,strokeOpacity:style.strokeOpacity,markerEnd:style.markerEnd,markerStart:style.markerStart};
      if(element.localName==='text') {
        const lines=element.querySelectorAll('tspan').length ? [...element.querySelectorAll('tspan')] : [element];
        for(const line of lines) {
          if(!line.textContent.trim())continue;
          const s=getComputedStyle(line);
          items.push({...common,id:`v${items.length}`,tag:'text',box:box(line),text:line.textContent,fontSize:parseFloat(s.fontSize)*Math.hypot(m.a,m.b),fontFamily:s.fontFamily,fontWeight:s.fontWeight,fontStyle:s.fontStyle,fill:s.fill});
        }
      } else items.push({...common,id:`v${items.length}`,tag:element.localName,box:box(element),attributes:Object.fromEntries([...element.attributes].map(a=>[a.name,a.value]))});
    }
    return {width:view.width,height:view.height,items};
  });
}

// Parse SVG commands into a native draw.io stencil, preserving curves and
// compound paths. Simple open strokes become editable mxGraph connectors.
function parsePath(d, transform, bounds) {
  const tokens=d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];
  const sizes={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};
  let i=0, command='',x=0,y=0,sx=0,sy=0,lastControl=null,lastCommand='',moves=0,closed=false;
  const commands=[],points=[];
  const p=(a,b)=>({x:transform[0]*a+transform[2]*b+transform[4]-bounds.x,y:transform[1]*a+transform[3]*b+transform[5]-bounds.y});
  const add=(tag, values)=>commands.push(`<${tag} ${attrs(Object.fromEntries(Object.entries(values).map(([k,v])=>[k,n(v)])))}/>`);
  while(i<tokens.length) {
    if(/^[a-zA-Z]$/.test(tokens[i]))command=tokens[i++];
    const upper=command.toUpperCase(),relative=command!==upper,size=sizes[upper];
    if(size===undefined)throw new Error('Unsupported path command '+command);
    if(upper==='Z'){commands.push('<close/>');x=sx;y=sy;closed=true;command='';lastCommand='Z';continue;}
    const a=tokens.slice(i,i+size).map(Number);i+=size;if(a.length!==size||a.some(Number.isNaN))throw new Error('Invalid SVG path');
    const coord=(ix,iy)=>[a[ix]+(relative?x:0),a[iy]+(relative?y:0)];
    let dest;
    if(upper==='M'||upper==='L'){dest=coord(0,1);const q=p(...dest);add(upper==='M'?'move':'line',q);if(upper==='M'){sx=dest[0];sy=dest[1];moves++;}points.push({x:q.x+bounds.x,y:q.y+bounds.y});}
    if(upper==='H'||upper==='V'){dest=upper==='H'?[a[0]+(relative?x:0),y]:[x,a[0]+(relative?y:0)];const q=p(...dest);add('line',q);points.push({x:q.x+bounds.x,y:q.y+bounds.y});}
    if(upper==='C'||upper==='S'){
      const first=upper==='C'?coord(0,1):['C','S'].includes(lastCommand)&&lastControl?[2*x-lastControl[0],2*y-lastControl[1]]:[x,y];
      const second=coord(upper==='C'?2:0,upper==='C'?3:1);dest=coord(upper==='C'?4:2,upper==='C'?5:3);
      const q1=p(...first),q2=p(...second),q3=p(...dest);add('curve',{x1:q1.x,y1:q1.y,x2:q2.x,y2:q2.y,x3:q3.x,y3:q3.y});lastControl=second;
    }
    if(upper==='Q'||upper==='T'){
      const control=upper==='Q'?coord(0,1):['Q','T'].includes(lastCommand)&&lastControl?[2*x-lastControl[0],2*y-lastControl[1]]:[x,y];dest=upper==='Q'?coord(2,3):coord(0,1);
      const q1=p(...control),q2=p(...dest);add('quad',{x1:q1.x,y1:q1.y,x2:q2.x,y2:q2.y});lastControl=control;
    }
    if(upper==='A'){dest=coord(5,6);const q=p(...dest);add('arc',{rx:a[0]*Math.hypot(transform[0],transform[1]),ry:a[1]*Math.hypot(transform[2],transform[3]),'x-axis-rotation':a[2],'large-arc-flag':a[3],'sweep-flag':a[4],x:q.x,y:q.y});}
    if(!['M','L','H','V'].includes(upper)){const q=p(...dest);points.push({x:q.x+bounds.x,y:q.y+bounds.y});}
    x=dest[0];y=dest[1];lastCommand=upper;if(upper==='M')command=relative?'l':'L';
  }
  return {commands:commands.join(''),points,moves,closed,curves:/[CQSTA]/i.test(d)};
}
function convert(data,entry) {
  const groups=new Map(data.items.filter(item=>item.tag==='group').map(item=>[item.id,item]));
  const semantic=new Map();
  for(const group of groups.values())for(const key of ['data-activity-node','data-swimlane-node','data-node-id','data-node'])if(group.meta[key])semantic.set(group.meta[key],group);
  const cells=['<mxCell id="0"/>','<mxCell id="1" parent="0"/>'];let textCount=0,edgeCount=0,shapeCount=0;
  const rootBox={x:0,y:0};
  const point=(a,t)=>({x:t[0]*a[0]+t[2]*a[1]+t[4],y:t[1]*a[0]+t[3]*a[1]+t[5]});
  for(const item of data.items){
    const b={...item.box}, parent=groups.get(item.parent)?.box||rootBox;
    let style='html=0;shadow=0;',value=item.text||'',edge=false,points,extra='';
    if(item.tag==='group')style+='group;shape=rectangle;fillColor=none;strokeColor=none;container=1;collapsible=0;recursiveResize=1;pointerEvents=0;';
    else {
      const fill=color(item.fill),stroke=color(item.stroke);
      style+=`fillColor=${fill};strokeColor=${stroke};strokeWidth=${item.strokeWidth||0};opacity=${+item.opacity*100};fillOpacity=${+item.fillOpacity*100};strokeOpacity=${+item.strokeOpacity*100};`;
      if(item.dash&&item.dash!=='none')style+='dashed=1;dashPattern='+item.dash.match(/[\d.]+/g).map(v=>n(+v/(item.strokeWidth||1))).join(' ')+';';
      if(item.tag==='text'){
        style+=`text;fillColor=none;strokeColor=none;fontColor=${fill};fontFamily=Arial;fontSize=${n(item.fontSize)};fontStyle=${(+item.fontWeight>=600?1:0)+(item.fontStyle==='italic'?2:0)};align=left;verticalAlign=middle;spacing=0;whiteSpace=nowrap;overflow=visible;`;
        b.width+=3;textCount++;
      } else if(item.tag==='rect')style+=`shape=rectangle;rounded=${+item.attributes.rx>0?1:0};absoluteArcSize=1;arcSize=${n(2*(+item.attributes.rx||0))};`;
      else if(item.tag==='circle'||item.tag==='ellipse')style+='shape=ellipse;';
      else {
        let d=item.attributes.d;
        if(item.tag==='line'){d=`M${item.attributes.x1||0} ${item.attributes.y1||0} L${item.attributes.x2||0} ${item.attributes.y2||0}`;}
        if(item.tag==='polygon'||item.tag==='polyline'){
          const pairs=(item.attributes.points.match(/[-+]?[\d.]+(?:e[-+]?\d+)?/ig)||[]).map(Number);
          d=pairs.reduce((s,v,i)=>i%2?s:s+(i?' L':'M')+v+' '+pairs[i+1],'')+(item.tag==='polygon'?' Z':'');
        }
        const parsed=parsePath(d,item.transform,b);
        const marked=(item.markerEnd&&item.markerEnd!=='none')||(item.markerStart&&item.markerStart!=='none');
        edge=parsed.moves===1&&!parsed.closed&&(fill==='none'||item.tag==='line')&&(!parsed.curves||marked);
        if(edge){
          points=parsed.points;
          const orthogonal=points.slice(1).every((p,i)=>Math.abs(p.x-points[i].x)<0.01||Math.abs(p.y-points[i].y)<0.01);
          style+=`edgeStyle=${orthogonal?'orthogonalEdgeStyle':'none'};${orthogonal?'orthogonal=1;':'noEdgeStyle=1;'}rounded=${parsed.curves?1:0};endArrow=${item.markerEnd&&item.markerEnd!=='none'?'classic':'none'};startArrow=${item.markerStart&&item.markerStart!=='none'?'classic':'none'};endSize=6;startSize=6;`;
          const source=semantic.get(item.meta['data-control-from']), target=semantic.get(item.meta['data-control-to']);
          for(const [node,prefix,p] of [[source,'exit',points[0]],[target,'entry',points.at(-1)]]) {
            if(node&&node.box.width&&node.box.height){extra+=` ${prefix==='exit'?'source':'target'}="${node.id}"`;style+=`${prefix}X=${n((p.x-node.box.x)/node.box.width)};${prefix}Y=${n((p.y-node.box.y)/node.box.height)};${prefix}Perimeter=0;`;}
          }
          edgeCount++;
        } else {
          const stencil=`<shape w="${Math.max(b.width,0.01)}" h="${Math.max(b.height,0.01)}" aspect="variable" strokewidth="inherit"><foreground><path>${parsed.commands}</path><${fill==='none'?'stroke':stroke==='none'?'fill':'fillstroke'}/></foreground></shape>`;
          style+='shape=stencil('+zlib.deflateRawSync(Buffer.from(encodeURIComponent(stencil))).toString('base64')+');';
        }
      }
      if(item.tag!=='text'&&!edge)shapeCount++;
    }
    const metadata={id:item.id,label:value,...item.meta};
    if(edge){
      const pts=points.map(p=>({x:n(p.x-parent.x),y:n(p.y-parent.y)}));
      cells.push(`<object ${attrs(metadata)}><mxCell edge="1" parent="${item.parent}" style="${esc(style)}"${extra}><mxGeometry relative="1" as="geometry"><mxPoint ${attrs(pts[0])} as="sourcePoint"/><mxPoint ${attrs(pts.at(-1))} as="targetPoint"/><Array as="points">${pts.slice(1,-1).map(p=>`<mxPoint ${attrs(p)}/>`).join('')}</Array></mxGeometry></mxCell></object>`);
    }else cells.push(`<object ${attrs(metadata)}><mxCell vertex="1" parent="${item.parent}" style="${esc(style)}"><mxGeometry ${attrs({x:n(b.x-parent.x),y:n(b.y-parent.y),width:n(Math.max(b.width,0.01)),height:n(Math.max(b.height,0.01))})} as="geometry"/></mxCell></object>`);
  }
  const landscape=data.width>data.height,pw=landscape?1169:827,ph=landscape?827:1169;
  const scale=Math.ceil(Math.max(data.width/pw,data.height/ph)*100)/100;
  const graph=`<mxGraphModel grid="0" guides="1" tooltips="1" connect="1" arrows="1" fold="0" page="1" pageScale="${scale}" pageWidth="${pw}" pageHeight="${ph}" background="#ffffff"><root>${cells.join('\n')}</root></mxGraphModel>`;
  return {graph,summary:{id:entry.id,name:entry.name,source:entry.url||entry.svg,width:data.width,height:data.height,texts:textCount,shapes:shapeCount,connectors:edgeCount,groups:groups.size,images:0}};
}
async function verify(page,xml,data,entry){
  await page.setContent('<html><body style="margin:0;background:white"><div id="canvas" style="position:relative"></div></body></html>');
  await page.evaluate(()=>{window.mxLoadResources=false;window.mxLoadStylesheets=false;});
  await page.addScriptTag({path:path.join(root,'tmp/drawio-qa/mxClient.js')});
  await page.addScriptTag({path:path.join(root,'tmp/drawio-qa/Shapes.js')});
  const result=await page.evaluate(({xml,data})=>{
    const doc=mxUtils.parseXml(xml);if(doc.querySelector('parsererror'))throw new Error('Invalid draw.io XML');
    const graph=new mxGraph(document.getElementById('canvas'));
    graph.isSpecialColor=()=>-1;
    graph.convertValueToString=c=>c.value?.nodeType===1?c.value.getAttribute('label')||'':c.value||'';
    // Stencil definitions are compressed exactly as in the draw.io editor.
    const original=mxCellRenderer.prototype.createShape;
    mxCellRenderer.prototype.createShape=function(state){
      const name=state.style.shape;
      if(name?.startsWith('stencil(')){
        const decoded=decodeURIComponent(pako.inflateRaw(Uint8Array.from(atob(name.slice(8,-1)),c=>c.charCodeAt(0)),{to:'string'}));
        return new mxShape(new mxStencil(mxUtils.parseXml(decoded).documentElement));
      }
      return original.apply(this,arguments);
    };
    new mxCodec(doc).decode(doc.documentElement,graph.model);graph.refresh();
    const cells=Object.values(graph.model.cells), rendered=data.items.filter(item=>graph.view.getState(graph.model.getCell(item.id)));
    const labels=cells.filter(c=>c.value?.getAttribute?.('label')).map(c=>c.value.getAttribute('label'));
    const sourceLabels=data.items.filter(item=>item.tag==='text').map(item=>item.text);
    const missingText=sourceLabels.filter(label=>!labels.includes(label));
    const bounds=graph.getGraphBounds();
    graph.view.scaleAndTranslate(Math.min(1,1100/data.width),0,0);
    document.getElementById('canvas').style.width=data.width*graph.view.scale+'px';
    document.getElementById('canvas').style.height=data.height*graph.view.scale+'px';
    return {cells:cells.length-2,rendered:rendered.length,expected:data.items.length,missingText,bounds:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height}};
  },{xml,data});
  assert.equal(result.rendered,result.expected,entry.id+' has missing shapes');assert.deepEqual(result.missingText,[]);
  await page.locator('#canvas').screenshot({path:path.join(qa,entry.id+'.png')});return result;
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});fs.mkdirSync(qa,{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const capturePage=await browser.newPage(),renderPage=await browser.newPage();
    // pako is already included in the official draw.io MCP package cache.
    const npmCache=path.join(process.env.LOCALAPPDATA,'npm-cache/_npx');
    const pako=fs.readdirSync(npmCache).map(dir=>path.join(npmCache,dir,'node_modules/pako/dist/pako.min.js')).find(file=>fs.existsSync(file));
    assert.ok(pako,'pako is required to verify editable path stencils');
    await renderPage.addInitScript({path:pako});
    const diagrams=[],report=[];
    for(const entry of entries){
      const data=await capture(capturePage,entry,'http://127.0.0.1:'+server.address().port);
      const converted=convert(data,entry);
      const diagram=`<diagram id="${entry.id}" name="${esc(entry.name)}">${converted.graph}</diagram>`;
      const file=`<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net">${diagram}</mxfile>`;
      fs.writeFileSync(path.join(output,entry.id+'.drawio'),file);
      // setContent does not run init scripts, so load the cached library explicitly.
      const originalAddScript=renderPage.addScriptTag.bind(renderPage);
      renderPage.addScriptTag=async options=>{const result=await originalAddScript(options);if(options.path.endsWith('Shapes.js'))await originalAddScript({path:pako});return result;};
      const validation=await verify(renderPage,converted.graph,data,entry);
      renderPage.addScriptTag=originalAddScript;
      diagrams.push(diagram);report.push({...converted.summary,validation});
      console.log(entry.name+': '+converted.summary.texts+' editable text lines, '+converted.summary.shapes+' shapes, '+converted.summary.connectors+' connectors');
    }
    fs.writeFileSync(path.join(output,'all-system-diagrams.drawio'),`<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net">${diagrams.join('\n')}</mxfile>`);
    fs.writeFileSync(path.join(qa,'report.json'),JSON.stringify(report,null,2));
    console.log('Completed '+diagrams.length+' editable pages; ERD excluded.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
