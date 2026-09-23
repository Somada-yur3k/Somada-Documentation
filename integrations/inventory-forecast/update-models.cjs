// Idempotent mechanical update of canonical JSON models and inventory use case.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s);
const l1Path='assets/figures-v2/dfd-level1/dfd-level1-model.json';
const l2Path='assets/figures-v2/dfd-level2-compact/dfd-level2-model.json';
const l1=JSON.parse(read(l1Path)),l2=JSON.parse(read(l2Path)),p4=l2.find(p=>p.id==='p4');
const put=(list,item)=>{const i=list.findIndex(v=>v.id===item.id);if(i<0)list.push(item);else list[i]=item;};
for(const [id,source,target,label,kind] of [
 ['p4-he-forecast','headlab','p4','Forecast Request','external'],
 ['p4-he-forecast-result','p4','headlab','Inventory Forecast','external'],
 ['p4-d2-history','d2','p4','Historical Request Data','store']
])put(l1.flows,{id,source,target,label,kind});
p4.steps=p4.steps.slice(0,5).concat(['Retrieve Forecast Inputs','Estimate Next-Month Needs','Present Inventory Forecast']);
for(const [parentFlow,source,target]of [
 ['p4-he-forecast','headlab','p4.6'],['p4-he-forecast-result','p4.8','headlab'],
 ['p4-d2-history','d2','p4.6'],['p4-d4-read','d4','p4.6'],['p4-d5-read','d5','p4.6']
]){
 const parent=l1.flows.find(f=>f.id===parentFlow);if(!parent)throw Error('Missing parent '+parentFlow);
 put(p4.flows,{id:parentFlow+'-forecast',parentFlow,source,target,label:parent.label,kind:parent.kind});
}
for(const [id,source,target,label]of [
 ['p4-forecast-inputs','p4.6','p4.7','Usage History & Data Status'],
 ['p4-forecast-estimates','p4.7','p4.8','Forecast Assessment']
])put(p4.internal,{id,source,target,label,kind:'internal'});
p4.internal=p4.internal.filter(f=>f.id!=='p4-forecast-unavailable');
write(l1Path,JSON.stringify(l1,null,2)+'\n');write(l2Path,JSON.stringify(l2,null,2)+'\n');
let html=read('Docs.html');
const data=vm.runInNewContext(html.match(/  const DATA = \{[\s\S]*?\n  \};/)[0]+'; DATA');
const uc=data.useCases.find(u=>u.diagramId==='mgminv');
const overview='Head Lab may additionally generate a next-month inventory forecast from recorded stock, actual consumption and borrowing/return history. Consumables use estimated consumption; reusable equipment uses concurrent demand and serviceable quantities, not cumulative borrowing as consumption. Results are advisory and dynamically generated: no automatic purchase, stock change or stored Forecast table. Insufficient history produces an explicit unavailable estimate, never a fabricated zero.';
if(!uc.briefDescription.includes('next-month inventory forecast'))uc.briefDescription+=' '+overview;
if(!uc.related.includes('Generate Inventory Forecast'))uc.related.push('Generate Inventory Forecast');
uc.dependencies=uc.dependencies.filter(d=>d.diagramId!=='forecast');
uc.dependencies.push({diagramId:'forecast',name:'Generate Inventory Forecast',type:'extend',condition:'Head Laboratory selects Generate Inventory Forecast in Inventory Management.',behavior:'Retrieve D4 stock, D5 actual issue/return history and D2 item references; validate history; estimate next-month consumption or concurrent equipment needs; display current stock, estimated demand, suggested consumable restock or equipment shortage, explanation, history period and generation date. Head reviews the recommendation. Missing history shows Insufficient history. No purchasing or inventory mutation.'});
if(!uc.postconditions.some(s=>s.includes('Forecasting'))){
 uc.postconditions.push('Forecasting returns a read-only recommendation or Insufficient history; inventory and reservation records remain unchanged.');
 uc.exceptions.push('Only Head Laboratory may generate the forecast. Missing/incomplete history suppresses the affected estimate, while current stock and rule-based low-stock alerts remain visible.');
}
html=html.replace(/      \{\r?\n        "id": "uc-inventory",[\s\S]*?(?=,\r?\n      \{\r?\n        "id": "uc-issueeq")/,JSON.stringify(uc,null,2).split('\n').map(s=>'      '+s).join('\n'));
write('Docs.html',html);
console.log('Updated canonical inventory forecast models and Table 16.');
