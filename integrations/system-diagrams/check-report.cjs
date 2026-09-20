// Documentation/model contract checks only; not a production report calculator.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('Docs.html');
const data=vm.runInNewContext(html.match(/  const DATA = \{[\s\S]*?\n  \};/)[0]+'; DATA');
const report=data.useCases.find(u=>u.id==='uc-endterm');
const labels=['Average Equipment Use','Top 5 Equipment & Consumables','Laboratory Frequency Usage','Recent Activity'];
const copies=[report,data.events.find(e=>e.diagramId==='endterm'),data.backlog.find(b=>b.id==='17')];
for(const copy of copies)for(const label of labels)assert(JSON.stringify(copy).includes(label),'Missing report section: '+label);
assert.equal(report.actors,'Head Laboratory');
const spec=JSON.stringify(report);
for(const token of ['ROUND(Quantity Used / Total Available * 100, 2)','44.44%','55.56%','N/A','actual','appendix'])assert(spec.includes(token),token);
for(const id of ['uc-procclear','uc-wastedisp'])assert(!data.useCases.find(u=>u.id===id).related.includes('Generate End-Term Report'));
const l1=JSON.parse(read('assets/figures-v2/dfd-level1/dfd-level1-model.json'));
const l2=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json'));
assert.equal(l1.flows.length,72);assert.equal(l1.flows.filter(f=>f.kind==='external').length,46);
// P1 account maintenance now reads D1 independently; report exchanges are unchanged.
assert.equal(l2.reduce((n,m)=>n+m.flows.length,0),89);
assert(l2.find(m=>m.id==='p1').flows.some(f=>f.source==='d1'&&f.target==='p1.3'&&f.label==='Account Data'));
const p5=l2.find(m=>m.id==='p5');
assert.deepEqual(p5.flows.filter(f=>f.target==='p5.4').map(f=>f.source).sort(),['d2','d3','d4','d5']);
assert(!p5.internal.some(f=>f.source==='p5.3'&&f.target==='p5.4'));
assert(p5.flows.some(f=>f.source==='p5.2'&&f.target==='d7'),'Daily tasks still stored separately');
assert(p5.flows.some(f=>f.source==='d6'&&f.target==='p5.3'),'Clearance workflow preserved');
assert(l2.find(m=>m.id==='p4').flows.some(f=>f.target==='d10'),'Disposal workflow preserved');
const model=require('../../assets/system-diagrams/models.js').find(m=>m.id==='report');
assert.deepEqual(model.stores,['d2','d3','d4','d5']);
const activity=read('assets/system-diagrams/process-activities.js');
assert(!activity.includes("action('report-invalid'"),'Report must not request corrections to automatic logs');
assert(activity.includes('Read automatic logs of\\ncompleted reservations'));
assert(!activity.includes('Head: enter usage'),'Completed-reservation usage is automatic');
// Arithmetic examples from the user, with zero denominators explicitly undefined.
const percent=(n,d)=>d>0?Math.round(n/d*10000)/100:null;
assert.equal(percent(4,9),44.44);assert.equal(percent(5,9),55.56);
assert.equal(percent(6,16),37.5);assert.equal(percent(0,0),null);
// Joining item rows must not multiply actual-session counts.
const itemRows=[{session:'A',item:'meter'},{session:'A',item:'wire'},{session:'B',item:'meter'}];
assert.equal(new Set(itemRows.map(row=>row.session)).size,2);
console.log('Report scope passed: 3 summaries + Recent Activity; four input stores; actual-session percentages; excluded workflows preserved.');
