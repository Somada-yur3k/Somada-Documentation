// One-time mechanical renumbering of the existing paper; no cloud writes.
const fs=require('node:fs'),path=require('node:path');
const file=path.resolve(__dirname,'../../Docs.html');
let s=fs.readFileSync(file,'utf8');
if(s.includes('2.3.7 Deployment Diagram'))throw Error('Already migrated');
const numbering={'3.1.10':'2.3.5','3.1.9':'2.3.4','3.1.8':'2.3.3','3.1.7':'2.3.2','3.1.6':'2.3.1','3.1.5':'2.2','3.1.4':'2.1.4','3.1.3':'2.1.3','3.1.2':'2.1.2','3.1.1':'2.1.1'};
for(const [a,b]of Object.entries(numbering))s=s.replaceAll(a,b);
s=s.replaceAll('I. Project Overview','I. Project Context').replaceAll('III. Requirements Analysis','2.1 Requirements Analysis');
s=s.replaceAll('11Q2UAiRIxcR_Pc5mb4ieqBvsA-t9Stb759jTH2tizEM','1UfFa6G0eWenSY_KjokZoOHqrQ2ajKGVgIwU56dkjpzY');
// Scrum becomes Figure 1; all existing numbered figures shift by one.
s=s.replace(/Figure (\d+)\b/g,(_,n)=>'Figure '+(Number(n)+1));
s=s.replace(/figure:(\d+)/g,(_,n)=>'figure:'+(Number(n)+1));
s=s.replace(/number:"([4-8])"/g,(_,n)=>'number:"'+(Number(n)+1)+'"');
s=s.replace('Methodology illustration: Scrum Framework','Figure 1: Scrum Framework');
s=s.replaceAll('Figures 10 to 14','Figures 11 to 15').replaceAll('Figures 10–14','Figures 11–15');
s=s.replace('These 46 boundary flows','These 48 boundary flows');
s=s.replace('at the bar labelled &#123;joinSpec = or&#125;','at the alternative-flow merge');
s=s.replace('construction has not begun','only the initial Next.js application scaffold has been created; laboratory features have not yet been implemented');
s=s.replace('<ContextDiagramSection onZoom={setLightbox} />','<section id="system-analysis" className="doc-section"><SectionHeading title="2.3 System Analysis and Design" id="system-analysis" /></section>\n            <ContextDiagramSection onZoom={setLightbox} />');
s=s.replace('<SwimlaneDiagramSection onZoom={setLightbox} />','<SwimlaneDiagramSection onZoom={setLightbox} />\n            <SequenceDiagramSection onZoom={setLightbox} />\n            <DeploymentDiagramSection onZoom={setLightbox} />');
s=s.replace('    { label:"II. Methodology",','    { label:"1.1 Statement of the Problem", page:1, id:"problem", indent:1 },\n    { label:"1.2 Objectives", page:1, id:"objectives", indent:1 },\n    { label:"1.3 Scope and Limitations", page:1, id:"scope", indent:1 },\n    { label:"II. Methodology",');
s=s.replace('    { label:"2.3.1 Context Diagram",','    { label:"2.3 System Analysis and Design", page:1, id:"system-analysis", indent:0 },\n    { label:"2.3.1 Context Diagram",');
s=s.replace('    { label:"2.3.5 Swimlane Diagram", page:56, id:"swimlane-diagram", indent:1 },','    { label:"2.3.5 Swimlane Diagram", page:56, id:"swimlane-diagram", indent:1 },\n    { label:"2.3.6 Sequence Diagram", page:57, id:"sequence-diagrams", indent:1 },\n    { label:"2.3.7 Deployment Diagram", page:62, id:"deployment-diagram", indent:1 },');
s=s.replace('      { id:"swimlane-diagram", label:"2.3.5 Swimlane Diagram" },','      { id:"swimlane-diagram", label:"2.3.5 Swimlane Diagram" },\n      { id:"sequence-diagrams", label:"2.3.6 Sequence Diagram" },\n      { id:"deployment-diagram", label:"2.3.7 Deployment Diagram" },');
fs.writeFileSync(file,s);
console.log('Final-term headings and figures renumbered.');
