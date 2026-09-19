// Synchronize reservation payload names without changing flow identities or routes.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const labels={
 'p2-cr-onschedule':'On-Schedule Non-Laboratory Request including Reservation Type',
 'p2-cr-outschedule':'Out-of-Schedule Request including Reservation Type',
 'p2-d2-write':'Reservation Record including Reservation Type',
 'p2-d2-read':'Reservation Data including Reservation Type'
};
const l1path=path.join(root,'assets/figures-v2/dfd-level1/dfd-level1-model.json');
const l1=JSON.parse(fs.readFileSync(l1path,'utf8'));
for(const f of l1.flows)if(labels[f.id])f.label=labels[f.id];
fs.writeFileSync(l1path,JSON.stringify(l1,null,2)+'\n');
const l2path=path.join(root,'assets/figures-v2/dfd-level2-compact/dfd-level2-model.json');
const l2=JSON.parse(fs.readFileSync(l2path,'utf8'));
for(const p of l2)for(const f of p.flows)if(labels[f.parentFlow])f.label=labels[f.parentFlow];
l2.find(p=>p.id==='p2').internal.find(f=>f.id==='p2-internal2').label='Validated Request including Reservation Type';
fs.writeFileSync(l2path,JSON.stringify(l2,null,2)+'\n');
console.log('Updated canonical reservation payloads; Level 0 reads the same Level 1 model.');
