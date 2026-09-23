const fs=require('node:fs'),path=require('node:path');
for(const name of ['check-sync.cjs','check-lifecycle.cjs','check-connection.cjs']){
 const p=path.join(__dirname,name);let s=fs.readFileSync(p,'utf8');
 s=s.replaceAll('11Q2UAiRIxcR_Pc5mb4ieqBvsA-t9Stb759jTH2tizEM','1UfFa6G0eWenSY_KjokZoOHqrQ2ajKGVgIwU56dkjpzY');
 s=s.replaceAll('lab-google-doc-private-connection','lab-google-doc-final-term-connection');
 s=s.replaceAll('3.1.9 Activity Diagrams','2.3.4 Activity Diagrams').replaceAll('3.1.10 Swimlane Diagram','2.3.5 Swimlane Diagram');
 if(name==='check-sync.cjs')s=s.replace("const bodyOf=texts=>({getNumChildren:()=>texts.length,getChild:i=>para(texts[i])});","const bodyOf=original=>{const texts=[...original,'References','Preserved bibliography'];return {getNumChildren:()=>texts.length,getChild:i=>para(texts[i])};};");
 if(name==='check-lifecycle.cjs')s=s.replace("'Old ERD'];","'Old ERD','References','Preserved bibliography'];").replace("assert.equal(ok.data.at(-1),'','Trailing paragraph after a final table');","assert.equal(ok.data.at(-1),'Preserved bibliography','References survive updates to the final diagram');");
 fs.writeFileSync(p,s);
}
