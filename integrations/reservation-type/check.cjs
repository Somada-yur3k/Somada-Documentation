const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {prepare}=require('../../assets/reservation-type.js'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..');
const account={role:'Class Representative',account_id:'rep',student_id:'s1',group_id:'c1',group_student_ids:['s1','s2']};
for(const schedule_type of ['ON_SCHEDULE','OUT_OF_SCHEDULE']){
 for(const invalid of [undefined,'','OTHER'])assert.throws(()=>prepare({schedule_type,reservation_type:invalid},account),/Reservation Type/);
 const group=prepare({schedule_type,reservation_type:'GROUP',student_ids:['s1','s2']},account);
 const single=prepare({schedule_type,reservation_type:'STUDENT_ONLY',student_ids:['s2','outside']},account);
 assert.equal(group.reservation_type,'GROUP');assert.deepEqual(single.student_ids,['s1']);assert.equal(single.reservation_type,'STUDENT_ONLY');
 assert.deepEqual(group.approval_route,single.approval_route);assert.equal(group.group_id,single.group_id);
 assert.throws(()=>prepare({schedule_type,reservation_type:'GROUP',student_ids:['outside']},account),/assigned class/);
 assert.throws(()=>prepare({schedule_type,reservation_type:'GROUP',student_ids:[]},account),/group/);
 const faculty=prepare({schedule_type},{...account,role:'Faculty'});assert.equal(faculty.reservation_type,null);
 assert.deepEqual(faculty.approval_route,schedule_type==='ON_SCHEDULE'?[]:['Dean']);
}
const model=require('../../assets/erd/model.js');assert.deepEqual(model.tables.find(t=>t.name==='RESERVATION').fields.find(f=>f.name==='reservation_type').values,['GROUP','STUDENT_ONLY']);
const l1=JSON.parse(fs.readFileSync(path.join(root,'assets/figures-v2/dfd-level1/dfd-level1-model.json'))),l2=JSON.parse(fs.readFileSync(path.join(root,'assets/figures-v2/dfd-level2-compact/dfd-level2-model.json')));
for(const id of ['p2-cr-onschedule','p2-cr-outschedule','p2-d2-write','p2-d2-read']){
 const f=l1.flows.find(f=>f.id===id);assert.match(f.label,/Reservation Type/);for(const child of l2.find(p=>p.id==='p2').flows.filter(c=>c.parentFlow===id))assert.equal(child.label,f.label);
}
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(p,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:'+server.address().port+'/';
 await page.goto(base+'Reservation-Form.html');
 for(const schedule of ['ON_SCHEDULE','OUT_OF_SCHEDULE']){
  await page.locator(`[data-schedule="${schedule}"]`).click();assert.equal(await page.locator('[name=reservation_type]:checked').count(),0);
  await page.locator('button[type=submit]').click();assert.equal(await page.locator('#result').isVisible(),false);assert.equal(await page.locator('[name=reservation_type]').first().evaluate(n=>n.validity.valueMissing),true);
  await page.locator('[value=GROUP]').check();assert(await page.locator('#group-info').isVisible());await page.locator('button[type=submit]').click();assert.match(await page.locator('#result').textContent(),/"reservation_type": "GROUP"/);
  await page.locator('[value=STUDENT_ONLY]').check();assert(!await page.locator('#group-info').isVisible());assert(await page.locator('#group-info').evaluate(n=>n.disabled));await page.locator('button[type=submit]').click();const record=await page.locator('#result').textContent();assert.match(record,/STUDENT_ONLY/);assert(!record.includes('member-2'));
 }
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1440,height:1600});
 await page.goto(base+'System-Diagrams.html?authored=1');await page.waitForFunction(()=>window.SystemActivityGeometry?.p2&&window.SystemSwimlaneGeometry,{},{timeout:20000});
 if(errors.length)throw Error(errors.join('\n'));
 await require('../system-diagrams/check-sequences.cjs').checkPage(page);
 const activity=await page.evaluate(()=>window.SystemActivityGeometry.p2),swim=await page.evaluate(()=>window.SystemSwimlaneGeometry);
 for(const [id,n] of Object.entries(activity.nodes)){
  const incoming=activity.routes.filter(r=>r.to===id),outgoing=activity.routes.filter(r=>r.from===id);
  if(n.kind==='decision'){assert.equal(incoming.length,1,id+' is a decision, not a merge');assert(outgoing.length>=2&&outgoing.every(r=>r.guard));}
  if(n.kind==='merge'){assert(incoming.length>=2);assert.equal(outgoing.length,1);}
  if(n.kind==='action'){assert.equal(incoming.length,1);assert.equal(outgoing.length,1);}
 }
 for(const geometry of [activity,swim]){
  assert(['join','merge'].includes(geometry.nodes['type-merge'].kind));assert(geometry.routes.some(r=>r.guard==='[Group]'));assert(geometry.routes.some(r=>r.guard==='[Student Only]'));
  for(const [id,n] of Object.entries(geometry.nodes))assert(n.x>=0&&n.y>=0&&n.x+n.w<=geometry.width&&n.y+n.h<=geometry.height,id+' within page');
 }
 assert.equal(swim.nodes['select-type'].lane,0);assert.equal(swim.nodes.dean.lane,5);
 await page.locator('#activity-p2').screenshot({path:path.join(root,'assets/system-diagrams/preview-activity-p2.png')});
 await page.locator('#activity-system').screenshot({path:path.join(root,'assets/system-diagrams/preview-activity.png')});
 await page.locator('#sequence-p2').screenshot({path:path.join(root,'assets/system-diagrams/preview-sequence-request.png')});
 if(process.argv.includes('--render')){
  for(const [selector,name] of [['#activity-p2 svg','activity-p2'],['#activity-system svg','swimlane-system'],['#sequence-p2 svg','sequence-p2']]){
   const out=await page.locator(selector).evaluate(async svg=>{
    const copy=svg.cloneNode(true),src=[svg,...svg.querySelectorAll('*')],dst=[copy,...copy.querySelectorAll('*')];dst.forEach((n,i)=>{const cs=getComputedStyle(src[i]);for(const key of ['fill','stroke','stroke-width','stroke-dasharray','font-family','font-size','font-weight','text-anchor'])n.style.setProperty(key,cs.getPropertyValue(key));});
    const w=2400,h=Math.round(w*svg.viewBox.baseVal.height/svg.viewBox.baseVal.width);copy.setAttribute('width',w);copy.setAttribute('height',h);copy.style.width=w+'px';copy.style.height=h+'px';const xml=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml'}));try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(image,0,0);return{svg:xml,png:canvas.toDataURL('image/png').split(',')[1]};}finally{URL.revokeObjectURL(url);}
   });fs.writeFileSync(path.join(root,'assets/system-diagrams/'+name+'.svg'),out.svg);fs.writeFileSync(path.join(root,'assets/system-diagrams/'+name+'.png'),Buffer.from(out.png,'base64'));
  }
  await page.pdf({path:path.join(root,'assets/system-diagrams/diagrams.pdf'),preferCSSPageSize:true,printBackground:true});
  await page.pdf({path:path.join(root,'assets/system-diagrams/swimlane-system.pdf'),preferCSSPageSize:true,printBackground:true,pageRanges:'1'});
  await page.pdf({path:path.join(root,'assets/system-diagrams/sequence-p2.pdf'),preferCSSPageSize:true,printBackground:true,pageRanges:'8'});
  await page.pdf({path:path.join(root,'assets/system-diagrams/sequences.pdf'),preferCSSPageSize:true,printBackground:true,pageRanges:'7-11'});
 }
 assert.deepEqual(errors,[]);console.log('PASS: four combinations, required selection, member scope, stale group exclusion, Faculty routes, form validation, DFD balancing, ERD field, activity/swimlane merges and sequence geometry.');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
