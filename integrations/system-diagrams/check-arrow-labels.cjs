// Focused label typography, real geometry, image exports and document figures.
// Run --render for the five Activity SVG/PNG images; no cloud writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1600,height:1600}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/System-Diagrams.html?authored=1');
 await page.waitForFunction(()=>window.__systemDiagramsReady||window.__systemDiagramsError);assert.equal(await page.evaluate(()=>window.__systemDiagramsError),undefined);assert.deepEqual(errors,[]);
 for(const id of ['system','p1','p2','p3','p4','p5']){
  const sheet=page.locator('#activity-'+id),svg=sheet.locator('svg');
  const audit=await svg.evaluate((svg,id)=>{
   const g=id==='system'?window.SystemSwimlaneGeometry:window.SystemActivityGeometry[id],issues=[];
   const rect=b=>({x:b.x,y:b.y,w:b.width??b.w,h:b.height??b.h}),pad=(b,p)=>({x:b.x-p,y:b.y-p,w:b.w+2*p,h:b.h+2*p});
   const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
   const distance=(a,b)=>Math.hypot(Math.max(a.x-b.x-b.w,b.x-a.x-a.w,0),Math.max(a.y-b.y-b.h,b.y-a.y-a.h,0));
   const segments=g.routes.flatMap(r=>r.points.slice(1).map((b,i)=>{const a=r.points[i];return{r,box:{x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),w:Math.abs(a[0]-b[0]),h:Math.abs(a[1]-b[1])}};}));
   const labels=[...svg.querySelectorAll('[data-flow-label]')].map(t=>({t,box:rect(t.getBBox())}));let maxGap=0,minGap=Infinity;
   for(const s of segments)for(const [name,n] of Object.entries(g.nodes))if(name!==s.r.from&&name!==s.r.to&&overlap(s.box,n))issues.push('Arrow '+s.r.from+'/'+s.r.to+' crosses '+name);
   for(const {t,box} of labels){
    const key=t.dataset.flowLabel;
    const expectedFont=id==='system'?32:21;
    if(getComputedStyle(t).fontSize!==expectedFont+'px')issues.push(key+' is not '+expectedFont+' px');
    if(id==='system'&&getComputedStyle(t).fontWeight!=='700')issues.push(key+' is not bold');
    if(t.textContent.replace(/\s+/g,' ').trim()!==t.dataset.labelText.replace(/\s+/g,' ').trim())issues.push(key+' changed wording');
    if(/[\[\]]/.test(t.textContent))issues.push(key+' displays brackets');
    if(box.x<7||box.y<7||box.x+box.w>g.width-7||box.y+box.h>g.height-7)issues.push(key+' clipped');
    for(const x of g.laneBounds||[])if(box.x-9<x&&box.x+box.w+9>x)issues.push(key+' touches lane divider');
    for(const s of segments)if(overlap(pad(box,9),s.box))issues.push(key+' touches line '+s.r.from+'/'+s.r.to);
    for(const [name,n] of Object.entries(g.nodes)){
     // Rectangle/diamond intersection, rather than the diamond's empty corners.
     const hit=n.kind==='decision'?Math.max(box.x-n.x-n.w/2,n.x+n.w/2-box.x-box.w,0)/(n.w/2+8)+Math.max(box.y-n.y-n.h/2,n.y+n.h/2-box.y-box.h,0)/(n.h/2+8)<1:overlap(box,pad(n,4));
     if(hit)issues.push(key+' too close to '+name);
    }
    const owned=segments.filter(s=>s.r.from===t.dataset.labelFrom&&s.r.to===t.dataset.labelTo&&s.r.guard===(t.dataset.labelGuard||null));
    if(owned.length){const gap=Math.min(...owned.map(s=>distance(box,s.box)));maxGap=Math.max(maxGap,gap);minGap=Math.min(minGap,gap);if(gap>44.25||gap<9.75)issues.push(key+' not near its own arrow: '+gap);}
   }
   for(let i=0;i<labels.length;i++)for(const b of labels.slice(i+1))if(overlap(labels[i].box,pad(b.box,6)))issues.push(labels[i].t.dataset.flowLabel+' collides with '+b.t.dataset.flowLabel);
   if(svg.closest('.sheet').scrollHeight>svg.closest('.sheet').clientHeight+1)issues.push('A4 overflow');
   return{count:labels.length,minGap,maxGap,issues:[...new Set(issues)]};
  },id);
  console.log(id,JSON.stringify(audit));assert.deepEqual(audit.issues,[]);assert(audit.count>0);
  await sheet.screenshot({path:path.join(os.tmpdir(),'arrow-labels-'+id+'.png')});
  if(process.argv.includes('--render')&&id!=='system'){
   const output=await svg.evaluate(async source=>{
    const copy=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
    const props=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style','text-anchor','opacity'];
    clones.forEach((n,i)=>{const s=getComputedStyle(originals[i]);for(const p of props)n.style.setProperty(p,s.getPropertyValue(p));});
    const width=2400,height=Math.round(width*source.viewBox.baseVal.height/source.viewBox.baseVal.width);copy.setAttribute('width',width);copy.setAttribute('height',height);copy.style.removeProperty('width');copy.style.removeProperty('height');
    const svg=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{const image=new Image();image.src=url;await image.decode();const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0);return{svg,png:c.toDataURL('image/png').split(',')[1]};}finally{URL.revokeObjectURL(url);}
   });
   fs.writeFileSync(path.join(root,'assets/system-diagrams/activity-'+id+'.svg'),output.svg);fs.writeFileSync(path.join(root,'assets/system-diagrams/activity-'+id+'.png'),Buffer.from(output.png,'base64'));
   await sheet.screenshot({path:path.join(root,'assets/system-diagrams/preview-activity-'+id+'.png')});
  }
 }
 if(process.argv.includes('--pdf-preview')){
  const preview=await page.evaluate(async()=>{
   const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
   const bytes=new Uint8Array(await(await fetch('output/pdf/diagrams.pdf')).arrayBuffer()),doc=await pdfjs.getDocument({data:bytes}).promise,out=[];
   for(let i=1;i<=6;i++){const p=await doc.getPage(i),box=p.getViewport({scale:1}),v=p.getViewport({scale:2.5}),c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;out.push({page:i,size:[box.width,box.height],png:c.toDataURL('image/png').split(',')[1]});}
   return{pages:doc.numPages,out};
  });assert.equal(preview.pages,12);
  const dir=path.join(root,'tmp/pdfs');fs.mkdirSync(dir,{recursive:true});
  for(const p of preview.out){assert(Math.abs(p.size[0]-595.28)<1&&Math.abs(p.size[1]-841.89)<1);fs.writeFileSync(path.join(dir,'arrow-labels-page-'+p.page+'.png'),Buffer.from(p.png,'base64'));}
 }
 if(process.argv.includes('--docs')){
  await page.goto('http://127.0.0.1:'+server.address().port+'/Docs.html',{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>document.querySelectorAll('.a4-page-number').length>0,null,{timeout:120000});
  for(const [i,name] of ['activity-p1','activity-p2','activity-p3','activity-p4','activity-p5','swimlane-system'].entries()){
   const fig=page.locator('.doc-pages figure').filter({has:page.locator('img[src*="'+name+'.png"]')});assert.equal(await fig.count(),1,name);
   const a4=fig.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]');assert.equal(await a4.locator('figcaption').filter({hasText:'Figure '+(11+i)+':'}).count(),1,'Caption retained');
   assert(await fig.locator('img').evaluate(img=>img.naturalWidth>0&&img.getBoundingClientRect().bottom<=img.closest('.pagedjs_area').getBoundingClientRect().bottom+2),'Figure fits A4: '+name);
  }assert.deepEqual(errors,[]);console.log('Docs Figures 11-16: updated images, captions and A4 fit verified.');
 }
 console.log('PASS: Swimlane uses 32 px bold; five Activity Diagrams retain 21 px arrow labels, close to their own arrows without touching shapes, lines or other labels.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
