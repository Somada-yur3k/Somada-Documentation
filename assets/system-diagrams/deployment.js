/* Proposed UML deployment: browser clients, Backend-controlled data access,
 * PostgreSQL and a logical AI Services node. RAG is an architecture; n8n is
 * optional orchestration, while XGBoost is the proposed forecasting model. */
(function(){
'use strict';
window.SystemDeploymentDiagram=function(id){
 const NS='http://www.w3.org/2000/svg',width=1200,height=1697;
 const geometry={width,height,containers:{},connections:[],services:[]};
 const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs||{}))n.setAttribute(k,v);parent?.append(n);return n;};
 const svg=el('svg',{xmlns:NS,viewBox:`0 0 ${width} ${height}`,role:'img','aria-labelledby':id+'-title',class:'deployment-diagram'});
 el('title',{id:id+'-title'},svg).textContent='Proposed laboratory deployment: browser clients, Node.js Backend, PostgreSQL, RAG chatbot and XGBoost forecasting';
 el('style',{},svg).textContent='.deployment-diagram text{font-family:Arial,Helvetica,sans-serif;fill:#000}';
 const links=el('g',{},svg),shapes=el('g',{},svg),labels=el('g',{},svg);
 function text(parent,x,y,value,{font=22,bold=false,max=40,owner}={}){
  const rows=[];
  for(const line of value.split('\n')){let row='';for(const word of line.split(' ')){if(row&&(row+' '+word).length>max){rows.push(row);row=word;}else row+=(row?' ':'')+word;}rows.push(row);}
  const t=el('text',{'text-anchor':'middle','font-size':font,'font-weight':bold?700:400,...(owner?{'data-text-owner':owner}:{})},parent);
  rows.forEach((row,i)=>{el('tspan',{x,y:y+(i-(rows.length-1)/2)*font*1.14+font*.32},t).textContent=row+(i<rows.length-1?' ':'');});
  return t;
 }
 function rect(parent,x,y,w,h,attrs={}){return el('rect',{x,y,width:w,height:h,fill:'#fff',stroke:'#000','stroke-width':2,...attrs},parent);}
 function container(parent,key,x,y,w,h,attrs={}){
  const g=el('g',{'data-container':key,...attrs},parent);
  rect(g,x,y,w,h,{'data-container-face':key});geometry.containers[key]={x,y,w,h};return g;
 }
 function node(key,x,y,w,h,label){
  const g=el('g',{'data-node':key},shapes);
  el('path',{d:`M${x} ${y} l14 -14 h${w} v${h} l-14 14 M${x+w} ${y} l14 -14`,fill:'#fff',stroke:'#000','stroke-width':2},g);
  rect(g,x,y,w,h,{'data-container-face':key});geometry.containers[key]={x,y,w,h};
  text(g,x+w/2,y+34,label,{font:26,bold:true,owner:key});return g;
 }
 function artifact(parent,key,x,y,w,h){
  const g=el('g',{'data-artifact':key,'data-container':key},parent);
  el('path',{d:`M${x} ${y} H${x+w-16} L${x+w} ${y+16} V${y+h} H${x} Z M${x+w-16} ${y} V${y+16} H${x+w}`,fill:'#fff',stroke:'#000','stroke-width':1.8},g);
  geometry.containers[key]={x,y,w,h};return g;
 }
 function deviceIcon(parent,x,y,mobile){
  const g=el('g',{'data-device-icon':mobile?'mobile':'desktop',fill:'none',stroke:'#000','stroke-width':2.5},parent);
  if(mobile){rect(g,x-9,y,18,30,{rx:3,'stroke-width':2.5});el('path',{d:`M${x-3} ${y+25} h6`},g);}
  else{rect(g,x-20,y,40,25,{rx:2,'stroke-width':2.5});el('path',{d:`M${x} ${y+25} v7 m-12 0 h24`},g);}
  text(parent,x,y+44,mobile?'Mobile':'Desktop',{font:14});
 }
 function actor(parent,x,y){
  const g=el('g',{'data-actor-icon':'user',fill:'none',stroke:'#000','stroke-width':2},parent);
  el('circle',{cx:x,cy:y+7,r:6},g);el('path',{d:`M${x} ${y+13} v17 m-12 -10 h24 M${x} ${y+30} l-10 12 M${x} ${y+30} l10 12`},g);
 }
 function connection(key,points,label,x,y,font=24){
  el('path',{d:points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' '),fill:'none',stroke:'#000','stroke-width':2.5,'data-connection':key},links);
  const t=text(labels,x,y,label,{font,bold:true});t.setAttribute('data-connection-label',key);
  geometry.connections.push({key,points});
 }
 text(labels,600,30,'Physics and Circuits Laboratory Management System',{font:28,bold:true,max:90});
 text(labels,600,68,'Deployment Diagram - Proposed architecture',{font:22,max:90});

 // One shared browser deployment; roles do not imply five installed servers.
 const clients=node('clients',40,115,1110,400,'«device» User Devices');
 text(clients,320,179,'System Users',{font:23,bold:true,owner:'clients'});
 const roles=[['classrep','Class Representative'],['faculty','Faculty'],['dean','Dean'],['staff','Circuit Staff /\nPhysics Staff'],['head','Head Lab']];
 roles.forEach(([key,label],i)=>{
  const y=197+i*62,g=container(clients,'role-'+key,65,y,550,59,{'data-node':key,'data-client-role':key});
  actor(g,88,y+7);text(g,292,y+29,label,{font:key==='staff'?20:22,bold:true,owner:'role-'+key});
  deviceIcon(g,510,y+4,false);deviceIcon(g,577,y+4,true);
 });
 const browser=container(clients,'browser',649,182,477,306,{'data-environment':'browser'});
 text(browser,887.5,214,'«executionEnvironment»',{font:22,owner:'browser'});
 text(browser,887.5,249,'Web Browser',{font:28,bold:true,owner:'browser'});
 const frontend=artifact(browser,'frontend',674,281,427,181);
 text(frontend,887.5,308,'«artifact»',{font:21,owner:'frontend'});
 text(frontend,887.5,341,'Laboratory Frontend',{font:27,bold:true,owner:'frontend'});
 text(frontend,887.5,388,'Next.js / React / TypeScript\nTailwind CSS',{font:24,owner:'frontend'});
 text(frontend,887.5,438,'Role-based web interface',{font:21,owner:'frontend'});

 const app=node('application',40,600,630,1040,'«node» Application Server (Node.js)');
 const runtime=container(app,'node-runtime',62,670,586,195,{'data-environment':'node-runtime'});
 text(runtime,355,695,'«executionEnvironment»',{font:22,owner:'node-runtime'});
 text(runtime,355,731,'Node.js Runtime',{font:27,bold:true,owner:'node-runtime'});
 const backend=artifact(runtime,'backend',84,760,542,98);
 text(backend,355,779,'«artifact»',{font:18,owner:'backend'});
 text(backend,355,807,'Laboratory Backend Application',{font:24,bold:true,owner:'backend'});
 text(backend,355,838,'Next.js / TypeScript',{font:20,owner:'backend'});
 const services=container(app,'services',62,885,586,731);
 text(services,355,909,'«component»',{font:20,owner:'services'});
 text(services,355,938,'Laboratory Application Services',{font:25,bold:true,owner:'services'});
 const modules=[
  ['accounts','User Account\nManagement'],['requests','Reservations /\nApprovals'],
  ['schedule','Schedules /\nAvailability'],['inventory','Equipment Inventory'],
  ['borrowing','Borrowing / Returns'],['administration','Clearance /\nDaily Tasks /\nDisposal'],
  ['chatbot','AI Chatbot Gateway\nApproved context retrieval'],['forecast','Forecasting Gateway\nValidated history input'],
  ['reporting','Usage Logs / End-Term Report']
 ];
 modules.forEach(([key,name],i)=>{
  const wide=i===8,x=76+(wide?0:(i%2)*283),y=wide?1543:969+Math.floor(i/2)*143,w=wide?552:269,h=wide?56:124;
  const g=container(services,'service-'+key,x,y,w,h,{'data-component':key});
  for(const tabY of [y+13,y+30])rect(g,x-6,tabY,12,9,{'stroke-width':1.5});
  text(g,x+w/2,y+(wide?14:23),'«component»',{font:18,owner:'service-'+key});
  text(g,x+w/2,y+(wide?39:77),name,{font:wide?23:22,bold:true,max:wide?50:25,owner:'service-'+key});
  geometry.services.push(key);
 });

 const stores=[...window.SystemDeploymentStores].sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
 const database=node('database',755,600,405,605,'«node» Database Server');
 const dbms=container(database,'postgresql',773,668,369,517,{'data-environment':'postgresql'});
 text(dbms,957.5,692,'«executionEnvironment»',{font:22,owner:'postgresql'});
 text(dbms,957.5,725,'PostgreSQL DBMS',{font:27,bold:true,owner:'postgresql'});
 const schema=artifact(dbms,'schema',785,756,345,420);
 text(schema,957.5,789,'«artifact»\nLaboratory Database',{font:21,bold:true,owner:'schema'});
 stores.forEach((store,i)=>{
  const y=818+i*32,g=container(schema,'store-'+store.id,795,y,325,30,{'data-store':store.id});
  text(g,957.5,y+15,store.number+' — '+store.name,{font:18,max:80,owner:'store-'+store.id});
 });

 // A logical service boundary, not a selected hosting vendor or purchased GPU.
 const ai=node('ai-services',755,1260,405,380,'«node» AI Services (Proposed)');
 const aiRuntime=container(ai,'ai-runtime',773,1320,369,300,{'data-environment':'ai-runtime'});
 text(aiRuntime,957.5,1341,'«executionEnvironment»',{font:20,owner:'ai-runtime'});
 text(aiRuntime,957.5,1370,'AI Service Runtime',{font:23,bold:true,owner:'ai-runtime'});
 const rag=artifact(aiRuntime,'rag-chatbot',785,1390,345,112);
 text(rag,957.5,1412,'«artifact» AI Chatbot (RAG)',{font:20,bold:true,owner:'rag-chatbot'});
 text(rag,957.5,1438,'D8 knowledge + live D4 inventory',{font:18,owner:'rag-chatbot'});
 text(rag,957.5,1463,'Model: Gemini 3.5 Flash-Lite',{font:18,owner:'rag-chatbot'});
 text(rag,957.5,1486,'Google Gemini API (Free Tier)',{font:17.5,owner:'rag-chatbot'});
 const forecast=artifact(aiRuntime,'forecast-model',785,1508,345,108);
 text(forecast,957.5,1527,'«artifact» Inventory Forecasting',{font:19,bold:true,owner:'forecast-model'});
 text(forecast,957.5,1551,'Python / XGBoost (proposed)',{font:19,owner:'forecast-model'});
 text(forecast,957.5,1575,'n8n: optional workflow automation',{font:17.5,owner:'forecast-model'});
 text(forecast,957.5,1596,'Read-only forecasts for review',{font:18,owner:'forecast-model'});

 connection('clients-application',[[355,515],[355,586]],'HTTPS / Internet',503,550);
 connection('application-database',[[684,907],[755,907]],'TLS',719.5,876);
 connection('application-ai',[[684,1230],[712,1230],[712,1440],[755,1440]],'HTTPS / REST API',957.5,1223,20);
 window.SystemDeploymentGeometry=geometry;
 return svg;
};
})();
