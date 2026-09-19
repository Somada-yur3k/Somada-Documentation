// Build trusted source snapshots. Generated files contain no credentials.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(p,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(p)]||'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const base='http://127.0.0.1:'+server.address().port+'/';
  await page.goto(base+'Docs.html?workspace-source=1');await page.waitForSelector('.doc-source #uc-login',{state:'attached'});
  const doc=await page.evaluate(()=>{
   const source=document.querySelector('.doc-source'),fields=[],counts={};
   source.querySelectorAll('h1,h2,h3,h4,h5,p,th,td,li').forEach(el=>{
    if(el.querySelector('p,li,table')||el.closest('#toc,.doc-footer')||!el.textContent.trim())return;
    const section=el.closest('section[id]')?.id||'cover';const n=counts[section]=(counts[section]||0)+1;
    const id=section+':'+n;el.dataset.workspaceField=id;
    fields.push({id,section,tag:el.tagName,text:el.textContent.trim(),table:!!el.closest('table'),hint:el.closest('tr')?.querySelector('th')?.textContent.trim()||el.tagName});
   });
   return{fields,html:source.innerHTML};
  });
  const html=read('Docs.html'),data=vm.runInNewContext(html.match(/<script>\s*\/\*[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'')+'; DATA');
  const ucSource=read('assets/figures-v2/usecase-diagram-source.html');const uc=vm.runInNewContext(ucSource.slice(ucSource.indexOf('const ACTORS ='),ucSource.indexOf('const CANVAS_W'))+';({ACTORS,BASE_UC,SUPPORT_UC,RELATIONSHIPS})');
  const specs=[['usecase','Use Case','assets/figures-v2/usecase-diagram-source.html?export=1'],['dfd0','DFD Level 0','assets/figures-v2/dfd-level0/dfd-level0-source.html?export=1'],['dfd1','DFD Level 1','assets/figures-v2/dfd-level1/dfd-level1-source.html?export=1'],...[1,2,3,4,5].map(n=>['dfd2-p'+n,'DFD Level 2 · Process '+n,'assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process=p'+n+'&export=1'])];
  const diagrams=[];
  for(const [id,name,url]of specs){
   await page.goto(base+url);await page.waitForFunction(()=>window.__done||window.__error);
   const captured=await page.evaluate(()=>{
    if(window.__error)throw Error(window.__error);const svg=document.querySelector('#stage svg,svg');
    const clone=svg.cloneNode(true);clone.querySelectorAll('[data-routing-guides],.diagram-hit-target,.diagram-handle').forEach(n=>n.remove());
    return{svg:clone.outerHTML,l0:window.__level0?.flows,l1:window.__level1?.model,l2:window.__level2?.model,nodes:window.__level2?.nodes};
   });
   let items=[],parent;
   if(id==='usecase'){
    items=[...uc.BASE_UC,...uc.SUPPORT_UC].map(n=>({kind:'node',id:n.id,key:'node:'+n.id,label:n.label.join(' ')}));
    for(const a of uc.ACTORS)for(const to of a.uses)items.push({kind:'flow',id:'association-'+a.id+'-'+to,key:'flow:association-'+a.id+'-'+to,source:a.id,target:to,label:a.label?.join(' ')||a.id});
    uc.RELATIONSHIPS.forEach((r,i)=>items.push({kind:'flow',id:'relationship-'+i,key:'flow:relationship-'+i,source:r.from,target:r.to,label:r.type}));
   }else{
    const flows=captured.l0||captured.l1?.flows||[...captured.l2.flows,...captured.l2.internal];
    items=flows.map(f=>({...f,kind:'flow',key:'flow:'+f.id}));parent=captured.l2?.id;
   }
   diagrams.push({id,name,parent,svg:captured.svg,items});
  }
  const seed={version:1,fields:doc.fields,html:doc.html,diagrams,links:data.useCases.map(u=>({diagramId:u.diagramId,docId:u.id,title:u.title}))};
  seed.seedId=crypto.createHash('sha256').update(JSON.stringify(seed)).digest('hex');
  fs.writeFileSync(path.join(root,'assets/workspace-seed.json'),JSON.stringify(seed));
  console.log('Workspace seed built:',seed.fields.length,'text fields,',diagrams.length,'diagrams.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
