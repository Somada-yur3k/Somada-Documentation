// Refresh only deployment artwork and its downloadable PDF collection.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),os=require('node:os');
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
   const geometry=window.SystemDeploymentGeometry,issues=[];
   const inside=(a,b,p=2)=>a.x>=b.x+p&&a.y>=b.y+p&&a.x+a.width<=b.x+b.w-p&&a.y+a.height<=b.y+b.h-p;
   const overlap=(a,b)=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
   for(const g of svg.querySelectorAll('[data-container],[data-node]')){
    const parent=g.parentElement.closest('[data-container],[data-node]');
    if(parent){const key=parent.dataset.container||parent.dataset.node;if(!inside(g.getBBox(),geometry.containers[key]))issues.push((g.dataset.container||g.dataset.node)+' outside '+key);}
   }
   const texts=[...svg.querySelectorAll('text')];
   for(const t of texts){const box=t.getBBox(),key=t.dataset.textOwner;
    if(key&&!inside(box,geometry.containers[key],4))issues.push('Text outside '+key+': '+t.textContent);
    if(box.x<3||box.y<3||box.x+box.width>geometry.width-3||box.y+box.height>geometry.height-3)issues.push('Text clipped: '+t.textContent);
   }
   for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++)if(overlap(texts[i].getBBox(),texts[j].getBBox()))issues.push('Overlapping text: '+texts[i].textContent+' / '+texts[j].textContent);
   for(const t of svg.querySelectorAll('[data-connection-label]'))for(const n of svg.querySelectorAll('[data-node]:not([data-client-role])'))if(overlap(t.getBBox(),n.getBBox()))issues.push(t.dataset.connectionLabel+' overlaps node '+n.dataset.node+' or its 3D roof');
   for(const t of svg.querySelectorAll('[data-connection-label]'))for(const route of geometry.connections)for(let i=1;i<route.points.length;i++){
    const a=route.points[i-1],b=route.points[i],box=t.getBBox(),p=8;
    if(a[0]===b[0]&&a[0]>box.x-p&&a[0]<box.x+box.width+p&&Math.max(a[1],b[1])>box.y-p&&Math.min(a[1],b[1])<box.y+box.height+p||a[1]===b[1]&&a[1]>box.y-p&&a[1]<box.y+box.height+p&&Math.max(a[0],b[0])>box.x-p&&Math.min(a[0],b[0])<box.x+box.width+p)issues.push(t.dataset.connectionLabel+' touches a connection');
   }
   for(const route of geometry.connections)for(let i=1;i<route.points.length;i++){
    const a=route.points[i-1],b=route.points[i];
    for(const [key,box]of Object.entries(geometry.containers)){
     if(a[0]===b[0]&&a[0]>box.x+1&&a[0]<box.x+box.w-1&&Math.max(a[1],b[1])>box.y+1&&Math.min(a[1],b[1])<box.y+box.h-1||a[1]===b[1]&&a[1]>box.y+1&&a[1]<box.y+box.h-1&&Math.max(a[0],b[0])>box.x+1&&Math.min(a[0],b[0])<box.x+box.w-1)issues.push(route.key+' crosses '+key);
    }
   }
   if(svg.closest('.sheet').scrollHeight>svg.closest('.sheet').clientHeight+1)issues.push('A4 overflow');
   return {
    roles:['classrep','faculty','dean','staff','head'].map(role=>{
     const node=svg.querySelector('[data-node="'+role+'"]');
     return {role,desktop:node.querySelectorAll('[data-device-icon="desktop"]').length,mobile:node.querySelectorAll('[data-device-icon="mobile"]').length};
    }),
    stores:[...svg.querySelectorAll('[data-store]')].map(g=>({id:g.dataset.store,contained:['database','postgresql','schema'].every(key=>inside(g.getBBox(),geometry.containers[key]))})),
    environments:[...svg.querySelectorAll('[data-environment]')].map(g=>g.dataset.environment).sort(),
    artifacts:[...svg.querySelectorAll('[data-artifact]')].map(g=>g.dataset.artifact).sort(),
    components:[...svg.querySelectorAll('[data-component]')].map(g=>g.dataset.component).sort(),
    connections:geometry.connections.map(c=>c.key).sort(),issues,
    text:svg.textContent.replace(/\s+/g,' ')
   };
  });
  assert(audit.roles.every(r=>r.desktop===1&&r.mobile===1));
  assert.equal(audit.stores.length,11);assert(audit.stores.every(s=>s.contained),'All stores, including D11, fit inside the database, DBMS and schema containers');
  assert.deepEqual(audit.environments,['ai-runtime','browser','node-runtime','postgresql']);
  assert.deepEqual(audit.artifacts,['backend','forecast-model','frontend','rag-chatbot','schema']);
  assert.deepEqual(audit.components,['accounts','administration','borrowing','chatbot','forecast','inventory','reporting','requests','schedule']);
  assert.deepEqual(audit.connections,['application-ai','application-database','clients-application']);
  for(const term of ['Class Representative','Faculty','Dean','Circuit Staff','Physics Staff','Head Lab','Next.js','React','TypeScript','Tailwind CSS','Node.js','PostgreSQL','HTTPS','TLS','AI Chatbot','Inventory Forecasting','RAG','D8 knowledge + live D4 inventory','Model: Gemini 3.5 Flash-Lite','Google Gemini API (Free Tier)','Python / XGBoost (proposed)','n8n: optional workflow automation','Read-only forecasts for review'])assert(audit.text.includes(term),'Missing deployment term: '+term);
  assert(!/Vercel|Runpod|RunPod|Llama|MySQL|AMSI|LLM model \/ provider: pending/.test(audit.text),'No unrelated hosting vendor or stale model/provider placeholder');
  assert(!audit.connections.some(key=>/clients-(database|ai)|ai-database/.test(key)),'Database reads and AI requests remain Backend-controlled');
  assert(!/All roles:|One application and one database|AI runs in the backend/.test(audit.text));
  console.log('Deployment layout issues:',JSON.stringify(audit.issues));assert.deepEqual(audit.issues,[]);
  if(process.argv.includes('--check-only')){console.log('PASS: reference-inspired deployment layout, components, roles, stores and geometry.');return;}
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
  const out=path.join(root,'output/pdf');fs.mkdirSync(out,{recursive:true});
  const standalone=path.join(out,'deployment.pdf'),combined=path.join(out,'diagrams.pdf');
  await page.pdf({path:standalone,preferCSSPageSize:true,printBackground:true,pageRanges:String(pageNo)});
  await page.pdf({path:combined,preferCSSPageSize:true,printBackground:true});
  fs.copyFileSync(standalone,base+'.pdf');fs.copyFileSync(combined,path.join(root,'assets/system-diagrams/diagrams.pdf'));
  await page.locator('#deployment-view').screenshot({path:path.join(root,'assets/system-diagrams/preview-deployment.png')});
  if(process.argv.includes('--pdf-preview')){
   const preview=await page.evaluate(async()=>{
    const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    const outputs=[];
    for(const [file,index]of [['deployment.pdf',1],['diagrams.pdf',12]]){
     const doc=await pdfjs.getDocument({data:new Uint8Array(await(await fetch('output/pdf/'+file)).arrayBuffer())}).promise;
     const page=await doc.getPage(index),box=page.getViewport({scale:1}),view=page.getViewport({scale:2}),canvas=document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
     await page.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;
     outputs.push({file,pages:doc.numPages,size:[box.width,box.height],png:canvas.toDataURL('image/png').split(',')[1]});
    }return outputs;
   });
   const tmp=path.join(root,'tmp/pdfs');fs.mkdirSync(tmp,{recursive:true});
   for(const item of preview){assert.equal(item.pages,item.file==='deployment.pdf'?1:12);assert(Math.abs(item.size[0]-595.28)<1&&Math.abs(item.size[1]-841.89)<1,'Deployment page is A4 portrait');fs.writeFileSync(path.join(tmp,item.file==='deployment.pdf'?'deployment-a4-qa.png':'deployment-combined-a4-qa.png'),Buffer.from(item.png,'base64'));}
   console.log('PASS: actual standalone and combined deployment PDFs rendered as A4 portrait.');
  }
  if(process.argv.includes('--docs')){
   await page.goto('http://127.0.0.1:'+server.address().port+'/Docs.html',{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>document.querySelectorAll('.a4-page-number').length>0,null,{timeout:120000});
   const figure=page.locator('.doc-pages figure').filter({has:page.locator('img[src*="deployment.png"]')});assert.equal(await figure.count(),1,'Single updated Figure 19');
   const a4=figure.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]');assert.equal(await a4.locator('figcaption').filter({hasText:'Figure 19:'}).count(),1,'Caption retained on the deployment page');
   assert(await figure.locator('img').evaluate(img=>img.naturalWidth===2400&&img.getBoundingClientRect().bottom<=img.closest('.pagedjs_area').getBoundingClientRect().bottom+2),'Deployment image fits the Docs A4 content area');
   await a4.screenshot({path:path.join(os.tmpdir(),'deployment-docs-a4-qa.png')});assert.deepEqual(errors,[]);console.log('PASS: updated Figure 19 and caption fit the Docs A4 page.');
  }
  console.log('PASS: shared browser clients, Backend-controlled RAG/XGBoost service boundary and 11 contained stores. Refreshed deployment SVG/PNG/PDF and combined PDF only.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
