// Refresh current sequence artwork and PDFs without rewriting unrelated diagrams.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),models=require('../../assets/system-diagrams/sequence-models.js');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1600}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/System-Diagrams.html?authored=1');
  await page.waitForFunction(()=>window.__systemDiagramsReady||window.__systemDiagramsError);
  assert.equal(await page.evaluate(()=>window.__systemDiagramsError),undefined);assert.deepEqual(errors,[]);
  await require('./check-sequences.cjs').checkPage(page);
  const ids=await page.locator('.sheet').evaluateAll(nodes=>nodes.map(n=>n.id)),pages=[];
  const swimOnly=process.argv.includes('--swimlane');
  for(const model of swimOnly?[{id:'system'}]:models){
   const sheetId=swimOnly?'activity-system':'sequence-'+model.id;
   const pageNo=ids.indexOf(sheetId)+1;assert(pageNo>0);pages.push(pageNo);
   const output=await page.locator('#'+sheetId+' svg').evaluate(async source=>{
    const copy=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
    const properties=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style','text-anchor','opacity'];
    clones.forEach((node,i)=>{const style=getComputedStyle(originals[i]);for(const property of properties)node.style.setProperty(property,style.getPropertyValue(property));});
    const width=2400,height=Math.round(width*source.viewBox.baseVal.height/source.viewBox.baseVal.width);
    copy.setAttribute('width',width);copy.setAttribute('height',height);copy.style.removeProperty('width');copy.style.removeProperty('height');
    const svg=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);return{svg,png:canvas.toDataURL('image/png').split(',')[1]};}finally{URL.revokeObjectURL(url);}
   });
   const base=path.join(root,'assets/system-diagrams/'+(swimOnly?'swimlane-system':'sequence-'+model.id));
   fs.writeFileSync(base+'.svg',output.svg);fs.writeFileSync(base+'.png',Buffer.from(output.png,'base64'));
   await page.pdf({path:base+'.pdf',preferCSSPageSize:true,printBackground:true,pageRanges:String(pageNo)});
  }
  if(!swimOnly)await page.pdf({path:path.join(root,'assets/system-diagrams/sequences.pdf'),preferCSSPageSize:true,printBackground:true,pageRanges:pages.join(',')});
  await page.pdf({path:path.join(root,'assets/system-diagrams/diagrams.pdf'),preferCSSPageSize:true,printBackground:true});
  if(!swimOnly)await page.locator('#sequence-p2').screenshot({path:path.join(root,'assets/system-diagrams/preview-sequence.png')});
  console.log(swimOnly?'Updated swimlane artwork and combined PDF.':'Updated five title-free sequence diagrams, their PDF/PNG/SVG exports and combined PDFs.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
