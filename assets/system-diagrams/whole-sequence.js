/* Two-page lifecycle overview. Alternatives are guarded, never sequential approvals.
 * The five process-specific diagrams remain available as detailed references. */
(function(){
'use strict';
const actors=[['rep','Class\nRepresentative'],['faculty','Faculty'],['dean','Dean'],['staff','Physics / Circuits\nStaff'],['head','Head Lab'],['system','Laboratory\nWeb System'],['db','Database']];
const msg=(from,to,label,reply=false)=>({from,to,label,reply});
const group=(kind,title,branches)=>({kind:kind==='ref'?'seq':kind,title,branches});
const branch=(guard,...messages)=>({guard,messages});
const pages=[
 {id:1,title:'Account setup, request submission and approval',intro:'Staff act only in their assigned laboratory. Head Lab works across both laboratories.',groups:[
  group('ref','Account setup before first login',[
   branch('Head Lab is already authenticated; Dean and Staff accounts are pre-assigned',
    msg('head','system','Create Faculty account'),msg('system','db','Save verified account'),msg('system','faculty','Faculty credentials',true),
    msg('faculty','head','Verified representative name, Student ID and section'),
    msg('head','system','Create representative; link section / classes'),msg('system','db','Save unique section account'),
    msg('system','faculty','Representative credentials',true),msg('faculty','rep','Manual credential handover'))]),
  group('ref','Authenticated access and request preparation',[
   branch('All five actor lanes use role-scoped login; requester interaction shown for Class Representative',
    msg('rep','system','Log in; choose laboratory'),msg('system','db','Check D1; read D2 / D3 / D4'),msg('system','rep','Login result; schedule and available items',true))]),
  group('alt','Select one requester route',[
   branch('Class Representative: on-schedule non-laboratory OR out-of-schedule',msg('rep','system','Submit Group / Student Only request; select class and students')),
   branch('Faculty: regular scheduled activity OR out-of-schedule',msg('faculty','system','Submit class activity / out-of-schedule request'))]),
  group('ref','Validate request before saving',[
   branch('Validate role, class, students, time and quantities; invalid requests return errors without a hold',
    msg('system','db','Read class, schedule and stock'))]),
  group('alt','Exactly one approval route for a valid request',[
   branch('Faculty regular scheduled activity: no additional academic approval',msg('system','db','Save Approved; hold block')),
   branch('Class Representative on-schedule, or out-of-schedule with assigned Faculty available',
    msg('system','db','Save Pending; hold block'),msg('system','faculty','Routed request for review'),msg('faculty','system','Approve / reject',true)),
   branch('Faculty out-of-schedule, or Class Representative out-of-schedule with Faculty unavailable',
    msg('system','db','Save Pending; hold block'),msg('system','dean','Routed request for review'),msg('dean','system','Approve / reject',true))]),
  group('ref','Decision and confirmation',[
   branch('For routed requests, save D2 decision; rejection releases hold. Notify the actual requester only; no escalation',
    msg('system','db','Save final decision'),msg('system','rep','Own request status / decision',true),msg('system','faculty','Own request status / decision',true))])
 ]},
 {id:2,title:'Equipment release, returns, accountability and reporting',intro:'Continued from Page 1. Only finally approved reservations proceed to issuance.',groups:[
  group('ref','Equipment check and issuance',[
   branch('Assigned Physics / Circuits Staff shown; Head Lab may perform the same authorized issue / return work',
    msg('staff','system','Open approved reservation'),msg('system','db','Read D2 approval; D4 stock'),msg('system','staff','Approved items and borrowers',true),
    msg('staff','system','Check items; record issue'),msg('system','db','Save D5 slip; update D4 / D2'),
    msg('system','rep','Borrowing slip (own request)',true),msg('system','faculty','Borrowing slip (own request)',true))]),
  group('ref','Physical return and reconciliation',[
   branch('Items are returned in person; record good, broken, lost and consumed quantities. Equipment cannot be consumed',
    msg('staff','system','Inspect and record returns'),msg('system','db','Save D5 outcomes; update D4'))]),
  group('alt','Return outcome',[
   branch('Broken / lost balance unresolved: reservation remains Ongoing',
    msg('head','system','Review issue; identify accountable student'),msg('system','db','Read slip and student links'),
    msg('head','system','Create student clearance'),msg('system','db','Save D6 accountability'),
    msg('rep','system','View class clearance'),msg('system','rep','Student, item and status',true)),
   branch('No outstanding balance: reservation is Completed; record each completed session once',
    msg('system','db','Complete D2; write D11 usage'),msg('system','staff','Return / completion result',true))]),
  group('opt','Clearance settlement when applicable',[
   branch('Head Lab verifies settlement; settlement does not automatically complete an unresolved reservation',
    msg('head','system','Record verified settlement'),msg('system','db','Update D6 clearance'))]),
  group('opt','Completed usage and End-Term Report',[
   branch('Head Lab selects laboratory / term; report metrics use completed usage in D11 only',
    msg('head','system','View logs / export report'),msg('system','db','Read completed D11 usage logs'),
    msg('system','head','Average Use; Top 5; Frequency; Recent Activity',true))]),
  group('alt','Optional informational AI services - select a service, or skip',[
   branch('Either requester, not both: D4 inventory + D8 knowledge; own D9 history; no schedule / status lookup',
    msg('rep','system','Ask laboratory question'),msg('faculty','system','Ask laboratory question'),
    msg('system','db','Read D4 / D8; log D9'),msg('system','rep','Verified answer / unavailable',true),msg('system','faculty','Verified answer / unavailable',true)),
   branch('Head Lab forecast: D4 stock, D5 actual history and D2 item references; read-only, no purchase or stock update',
    msg('head','system','Request next-month forecast'),msg('system','db','Read history and stock'),msg('system','head','Advice / Insufficient history',true))])
 ]}
];
// Independent operations can be requested separately; they are not issuance prerequisites.
pages[0].groups.push(group('alt','Optional independent operations - select an authorized action, or skip',[
 branch('Requester: eligible cancellation / rescheduling, or read-only status / history',
  msg('rep','system','Own reservation action'),msg('faculty','system','Own reservation action')),
 branch('Assigned Staff or Head: inventory / disposal; Head only: schedule / daily tasks / account updates',
  msg('staff','system','Inventory / disposal action'),msg('head','system','Administration action'))
]));
const NS='http://www.w3.org/2000/svg',W=1800,H=2546,xs=[100,355,610,865,1120,1390,1680];
const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));parent?.append(n);return n;};
const measure=document.createElement('canvas').getContext('2d');
function wrap(value,font,width){measure.font=font+'px Arial';return value.split('\n').flatMap(line=>{const rows=[];let row='';for(const word of line.split(' ')){if(row&&measure.measureText(row+' '+word).width>width){rows.push(row);row=word;}else row+=(row?' ':'')+word;}return [...rows,row];});}
function text(parent,x,y,rows,size=28,anchor='middle',bold=false){const n=el('text',{'font-size':size,'text-anchor':anchor,'font-family':'Arial, sans-serif','font-weight':bold?700:400,fill:'#111'},parent);rows.forEach((row,i)=>el('tspan',{x,y:y+i*size*1.15},n).textContent=row);return n;}
let number=0;
pages.forEach(page=>{
 const svg=el('svg',{xmlns:NS,viewBox:`0 0 ${W} ${H}`,'data-whole-sequence':page.id,role:'img','aria-label':page.title});
 el('rect',{width:W,height:H,fill:'#fff'},svg);
 const defs=el('defs',{},svg),marker=el('marker',{id:'arrow-'+page.id,viewBox:'0 0 12 12',refX:10,refY:6,markerWidth:7,markerHeight:7,orient:'auto'},defs);
 el('path',{d:'M2 2 L10 6 L2 10',fill:'none',stroke:'#111','stroke-width':1.7},marker);
 text(svg,900,55,[page.intro],23);
 const lifelines=el('g',{},svg),frames=el('g',{},svg),messages=el('g',{},svg);
 const positions=Object.fromEntries(actors.map(([id],i)=>[id,xs[i]]));
 actors.forEach(([id,label],i)=>{
  const x=xs[i],g=el('g',{'data-participant':id},lifelines);
  if(i<5){el('circle',{cx:x,cy:122,r:12,fill:'#fff',stroke:'#111','stroke-width':2},g);el('path',{d:`M${x} 134 v31 m-25 -20 h50 M${x} 165 l-22 26 M${x} 165 l22 26`,fill:'none',stroke:'#111','stroke-width':2},g);}
  else el('rect',{x:x-105,y:112,width:210,height:70,fill:'#fff',stroke:'#111','stroke-width':2},g);
  text(g,x,i<5?220:142,label.split('\n'),25,'middle',true);
  el('line',{x1:x,y1:255,x2:x,y2:2470,stroke:'#999','stroke-width':1.5,'stroke-dasharray':'8 7'},g);
 });
 const font=27;
 const planned=page.groups.map(group=>({...group,branches:group.branches.map(branch=>({...branch,
  lines:wrap(branch.guard,24,1660),messages:branch.messages.map(m=>{
   const lines=wrap((++number)+'. '+m.label,font,Math.max(560,Math.abs(positions[m.to]-positions[m.from])-36));
   return {...m,number,lines,height:lines.length*font*1.15+25};
  })}))}));
 const total=planned.reduce((sum,g)=>sum+40+g.branches.reduce((n,b)=>n+b.lines.length*27.6+15+b.messages.reduce((s,m)=>s+m.height,0),0)+12,0);
 // Preserve text size; grow the portrait canvas if content requires it.
 const bottom=Math.max(H-90,285+total),height=bottom+90;
 svg.setAttribute('viewBox',`0 0 ${W} ${height}`);
 lifelines.querySelectorAll('line').forEach(n=>n.setAttribute('y2',bottom));
 let y=285;
 for(const group of planned){
  const start=y;const frame=el('rect',{x:20,y,width:1760,height:1,fill:'none',stroke:'#555','stroke-width':1.5},frames);
  el('rect',{x:20,y,width:1760,height:37,fill:'#eef1f4'},frames);
  text(messages,35,y+27,[group.kind+'  '+group.title],25,'start',true);y+=40;
  group.branches.forEach((branch,index)=>{
   if(index)el('line',{x1:20,y1:y,x2:1780,y2:y,stroke:'#555','stroke-dasharray':'7 5'},frames);
   el('rect',{x:30,y,width:1740,height:branch.lines.length*27.6+12,fill:'#fff'},frames);
   text(messages,45,y+25,wrap('['+branch.guard+']',24,1660),24,'start');y+=branch.lines.length*27.6+15;
   for(const m of branch.messages){
    const a=positions[m.from],b=positions[m.to],arrowY=y+m.height-9;
    const label=text(messages,Math.min(1480,Math.max(320,(a+b)/2)),y+font,m.lines,font);label.dataset.messageLabel=String(m.number);
    label.setAttribute('stroke','#fff');label.setAttribute('stroke-width','7');label.setAttribute('paint-order','stroke');label.setAttribute('stroke-linejoin','round');
    el('path',{d:`M${a} ${arrowY} H${b}`,fill:'none',stroke:'#111','stroke-width':2,...(m.reply?{'stroke-dasharray':'8 6'}:{}),'marker-end':`url(#arrow-${page.id})`,'data-step':m.number,'data-from':m.from,'data-to':m.to},messages);
    y+=m.height;
   }
  });
  y+=12;frame.setAttribute('height',y-start);
 }
 text(svg,900,height-32,[page.id===1?'Continue on Page 2 - same actors; finally approved requests proceed to issuance':'End of overview - optional services are independent; detailed processes remain available separately'],23);
 const section=document.createElement('section');section.className='sequence-page';section.id='sequence-whole-'+page.id;section.append(svg);document.querySelector('main').append(section);
});
window.__wholeSequenceReady=true;
})();
