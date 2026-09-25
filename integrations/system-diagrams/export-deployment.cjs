// Refresh only deployment artwork and its downloadable PDF collection.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(error,data)=>{
  if(error)return res.writeHead(404).end();
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1600}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/System-Diagrams.html?authored=1');
  await page.waitForFunction(()=>window.__systemDiagramsReady||window.__systemDiagramsError);
  assert.equal(await page.evaluate(()=>window.__systemDiagramsError),undefined);assert.deepEqual(errors,[]);
  const diagram=page.locator('#deployment-view svg');
  const audit=await diagram.evaluate(svg=>{
   const database=svg.querySelector('[data-node="database"]');
   const containers=[...database.children].filter(n=>n.tagName==='rect').map(n=>n.getBBox());
   const inside=(a,b)=>a.x>b.x&&a.y>b.y&&a.x+a.width<b.x+b.width&&a.y+a.height<b.y+b.height;
   return {
    roles:['classrep','faculty','dean','staff','head'].map(role=>{
     const node=svg.querySelector('[data-node="'+role+'"]');
     return {role,desktop:node.querySelectorAll('[data-device-icon="desktop"]').length,mobile:node.querySelectorAll('[data-device-icon="mobile"]').length};
    }),
    stores:[...database.querySelectorAll('[data-store]')].map(g=>({id:g.dataset.store,contained:containers.every(c=>inside(g.getBBox(),c))})),
    text:svg.textContent
   };
  });
  assert(audit.roles.every(r=>r.desktop===1&&r.mobile===1));
  assert.equal(audit.stores.length,11);assert(audit.stores.every(s=>s.contained),'All stores, including D11, fit inside both database containers');
  assert(!/All roles:|One application and one database|AI runs in the backend/.test(audit.text));
  const output=await diagram.evaluate(async source=>{
   const copy=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
   const properties=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style','text-anchor','opacity'];
   clones.forEach((node,i)=>{const style=getComputedStyle(originals[i]);for(const p of properties)node.style.setProperty(p,style.getPropertyValue(p));});
   const width=2400,height=Math.round(width*source.viewBox.baseVal.height/source.viewBox.baseVal.width);
   copy.setAttribute('width',width);copy.setAttribute('height',height);copy.style.removeProperty('width');copy.style.removeProperty('height');
   const svg=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
   try{
    const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);
    return {svg,png:canvas.toDataURL('image/png').split(',')[1]};
   }finally{URL.revokeObjectURL(url);}
  });
  const base=path.join(root,'assets/system-diagrams/deployment');
  fs.writeFileSync(base+'.svg',output.svg);fs.writeFileSync(base+'.png',Buffer.from(output.png,'base64'));
  const ids=await page.locator('.sheet').evaluateAll(nodes=>nodes.map(n=>n.id)),pageNo=ids.indexOf('deployment-view')+1;assert(pageNo>0);
  await page.pdf({path:base+'.pdf',preferCSSPageSize:true,printBackground:true,pageRanges:String(pageNo)});
  await page.pdf({path:path.join(root,'assets/system-diagrams/diagrams.pdf'),preferCSSPageSize:true,printBackground:true});
  await page.locator('#deployment-view').screenshot({path:path.join(root,'assets/system-diagrams/preview-deployment.png')});
  console.log('PASS: desktop/mobile icons on all five client nodes, 11 contained stores and removed footer notes. Refreshed deployment SVG/PNG/PDF and combined PDF.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
