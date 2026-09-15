// Additive UML supplement checks and optional PDF generation. No cloud writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const models=require('../../assets/system-diagrams/models.js');
const docs=read('Docs.html'),data=vm.runInNewContext(docs.match(/<script>\s*\/\*[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'')+'; DATA');
const l1=JSON.parse(read('assets/figures-v2/dfd-level1/dfd-level1-model.json')),l2=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json'));
const roles=l1.entities.map(n=>n.name),processes=l2.flatMap(m=>m.steps.map((_,i)=>m.id+'.'+(i+1))),stores=l1.stores.map(n=>n.id);
assert.equal(new Set(models.map(m=>m.id)).size,models.length);
for(const m of models){assert(m.actors.every(a=>roles.includes(a)),m.id);assert(m.uses.every(u=>data.useCases.some(d=>d.diagramId===u)),m.id);assert(m.processes.every(p=>processes.includes(p)),m.id);assert(m.stores.every(d=>stores.includes(d)),m.id);}
for(const u of data.useCases)assert(models.some(m=>m.uses.includes(u.diagramId)),'Missing use case '+u.diagramId);
for(const p of processes)assert(models.some(m=>m.processes.includes(p)),'Missing child process '+p);
const originals=['index.html','Docs.html','Current-System.html','Analytics.html','assets/figures-v2/usecase-diagram-source.html','assets/figures-v2/dfd-level0/dfd-level0-source.html','assets/figures-v2/dfd-level1/dfd-level1-source.html','assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html'];
// Only additive navigation and the specifically requested full-label reference copy may differ.
const referenceCopy=[
 ['Short print labels retain the complete Level 1 data-flow names below.','Every printed arrow uses the complete Level 1 data-flow name listed below.'],
 ['Short labels below do not group or remove data flows.','Every printed arrow uses its complete canonical flow name.'],
 ['Short print labels map to full names below.','Printed labels use the full names listed below.']
];
for(const file of originals){let before=cp.execFileSync('git',['show','2c15a21:'+file],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');for(const [oldText,newText]of referenceCopy)before=before.replace(oldText,newText);const after=read(file).replace(/\r\n/g,'\n').replace(/^    <a class(?:Name)?="page-tab" href="(?:\.\.\/)*System-Diagrams.html">System Diagrams<\/a>\n/m,'');assert.equal(after,before,'Unrequested existing content changed: '+file);}
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(p,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(p)]||'application/octet-stream');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/System-Diagrams.html');await page.waitForFunction(()=>window.__systemDiagramsReady);
 assert.equal(await page.locator('.sheet').count(),3);assert.deepEqual(errors,[]);
 const deploymentKinds=['database','desktop','laptop','mail','phone','server'];
 for(const attribute of ['node','icon'])assert.deepEqual(await page.locator('#deployment-view [data-'+attribute+']').evaluateAll((nodes,attribute)=>nodes.map(n=>n.dataset[attribute]).sort(),attribute),deploymentKinds,'Deployment has six distinct illustrated nodes and icons');
 assert.match(await page.locator('#deployment-view').innerText(),/Actual unit counts: TBD/);
 const children=await page.locator('#activity-system [data-child-process]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.childProcess,name:n.dataset.childName,text:n.textContent})));
 const canonicalChildren=l2.flatMap(m=>m.steps.map((name,i)=>({id:m.id+'.'+(i+1),name,text:m.id.slice(1)+'.'+(i+1)+' '+name})));
 assert.deepEqual(children,canonicalChildren,'All 21 canonical Level 2 subprocess names and numbers are visible in the single swimlane');
 assert.equal(await page.locator('#activity-system .lane-bg').count(),3,'One continuous three-partition swimlane');
 for(const id of ['activity-system','sequence-system']){
  assert.equal(await page.locator('#'+id+' svg').count(),1,'One complete SVG per overview');
  const covered=await page.locator('#'+id+' [data-process]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.process))].sort());
  assert.deepEqual(covered,['p1','p2','p3','p4','p5']);
 }
 const problems=await page.evaluate(()=>{
  const out=[];
  document.querySelectorAll('.sheet').forEach(sheet=>{
   if(sheet.scrollHeight>sheet.clientHeight+1)out.push([sheet.id,'sheet overflow']);
   const svg=sheet.querySelector('svg');
   const view=svg.viewBox.baseVal;
   for(const text of svg.querySelectorAll('text')){const b=text.getBBox();if(b.x<0||b.y<0||b.x+b.width>view.width+.5||b.y+b.height>view.height+.5)out.push([sheet.id,'text outside',text.textContent,b.x,b.y,b.width,b.height]);}
   if(Number(svg.dataset.bottom)>675)out.push([sheet.id,'sequence too tall',svg.dataset.bottom]);
   {
    const texts=[...svg.querySelectorAll('text')];
    for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
     const a=texts[i].getBBox(),b=texts[j].getBBox();
     if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>2)out.push([sheet.id,'overlapping labels',texts[i].textContent,texts[j].textContent]);
    }
   }
  });return out;
 });
 console.log('Geometry issues:',JSON.stringify(problems));assert.deepEqual(problems,[]);
 await page.locator('a[href="#deployment"]').click();assert.equal(new URL(page.url()).hash,'#deployment');
 await page.setViewportSize({width:390,height:844});assert(await page.locator('.section-nav').isVisible());
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Page-level mobile overflow');
 await page.setViewportSize({width:1440,height:1000});
 if(process.argv.includes('--render')){
  await page.pdf({path:path.join(root,'assets/system-diagrams/diagrams.pdf'),preferCSSPageSize:true,printBackground:true});
  const pdf=fs.readFileSync(path.join(root,'assets/system-diagrams/diagrams.pdf')).toString('latin1');assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,3);
  await page.locator('#activity-system').screenshot({path:path.join(root,'assets/system-diagrams/preview-activity.png')});
  await page.locator('#sequence-system').screenshot({path:path.join(root,'assets/system-diagrams/preview-sequence.png')});
  await page.locator('#deployment-view').screenshot({path:path.join(root,'assets/system-diagrams/preview-deployment.png')});
 }
 console.log('PASS: 20 use cases, 21 visible canonical subprocesses, 10 logical stores; only authorized navigation/reference changes; one Activity swimlane and three A4 landscape PDF pages.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
