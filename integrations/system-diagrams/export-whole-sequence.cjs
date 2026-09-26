// Refresh the two-page overview without overwriting the five detailed diagrams.
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
  await page.goto('http://127.0.0.1:'+server.address().port+'/Sequence-Overview.html');
  await page.waitForFunction(()=>window.__wholeSequenceReady);
  assert.equal(await page.evaluate(()=>window.__systemDiagramsError),undefined);assert.deepEqual(errors,[]);
  await require('./check-whole-sequence.cjs').checkPage(page);
  for(const index of [1,2]){
  const diagram=page.locator('#sequence-whole-'+index+' svg');
  const output=await diagram.evaluate(async source=>{
   const copy=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
   const properties=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','font-style','text-anchor','opacity'];
   clones.forEach((node,i)=>{const style=getComputedStyle(originals[i]);for(const p of properties)node.style.setProperty(p,style.getPropertyValue(p));});
   const width=3600,height=Math.round(width*source.viewBox.baseVal.height/source.viewBox.baseVal.width);
   copy.setAttribute('width',width);copy.setAttribute('height',height);copy.style.removeProperty('width');copy.style.removeProperty('height');
   const svg=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
   try{
    const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);
    return {svg,png:canvas.toDataURL('image/png').split(',')[1]};
   }finally{URL.revokeObjectURL(url);}
  });
  const base=path.join(root,'assets/system-diagrams/sequence-whole-'+index);
  fs.writeFileSync(base+'.svg',output.svg);fs.writeFileSync(base+'.png',Buffer.from(output.png,'base64'));
  console.log('Exported page '+index,await diagram.getAttribute('viewBox'));
  }
  const out=path.join(root,'output/pdf');fs.mkdirSync(out,{recursive:true});
  const pdfPath=path.join(out,'sequence-whole.pdf');
  await page.pdf({path:pdfPath,preferCSSPageSize:true,printBackground:true});
  fs.copyFileSync(pdfPath,path.join(root,'assets/system-diagrams/sequence-whole.pdf'));
  if(process.argv.includes('--pdf-preview')){
   const rendered=await page.evaluate(async()=>{
    const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    const bytes=new Uint8Array(await(await fetch('output/pdf/sequence-whole.pdf')).arrayBuffer());
    const doc=await pdfjs.getDocument({data:bytes}).promise,images=[];
    for(let i=1;i<=doc.numPages;i++){
     const page=await doc.getPage(i),box=page.getViewport({scale:1}),view=page.getViewport({scale:2}),canvas=document.createElement('canvas');
     canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
     await page.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;
     images.push({width:box.width,height:box.height,png:canvas.toDataURL('image/png').split(',')[1]});
    }
    return images;
   });
   assert.equal(rendered.length,2,'Two-page sequence PDF');
   const qa=path.join(root,'tmp/pdfs');fs.mkdirSync(qa,{recursive:true});
   rendered.forEach((image,i)=>{
    assert(Math.abs(image.width-595.28)<1&&Math.abs(image.height-841.89)<1,'A4 portrait sequence page');
    fs.writeFileSync(path.join(qa,'sequence-whole-'+(i+1)+'-a4-qa.png'),Buffer.from(image.png,'base64'));
   });
   console.log('PASS: actual two-page PDF rendered; both pages are A4 portrait.');
  }
  console.log('Exported two-page whole-system sequence PDF; retained five detailed diagrams.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
