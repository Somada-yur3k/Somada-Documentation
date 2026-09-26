// Complete readable ERD booklet: immutable schema, page references and print QA.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),schema=require('../../assets/erd/model.js'),book=require('../../assets/erd/print-model.js');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fields=schema.tables.flatMap(t=>t.fields.map(f=>t.name+'.'+f.name));
assert.equal(schema.tables.length,25);
assert.deepEqual(book.sheets.flatMap(s=>s.main).sort(),schema.tables.map(t=>t.name).sort(),'Every full table assigned once');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1200}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/ERD-PRINT.html');
  await page.waitForFunction(()=>window.__erdPrintReady);assert.deepEqual(errors,[]);
  assert.equal(await page.locator('.erd-sheet').count(),7);
  assert.equal(await page.locator('[data-full-definition]').count(),25);
  assert.deepEqual(await page.locator('[data-full-definition] [data-field]').evaluateAll(ns=>ns.map(n=>n.closest('[data-table]').dataset.table+'.'+n.dataset.field).sort()),fields.sort());
  assert.equal(await page.locator('[data-fk-relation]').count(),51);
  const details=page.locator('.erd-sheet:not(#erd-print-overview)');
  assert.equal(await details.locator('[data-relationship-row]').count(),51);
  assert.equal(await details.locator('[data-cardinality]').count(),102);
  const relations=await page.evaluate(()=>window.ErdPrintRelations),geometry=await page.evaluate(()=>window.ErdPrintGeometry);
  assert.equal(relations.length,51);
  for(const r of relations){
   const sheet=book.sheets.find(s=>s.main.includes(r.table)),svg=page.locator('#erd-print-'+sheet.id+' svg');
   const row=svg.locator('[data-relationship-row="'+r.id+'"]');
   assert.equal(await row.locator('[data-parent-field]').getAttribute('data-reference'),r.parent+'.'+r.key);
   assert.equal(await row.locator('[data-child-field]').getAttribute('data-reference'),r.table+'.'+r.field);
   for(const [end,kind,value]of [['parent',r.optional?'optional':'one',r.optional?'0..1':'1'],['child',r.one?'optional':'many',r.one?'0..1':'0..*']]){
    const mark=row.locator('[data-end="'+end+'"]');
    assert.equal(await mark.getAttribute('data-cardinality'),kind);
    assert.equal(await mark.locator('[data-cardinality-label]').textContent(),value);
    await mark.hover();assert.equal(await svg.getAttribute('data-active-relation'),r.id);
    assert.equal(await row.getAttribute('class'),'relation-active');
    await page.mouse.move(0,0);
   }
   const expected=[book.sheets.find(s=>s.main.includes(r.parent)).code,sheet.code];
   assert.deepEqual(await row.locator('[data-detail-reference]').evaluateAll(ns=>ns.map(n=>n.dataset.detailReference)),expected);
  }
  assert.deepEqual(await page.locator('[data-overview-table]').evaluateAll(ns=>ns.map(n=>n.textContent).sort()),schema.tables.map(t=>t.name).sort());
  const issues=await page.evaluate(()=>{
   const out=[],overlap=(a,b)=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
   for(const svg of document.querySelectorAll('.erd-sheet svg')){
    const id=svg.dataset.printPage,v=svg.viewBox.baseVal;
    for(const t of svg.querySelectorAll('text')){const b=t.getBBox();if(b.x<0||b.y<0||b.x+b.width>v.width||b.y+b.height>v.height)out.push([id,'text outside',t.textContent]);}
    for(const table of svg.querySelectorAll('[data-full-definition]')){
     const shape=table.querySelector('rect').getBBox(),texts=[...table.querySelectorAll('text')];
     for(const t of texts){const b=t.getBBox();if(b.x<shape.x+2||b.x+b.width>shape.x+shape.width-2||b.y<shape.y||b.y+b.height>shape.y+shape.height)out.push([id,'table text overflow',t.textContent]);}
     for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++)if(overlap(texts[i].getBBox(),texts[j].getBBox()))out.push([id,'table labels overlap',texts[i].textContent,texts[j].textContent]);
    }
    const texts=[...svg.querySelectorAll('text')];
    for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++)if(overlap(texts[i].getBBox(),texts[j].getBBox()))out.push([id,'text overlaps',texts[i].textContent,texts[j].textContent]);
    const marks=[...svg.querySelectorAll('[data-cardinality]')];
    for(let i=0;i<marks.length;i++)for(let j=i+1;j<marks.length;j++)if(overlap(marks[i].getBBox(),marks[j].getBBox()))out.push([id,'cardinalities overlap',marks[i].dataset.relationId,marks[j].dataset.relationId]);
    for(const row of svg.querySelectorAll('[data-relationship-row]')){
     const parent=row.querySelector('[data-parent-field]').getBBox(),child=row.querySelector('[data-child-field]').getBBox();
     if(parent.x+parent.width>290||child.x<390||child.x+child.width>660)out.push([id,'relationship cell overflow',row.dataset.relationshipRow,parent.width,child.width]);
    }
   }return out;
  });
  console.log('Geometry issues:',JSON.stringify(issues,null,2));
  if(process.argv.includes('--preview'))for(const id of ['overview',...book.sheets.map(s=>s.id)])await page.locator('#erd-print-'+id).screenshot({path:path.join(root,'assets/erd/preview-print-'+id+'.png')});
  assert.deepEqual(issues,[]);
  const focus=page.locator('#erd-print-requests [data-relation-id="R17"][data-end="child"]');
  await focus.focus();assert.equal(await page.locator('#erd-print-requests svg').getAttribute('data-active-relation'),'R17');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#erd-print-requests svg').getAttribute('data-active-relation'),null);
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page-level mobile overflow');await page.setViewportSize({width:1440,height:1200});
  if(process.argv.includes('--render')){
   for(const id of ['overview',...book.sheets.map(s=>s.id)]){
    const output=await page.locator('#erd-print-'+id+' svg').evaluate(async source=>{
     const copy=source.cloneNode(true),nodes=[source,...source.querySelectorAll('*')],copies=[copy,...copy.querySelectorAll('*')];
     const props=['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','text-anchor'];
     copies.forEach((n,i)=>{const s=getComputedStyle(nodes[i]);props.forEach(p=>n.style.setProperty(p,s.getPropertyValue(p)));});
     const width=3200,height=Math.round(width*1094/760);copy.setAttribute('width',width);copy.setAttribute('height',height);
     const svg=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
     try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0);return{svg,png:canvas.toDataURL('image/png').split(',')[1]};}finally{URL.revokeObjectURL(url);}
    });
    fs.writeFileSync(path.join(root,'assets/erd/erd-print-'+id+'.svg'),output.svg);
    fs.writeFileSync(path.join(root,'assets/erd/erd-print-'+id+'.png'),Buffer.from(output.png,'base64'));
   }
   const outputDir=path.join(root,'output/pdf');fs.mkdirSync(outputDir,{recursive:true});
   const pdfPath=path.join(outputDir,'erd-a4-readable.pdf');
   await page.pdf({path:pdfPath,preferCSSPageSize:true,printBackground:true});
   const bytes=fs.readFileSync(pdfPath),pdf=bytes.toString('latin1');
   assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,7,'Exactly seven A4 pages');
   const boxes=[...pdf.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/g)];
   assert(boxes.every(m=>Math.abs(Number(m[1])-595.28)<1&&Math.abs(Number(m[2])-841.89)<1),'All PDF pages are A4 portrait');
   fs.writeFileSync(path.join(root,'assets/erd/erd-a4-readable.pdf'),bytes);
  }
  if(process.argv.includes('--pdf-preview')){
   // Inspect the exported PDF itself, not just the browser's SVG rendering.
   const preview=await page.evaluate(async()=>{
    const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    const bytes=new Uint8Array(await(await fetch('assets/erd/erd-a4-readable.pdf')).arrayBuffer());
    const doc=await pdfjs.getDocument({data:bytes}).promise,pages=[];
    const montage=document.createElement('canvas');montage.width=1290;montage.height=1860;
    const ctx=montage.getContext('2d');ctx.fillStyle='#e5e7eb';ctx.fillRect(0,0,montage.width,montage.height);
    for(let i=1;i<=doc.numPages;i++){
     const sheet=await doc.getPage(i),box=sheet.getViewport({scale:1}),viewport=sheet.getViewport({scale:2});
     const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
     await sheet.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
     const x=((i-1)%3)*430+10,y=Math.floor((i-1)/3)*620+25;
     ctx.fillStyle='#000';ctx.font='14px Arial';ctx.fillText('Page '+i,x,y-6);ctx.drawImage(canvas,x,y,410,580);
     pages.push({size:[box.width,box.height],png:canvas.toDataURL('image/png').split(',')[1]});
    }
    return{pages,montage:montage.toDataURL('image/png').split(',')[1]};
   });
   assert.equal(preview.pages.length,7);
   assert(preview.pages.every(p=>Math.abs(p.size[0]-595.28)<1&&Math.abs(p.size[1]-841.89)<1));
   const temp=path.join(root,'tmp/pdfs');fs.mkdirSync(temp,{recursive:true});
   preview.pages.forEach((p,i)=>fs.writeFileSync(path.join(temp,'erd-print-pdf-'+(i+1)+'.png'),Buffer.from(p.png,'base64')));
   fs.writeFileSync(path.join(temp,'erd-print-pdf-montage.png'),Buffer.from(preview.montage,'base64'));
   console.log('Actual PDF rendered: seven A4 portrait pages.');
  }
  if(process.argv.includes('--docs')){
   await page.goto('http://127.0.0.1:'+server.address().port+'/Docs.html',{waitUntil:'load',timeout:120000});
   await page.waitForFunction(()=>document.querySelector('.doc-pages .a4-page-number'),null,{timeout:120000});
   assert.deepEqual(errors,[]);
   assert.equal(await page.locator('.doc-source #erd img').count(),1);
   assert.match(await page.locator('.doc-source #erd img').getAttribute('src'),/erd-a4-complete\.png$/);
   const mainPlacement=await page.locator('.doc-pages img[src*="erd-a4-complete.png"]').evaluate(img=>{
    const sheet=img.closest('.pagedjs_page'),area=sheet.querySelector('.pagedjs_area').getBoundingClientRect(),figure=img.closest('figure'),box=figure.getBoundingClientRect();
    return{width:img.naturalWidth,height:img.naturalHeight,caption:figure.querySelector('figcaption')?.textContent,heading:!!sheet.querySelector('[data-section-id="erd"]'),overflow:box.bottom>area.bottom+1||box.top<area.top-1};
   });
   assert(mainPlacement.width>0&&mainPlacement.height>mainPlacement.width&&mainPlacement.heading&&!mainPlacement.overflow,'Complete portrait image, ERD heading and caption fit together');
   assert.match(mainPlacement.caption,/Figure 10: Entity-Relationship Diagram.*A4 Portrait/);
   assert.equal(await page.locator('.doc-source #erd-appendix img').count(),6);
   const placement=await page.locator('.doc-pages img[src*="erd-print-"]:not([src*="overview"])').evaluateAll(images=>images.map(img=>{
    const sheet=img.closest('.pagedjs_page'),area=sheet.querySelector('.pagedjs_area').getBoundingClientRect(),figure=img.closest('figure'),box=figure.getBoundingClientRect();
    return{src:img.getAttribute('src'),page:sheet.dataset.pageNumber,heightMm:img.getBoundingClientRect().height*25.4/96,
     caption:figure.querySelector('figcaption')?.textContent,complete:img.complete&&img.naturalWidth===3200,
     overflow:box.bottom>area.bottom+1||box.top<area.top-1,
     heading:sheet.querySelector('[data-section-id="erd-appendix"],.erd-detail-heading')?.textContent};
   }));
   console.log('Documentation detail-page placement:',JSON.stringify(placement,null,2));
   assert.equal(placement.length,6);assert.equal(new Set(placement.map(p=>p.page)).size,6,'Each detail image has its own documentation sheet');
   assert(placement.every(p=>p.complete&&p.caption&&p.heading&&!p.overflow),'Each complete image, heading and caption fit together');
   assert(placement.every(p=>p.heightMm>=225),'Print images keep approximately 9 pt field text and 8 pt cardinalities');
   assert.deepEqual(placement.map(p=>Number(p.page)),Array.from({length:6},(_,i)=>Number(placement[0].page)+i),'Six consecutive detail pages');
   const syncSource=fs.readFileSync(path.join(root,'assets/google-doc-sync.js'),'utf8');
   await page.addScriptTag({content:syncSource.replace('window.GoogleDocSync={ open };','window.__collectSyncSection=collectSection;')});
   const captured=await page.evaluate(async()=>{
    const appendix=await window.__collectSyncSection('erd-appendix'),main=await window.__collectSyncSection('erd');
    return{images:appendix.blocks.filter(b=>b.kind==='image').map(b=>({width:b.width,height:b.height,caption:b.caption,png:b.data.startsWith('iVBORw0KGgo')})),breaks:appendix.blocks.filter(b=>b.pageBreakBefore).length,mainImages:main.blocks.filter(b=>b.kind==='image').map(b=>({width:b.width,height:b.height,caption:b.caption,png:b.data.startsWith('iVBORw0KGgo')}))};
   });
   assert.equal(captured.mainImages.length,1);assert.equal(captured.images.length,6);assert.equal(captured.breaks,5);
   assert(captured.mainImages[0].png&&captured.mainImages[0].width===mainPlacement.width&&captured.mainImages[0].height===mainPlacement.height,'Sync captures the same complete portrait PNG');
   assert(captured.images.every(i=>i.width===3200&&i.height===4606&&i.png));
   console.log('PASS: complete portrait ERD plus six A4 appendix pages; seven PNGs available for read-only Google Docs capture. No cloud write.');
   if(process.argv.includes('--preview'))for(const s of book.sheets){const image=page.locator('.doc-pages img[src*="erd-print-'+s.id+'.png"]');await image.locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," pagedjs_page ")][1]').screenshot({path:path.join(root,'assets/erd/preview-docs-'+s.id+'.png')});}
  }
  console.log('PASS: 25 complete tables, '+fields.length+' unchanged fields, 51 exact relationships, 102 detail cardinalities, page references and hover/focus.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
