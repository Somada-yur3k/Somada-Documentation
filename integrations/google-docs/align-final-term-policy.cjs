// Mechanical replacement of superseded sequential approval wording, no cloud writes.
const fs=require('node:fs'),path=require('node:path');
const file=path.resolve(__dirname,'../../Docs.html');let s=fs.readFileSync(file,'utf8');
const replacements=[
 ['available Faculty approval then Dean approval','a final decision from available Faculty'],
 ['my approval finalizes on-schedule requests but keeps out-of-schedule requests Pending for Dean; my rejection stops the route','my approval or rejection is final for either schedule variant; rejection releases the hold'],
 ['a Faculty-approved out-of-schedule Class Representative request','an out-of-schedule Class Representative request whose assigned Faculty is unavailable'],
 ['assigned Faculty when available, then Dean after Faculty approval','assigned Faculty for a final decision when available'],
 ['approval of an on-schedule request sets Approved; approval of an out-of-schedule request keeps Pending, retains the hold and routes to Dean','approval of either eligible schedule variant sets Approved; no subsequent Dean review is required'],
 ['already approved by assigned Faculty or directly routed because the assigned Faculty is unavailable','directly routed because the assigned Faculty is unavailable'],
 ['out-of-schedule requests require assigned Faculty followed by Dean','out-of-schedule requests require available Faculty, or Dean if Faculty is unavailable; either reviewer makes the final decision'],
 ['Class Representative requests go to assigned Faculty first; out-of-schedule requests proceed to Dean only after Faculty approval','Class Representative on-schedule requests go to assigned Faculty; out-of-schedule requests go to available Faculty or directly to Dean if Faculty is unavailable'],
 ['route Class Representative requests to assigned Faculty; route Faculty out-of-schedule requests directly to Dean','route Class Representative on-schedule requests to Faculty, and out-of-schedule requests to available Faculty or directly to Dean if Faculty is unavailable; route Faculty out-of-schedule requests directly to Dean'],
 ['assigned Faculty when available (then Dean if out-of-schedule)','assigned Faculty for a final decision when available'],
 ['including awaiting Dean after intermediate Faculty approval or direct unavailability route','either Faculty or Dean according to the applicable routing rule'],
 ['Faculty approval finalizes an on-schedule non-laboratory request; an out-of-schedule request remains Pending and proceeds to Dean','Faculty approval or rejection is final for either eligible schedule variant'],
 ['Faculty-approved or direct-unavailability out-of-schedule Class Representative requests','direct-unavailability out-of-schedule Class Representative requests'],
 ['Dean receives a Class Representative request after assigned Faculty approval, or directly only when the assigned Faculty is unavailable','Dean receives an out-of-schedule Class Representative request directly only when the assigned Faculty is unavailable'],
 ['Faculty approval of an out-of-schedule Class Representative request keeps Pending (awaiting Dean), retains the hold and does not permit issuance','Faculty approval of an eligible out-of-schedule Class Representative request sets Approved and permits laboratory processing without another Dean decision'],
 ['System rejects and releases the hold, keeps Pending and routes to Dean after intermediate Faculty approval or direct Faculty-unavailability routing, or sets Approved after the final required approval; it notifies the requester.','System saves the selected reviewer\'s final Approved or Rejected decision and notifies the requester. Rejection releases the hold. No intermediate Faculty-to-Dean escalation is performed.'],
 ['to Faculty then Dean when the assigned Faculty is available','to Faculty for a final decision when the assigned Faculty is available'],
 ['Process 2.4 retains Pending (awaiting Dean) and the held block after intermediate Faculty approval or the documented Faculty-unavailability direct route; only the final required approval sets Approved. Pending Dean is a reviewer stage, not a new reservation-status value.','Process 2.4 saves the selected Faculty or Dean reviewer\'s final decision. Pending applies only while awaiting that decision; it does not continue to Dean after Faculty approval.'],
 ];
for(const [a,b]of replacements){if(!s.includes(a))throw Error('Missing policy phrase: '+a);s=s.replaceAll(a,b);}
fs.writeFileSync(file,s);console.log('Superseded approval escalation wording aligned.');
