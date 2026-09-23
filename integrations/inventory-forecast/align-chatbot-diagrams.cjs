// Mechanical alignment of existing diagram models; no database/cloud writes.
const fs=require('node:fs');
const p1='assets/figures-v2/dfd-level1/dfd-level1-model.json';
const p2='assets/figures-v2/dfd-level2-compact/dfd-level2-model.json';
const removed=new Set(['p3-d2-read','p3-d3-read']);
const a=JSON.parse(fs.readFileSync(p1,'utf8'));
a.flows=a.flows.filter(f=>!removed.has(f.id));
fs.writeFileSync(p1,JSON.stringify(a,null,2)+'\n');
const b=JSON.parse(fs.readFileSync(p2,'utf8'));
const q=b.find(m=>m.id==='p3');
q.flows=q.flows.filter(f=>!removed.has(f.parentFlow));
q.steps[1]='Retrieve Laboratory Knowledge / Stock';
fs.writeFileSync(p2,JSON.stringify(b,null,2)+'\n');
