// Read-only contract checks: no Google connection or live document changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({DocumentApp:{ElementType:{PARAGRAPH:'p'}}});
vm.runInContext(fs.readFileSync(__dirname+'/Code.gs','utf8'),context);
const payload={version:3,documentId:'1UfFa6G0eWenSY_KjokZoOHqrQ2ajKGVgIwU56dkjpzY',title:null,sections:[{id:'erd-appendix',blocks:[
 {kind:'heading',level:4,text:'Appendix A2 - Reservations and Approvals',pageBreakBefore:true},
 {kind:'image',data:'iVBORw0KGgo=',width:3200,height:4606,caption:'Figure A2: Reservations and Approvals'}
]}]};
const body=values=>({getNumChildren:()=>values.length,getChild:i=>({getType:()=> 'p',asParagraph:()=>({getText:()=>values[i]})})});
const original=['2.3.3 Entity-Relationship Diagram','Overview','2.3.4 Activity Diagrams','Activities','References','Bibliography'];
const clean=x=>JSON.parse(JSON.stringify(x));
context.validatePayload_(payload);
assert.deepEqual(clean(context.planSections_(body(original),payload).sections),[{id:'erd-appendix',start:6,end:6,create:true}]);
assert.deepEqual(original,['2.3.3 Entity-Relationship Diagram','Overview','2.3.4 Activity Diagrams','Activities','References','Bibliography'],'Planning does not mutate source');
const existing=[...original,'Appendix A - Detailed Entity-Relationship Diagrams','Previous images'];
assert.deepEqual(clean(context.planSections_(body(existing),payload).sections),[{id:'erd-appendix',start:6,end:8}],'Later sync replaces the appendix instead of appending a duplicate');
assert.throws(()=>context.planSections_(body([...existing,'Appendix A - Detailed Entity-Relationship Diagrams']),payload),/uniquely/);
assert.throws(()=>context.planSections_(body(original.filter(t=>t!=='References')),payload),/References/);
assert.throws(()=>context.planSections_(body(['Entity-Relationship Diagram','Appendix A - Detailed Entity-Relationship Diagrams','References','Bibliography']),payload),/follow References/);
const combined={...payload,sections:[{id:'erd',blocks:[{kind:'paragraph',text:'ERD overview.'}]},...payload.sections]};
const plans=clean(context.planSections_(body(existing),combined).sections);
assert.equal(plans[0].start,0);assert.equal(plans[0].end,2,'Overview replacement does not reach References or appendix');
assert.equal(plans[1].start,6);assert.equal(plans[1].end,8,'Appendix starts after the complete bibliography');
assert.throws(()=>context.validatePayload_({...payload,sections:[{id:'references',blocks:[{kind:'paragraph',text:'Do not replace references.'}]}]}),/Invalid/);
console.log('PASS: ERD appendix accepted, safely appended after References, replaced without duplication, malformed anchors rejected. No cloud write.');
