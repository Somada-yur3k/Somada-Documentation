// Forecasting is a read-only Head Lab extension of inventory, not a new store.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const l1=load('assets/figures-v2/dfd-level1/dfd-level1-model.json');
const l2=load('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json');
const p4=l2.find(p=>p.id==='p4');
const request=l1.flows.find(f=>f.source==='headlab'&&f.target==='p4'&&f.label==='Forecast Request');
const result=l1.flows.find(f=>f.source==='p4'&&f.target==='headlab'&&f.label==='Inventory Forecast');
assert(request&&result,'Head Lab can request and receive an inventory forecast');
const input=p4.flows.find(f=>f.parentFlow===request.id),output=p4.flows.find(f=>f.parentFlow===result.id);
assert(input&&output,'Forecast boundary exchanges balance to Level 1');
const forecastSteps=['p4.6','p4.7','p4.8'];
for(const store of ['d2','d4','d5'])assert(p4.flows.some(f=>f.source===store&&f.target===input.target),'Forecast reads existing '+store);
assert(!p4.flows.some(f=>forecastSteps.includes(f.source)&&/^d\d+$/.test(f.target)),'Forecast never writes stock, purchases or a new forecast store');
assert(!p4.flows.some(f=>forecastSteps.includes(f.source)&&['physics','circuits','classrep','faculty','dean'].includes(f.target)),'Forecast output remains Head Lab only');
assert(p4.internal.some(f=>f.source===input.target&&f.target==='p4.7'));
assert(p4.internal.some(f=>f.source==='p4.7'&&f.target===output.source));
console.log('PASS: Head-only read-only forecast, existing data inputs and balanced output.');
