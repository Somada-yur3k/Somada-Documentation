// Approval documentation/diagram regression checks; no network or database writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=vm.runInNewContext(read('Docs.html').match(/  const DATA = \{[\s\S]*?\n  \};/)[0]+'; DATA');
const approval=data.useCases.find(u=>u.diagramId==='approve');
assert.equal(approval.actors,'Faculty, Dean');
assert.match(approval.briefDescription,/Assigned Faculty reviews Class Representative requests first/);
assert.match(approval.briefDescription,/out-of-schedule request remains Pending and proceeds to Dean/);
assert.match(approval.briefDescription,/Regular scheduled Faculty laboratory activities need no additional academic approval/);
assert.match(approval.postconditions.join(' '),/retains the hold and does not permit issuance/);
assert.match(approval.postconditions.join(' '),/Only the final required approval sets Approved/);
assert.match(approval.postconditions.join(' '),/Rejection sets Rejected, releases the hold and stops routing/);
const faculty=data.events.find(e=>e.diagramId==='approve'&&e.source==='Faculty');
assert.match(faculty.response,/out-of-schedule request keeps Pending, retains the hold and routes to Dean/);
const dean=data.events.find(e=>e.diagramId==='approve'&&e.source==='Dean');
assert.match(dean.trigger,/already approved by assigned Faculty/);
const request=data.useCases.find(u=>u.diagramId==='submitcombined');
assert.match(request.postconditions.join(' '),/Faculty out-of-schedule requests go directly to Dean/);
assert.match(data.useCases.find(u=>u.diagramId==='issueeq').preconditions.join(' '),/Pending \(awaiting Dean\) is not eligible/);
assert.match(data.useCases.find(u=>u.diagramId==='viewstatus').briefDescription,/awaiting Dean after intermediate Faculty approval/);
const l2=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json'));
const p2=l2.find(m=>m.id==='p2');
for(const actor of ['faculty','dean']){
 assert(p2.flows.some(f=>f.source===actor&&f.target==='p2.3'&&f.label==='Approval Decision'));
 assert(p2.flows.some(f=>f.source==='p2.3'&&f.target===actor&&f.label==='Routed Approval Request'));
}
assert(l2.find(m=>m.id==='p4').flows.some(f=>f.source==='d2'&&f.target==='p4.2'&&f.label==='Authorized Reservation Data'));
assert.match(read('assets/system-diagrams/swimlane.js'),/Review Pending Dean/);
assert.match(read('assets/system-diagrams/swimlane.js'),/Check final approval/);
assert.match(read('integrations/system-audit/build.cjs'),/\['fixed','POL-01'/);
assert.match(read('integrations/system-audit/build.cjs'),/\['pending','POL-08'/,'Dean account provisioning is still pending');
for(const file of ['Docs.html','assets/erd/model.js','assets/erd/DESIGN.md','assets/system-diagrams/TRACEABILITY.md','assets/system-diagrams/render.js']){
 assert.doesNotMatch(read(file),/Exact (?:Class Representative-to-Dean escalation|escalation stages) remains? pending/);
}
console.log('Approval alignment passed: four request routes, intermediate Pending Dean, final-only issuance, existing DFD exchanges and preserved provisioning uncertainty.');
