// Validate the five major-process sequence models and their rendered A4 pages.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const models=require('../../assets/system-diagrams/sequence-models.js');
const docs=vm.runInNewContext(read('Docs.html').match(/  const DATA = \{[\s\S]*?\n  \};/)[0]+'; DATA');
const l1=JSON.parse(read('assets/figures-v2/dfd-level1/dfd-level1-model.json'));
const l2=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json'));
const children=l2.flatMap(p=>p.steps.map((_,i)=>p.id+'.'+(i+1)));
const walk=steps=>steps.flatMap(s=>[s,...(s.operands||[]).flatMap(o=>walk(o.steps))]);
assert.equal(models.length,5,'Exactly one sequence diagram per major process');
assert.deepEqual(models.map(m=>m.id),['p1','p2','p3','p4','p5']);
assert.equal(new Set(models.map(m=>m.id)).size,5);
for(const uc of docs.useCases)assert(models.some(m=>m.uses.includes(uc.diagramId)),'Missing use case '+uc.diagramId);
for(const child of children)assert(models.some(m=>m.processes.includes(child)),'Missing DFD child '+child);
for(const model of models){
 assert.equal(model.source,model.id);
 assert(model.processes.length>0&&model.processes.every(p=>p.startsWith(model.id+'.')&&children.includes(p)),'Only matching major process: '+model.id);
 assert(model.uses.every(u=>docs.useCases.some(d=>d.diagramId===u)));
 const participants=Object.fromEntries(model.participants.map(p=>[p.id,p]));
 assert(model.participants.length>=3&&model.participants.length<=5);
 for(const p of model.participants.filter(p=>p.kind==='actor'))assert(p.roles.every(role=>l1.entities.some(a=>a.name===role)),model.id+' actors');
 const used=new Set();
 function trace(steps,stack=[]){
  for(const s of steps){
   if(['alt','opt','par'].includes(s.kind)){
    assert(s.operands.every(o=>o.guard&&o.steps.length));
    assert.equal(new Set(s.operands.map(o=>o.guard)).size,s.operands.length);
    if(s.kind!=='opt')assert(s.operands.length>=2);
    const endings=s.operands.map(o=>trace(o.steps,stack.slice()));if(s.kind==='opt')endings.push(stack);
    for(const end of endings)assert.deepEqual(end,endings[0],model.id+' branch call stacks');stack=endings[0];continue;
   }
   assert(participants[s.from]&&participants[s.to]);used.add(s.from);used.add(s.to);
   assert(s.label&&!/Click Button|Move Cursor|Open Dropdown/.test(s.label));
   if(participants[s.from].kind==='actor')assert.equal(s.to,'system','No actor-to-database access');
   if(s.to==='db'){assert.equal(s.from,'system');assert(s.stores?.length);assert(s.stores.every(d=>model.stores.includes(d)&&l1.stores.some(store=>store.id===d)));}
   if(s.from==='db')assert.equal(s.to,'system');
   if(s.kind==='call')stack.push([s.from,s.to]);
   if(s.kind==='reply')assert.deepEqual(stack.pop(),[s.to,s.from],model.id+' matched reply');
   if(s.kind==='self'){assert.equal(s.from,'system');assert.equal(s.to,'system');assert(stack.some(([,to])=>to==='system'));}
   if(s.kind==='signal'){assert.equal(s.from,'system');assert.equal(participants[s.to].kind,'actor');assert(stack.some(([,to])=>to==='system'));}
  }return stack;
 }
 assert.deepEqual(trace(model.steps),[],model.id+' unfinished request');
 assert.equal(used.size,model.participants.length,'No unnecessary lifelines: '+model.id);
}
const find=id=>models.find(m=>m.id===id),labels=id=>walk(find(id).steps).map(s=>s.label||'').join(' ');
assert.match(find('p1').note,/never self-register/);assert.match(labels('p1'),/Authorize Head/);assert.match(labels('p1'),/Update details \/ active status/);
assert.match(labels('p2'),/Pending Dean/);assert.match(labels('p2'),/Save final Approved or Rejected/);assert.match(labels('p2'),/Save valid request \/ change/);assert.match(find('p2').note,/GROUP or STUDENT_ONLY/);
assert(walk(find('p3').steps).filter(s=>s.write).every(s=>s.stores.join()==='d9'),'Q&A writes only D9');
assert.match(labels('p4'),/final approval/);assert.match(labels('p4'),/completed usage logs/);
const reportParallel=walk(find('p5').steps).find(s=>s.kind==='par');
assert.equal(reportParallel.operands.length,2,'End-term inputs remain independent reads');
assert(reportParallel.operands.every(o=>o.steps.length===2&&o.steps[0].to==='db'&&!o.steps[0].write&&o.steps[1].kind==='reply'));
assert.match(find('p5').note,/Daily tasks, disposal, outstanding clearances and appendix are excluded/);

async function checkPage(page){
 const reservationText=await page.locator('#sequence-p2 svg').textContent();
 assert.match(reservationText,/Group = selected class members/,'Printed sequence explains Group accountability');
 assert.match(reservationText,/Student Only = one selected class student\./,'Printed sequence explains individual accountability');
 assert.equal(await page.locator('.sequence-sheet').count(),5);
 assert.equal(await page.locator('#sequence-index a[href^="#sequence-"]').count(),5);
 const all=await page.evaluate(()=>window.SystemSequenceGeometry);
 for(const model of models){
  const g=all[model.id],view=page.locator('#sequence-'+model.id);
  assert.equal(await view.locator('svg').getAttribute('viewBox'),'0 0 1200 1697');
  assert(g.fontSize>=18,'At least ~8.4 pt on the A4 artwork');
  assert.equal(await view.locator('[data-lifeline]').count(),model.participants.length);
  assert.equal(await view.locator('[data-participant-kind="actor"] circle').count(),model.participants.filter(p=>p.kind==='actor').length,'Actors use stick figures');
  for(const msg of g.messages){assert(msg.points.every(([x,y])=>x>=0&&x<=g.width&&y>280&&y<g.height));if(msg.kind!=='self')assert.equal(msg.points[0][1],msg.points[1][1]);}
  for(const a of g.activations)assert(a.start<a.end&&a.start>280&&a.end<=1650,'Bounded processing activation');
  const styles=await view.locator('[data-message-kind]').evaluateAll(ns=>ns.map(n=>({kind:n.dataset.messageKind,stroke:getComputedStyle(n).stroke,dash:getComputedStyle(n).strokeDasharray,marker:n.getAttribute('marker-end')})));
  for(const m of styles){assert.equal(m.stroke,'rgb(0, 0, 0)');assert(m.kind==='reply'?m.dash!=='none':m.dash==='none');assert(m.marker.includes(['reply','signal'].includes(m.kind)?'-open':'-filled'));}
  const collision=await view.locator('svg').evaluate(svg=>{const labels=[...svg.querySelectorAll('text')].map(t=>({text:t.textContent,b:t.getBBox()})),problems=[];for(const t of labels)for(const bar of svg.querySelectorAll('[data-activation]')){const a=t.b,b=bar.getBBox();if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1)problems.push(t.text+' overlaps activation');}return problems;});
  assert.deepEqual(collision,[],model.id+' labels avoid activation bars');
 }
 await page.locator('#sequence-index a[href="#sequence-p2"]').click();assert.equal(new URL(page.url()).hash,'#sequence-p2');
 console.log('Sequence checks passed: five major processes; all 20 use cases and 21 DFD children remain covered.');
}
module.exports={checkPage};
if(require.main===module)console.log('Sequence model checks passed: five major-process diagrams with matched messages and complete coverage.');
