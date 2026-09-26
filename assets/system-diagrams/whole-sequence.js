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
    msg('rep','system','Log in with issued credentials'),msg('system','db','Check D1 role and laboratory scope'),msg('system','rep','Login result; permitted operations',true))]),
  group('alt','Select one requester route',[
   branch('Class Representative: laboratory; Request Type; Schedule Type; room/slot; equipment; review/submit',
    msg('rep','system','Choose laboratory; Group / Student Only; Schedule Type'),
    msg('system','rep','Automatic Approval Route preview',true),
    msg('rep','system','Select class, student(s), schedule and room'),
    msg('rep','system','Select Equipment / Materials and requested quantities'),
    msg('rep','system','Review Information; read-only Approval Route; Submit')),
   branch('Faculty: Laboratory Activity uses assigned block; Non-Laboratory Activity collects Schedule Type + slot',
    msg('faculty','system','Choose laboratory and activity kind'),
    msg('system','faculty','Assigned block / Schedule Type and slot',true),
    msg('faculty','system','Equipment / Materials; read-only route; submit'))]),
  group('ref','Validate request before saving',[
   branch('2.1 availability; 2.2 validates role, class, students, schedule and items. Invalid forms do not create a hold',
    msg('system','db','Read schedule, stock and current revision'))]),
  group('alt','Exactly one approval route for a valid request',[
   branch('Faculty on-schedule laboratory OR non-laboratory activity: no approval row',msg('system','db','Save Approved; applicable holds')),
   branch('Class Representative on-schedule, or out-of-schedule with assigned Faculty available',
    msg('system','db','Save Pending; applicable holds'),msg('system','rep','Pending; assigned Faculty reviewer',true),msg('faculty','system','Open routed revision; approve / reject')),
   branch('Faculty out-of-schedule, or Class Representative out-of-schedule with Faculty unavailable',
    msg('system','db','Save Pending; Dean is current reviewer'),msg('dean','system','Open routed revision; approve / reject'))]),
  group('opt','Final decision on a routed current revision',[
   branch('2.3 checks the assigned reviewer and current revision; 2.4 saves final Approved / Rejected. No escalation',
    msg('system','db','Save decision; release rejected hold'))]),
  group('alt','Return the actual requester\'s result only',[
   branch('Class Representative request: Pending remains visible until the selected reviewer decides',msg('system','rep','Own status / history; current reviewer',true)),
   branch('Faculty request: Approved without review, or Pending / final Dean decision',msg('system','faculty','Own status / history; Dean only if required',true))])
 ]},
 {id:2,title:'Reservation changes, equipment release, returns and reporting',intro:'Continued from Page 1. Status actions are independent; issuance requires final approval.',groups:[
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
    msg('system','head','Item shares; use/unit; Top 5; frequency + log',true))]),
  group('alt','Optional informational AI services - select a service, or skip',[
   branch('Either requester, not both: D4 inventory + D8 knowledge; own D9 history; no schedule / status lookup',
    msg('rep','system','Ask laboratory question'),msg('faculty','system','Ask laboratory question'),
    msg('system','db','Read D4 / D8; log D9'),msg('system','rep','Verified answer / unavailable',true),msg('system','faculty','Verified answer / unavailable',true)),
   branch('Head Lab forecast: D4 stock, D5 actual history and D2 item references; read-only, no purchase or stock update',
    msg('head','system','Request next-month forecast'),msg('system','db','Read history and stock'),msg('system','head','Advice / Insufficient history',true))])
 ]}
];
// Independent operations can be requested separately; they are not issuance prerequisites.
pages[0].groups.push(group('alt','View Status - select the actual requester',[
 branch('Class Representative: own records only; Pending remains visible',
  msg('rep','system','Open own View Status record'),msg('system','db','Read D2 owned status/history'),msg('system','rep','Own status/history; current reviewer',true)),
 branch('Faculty: own records only; review of others is a separate routed action',
  msg('faculty','system','Open own View Status record'),msg('system','db','Read D2 owned status/history'),msg('system','faculty','Own status/history; current reviewer',true))
]));
pages[1].groups.unshift(group('alt','Optional action inside View Status - choose one eligible action, or skip',[
 branch('Eligible edit/reschedule: retain Request Type; validate new revision and recheck automatic route',
  msg('system','db','Save valid revision / keep invalid unchanged')),
 branch('Eligible cancellation: 2.2 Cancellation Result goes directly to 2.4; no new Faculty/Dean review',
  msg('system','db','Save Cancelled; release hold'))
]));
pages[1].groups.push(group('opt','Other independent operations',[
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
 const font=30,guardFont=22,guardLine=guardFont*1.15,frameHeader=34,guardGap=13,frameGap=8;
 const planned=page.groups.map(group=>({...group,branches:group.branches.map(branch=>({...branch,
  lines:wrap('['+branch.guard+']',guardFont,1660),messages:branch.messages.map(m=>{
   const lines=wrap((++number)+'. '+m.label,font,Math.max(640,Math.abs(positions[m.to]-positions[m.from])-36));
   measure.font=font+'px Arial';const labelWidth=Math.max(...lines.map(line=>measure.measureText(line).width));
   return {...m,number,lines,labelWidth,height:lines.length*font*1.15+18};
  })}))}));
 const total=planned.reduce((sum,g)=>sum+frameHeader+g.branches.reduce((n,b)=>n+b.lines.length*guardLine+guardGap+b.messages.reduce((s,m)=>s+m.height,0),0)+frameGap,0);
 // Preserve text size; grow the portrait canvas if content requires it.
 const bottom=Math.max(H-90,285+total),height=bottom+90;
 svg.setAttribute('viewBox',`0 0 ${W} ${height}`);
 lifelines.querySelectorAll('line').forEach(n=>n.setAttribute('y2',bottom));
 let y=285;
 for(const group of planned){
  const start=y;const frame=el('rect',{x:20,y,width:1760,height:1,fill:'none',stroke:'#555','stroke-width':1.5},frames);
  el('rect',{x:20,y,width:1760,height:frameHeader-2,fill:'#eef1f4'},frames);
  text(messages,35,y+25,[group.kind+'  '+group.title],24,'start',true);y+=frameHeader;
  group.branches.forEach((branch,index)=>{
   if(index)el('line',{x1:20,y1:y,x2:1780,y2:y,stroke:'#555','stroke-dasharray':'7 5'},frames);
   el('rect',{x:30,y,width:1740,height:branch.lines.length*guardLine+guardGap-3,fill:'#fff'},frames);
   text(messages,45,y+guardFont,branch.lines,guardFont,'start');y+=branch.lines.length*guardLine+guardGap;
   for(const m of branch.messages){
    const a=positions[m.from],b=positions[m.to],arrowY=y+m.height-9;
    const labelX=Math.max(30+m.labelWidth/2,Math.min(W-30-m.labelWidth/2,(a+b)/2));
    const label=text(messages,labelX,y+font,m.lines,font);label.dataset.messageLabel=String(m.number);
    label.setAttribute('stroke','#fff');label.setAttribute('stroke-width','7');label.setAttribute('paint-order','stroke');label.setAttribute('stroke-linejoin','round');
    el('path',{d:`M${a} ${arrowY} H${b}`,fill:'none',stroke:'#111','stroke-width':2,...(m.reply?{'stroke-dasharray':'8 6'}:{}),'marker-end':`url(#arrow-${page.id})`,'data-step':m.number,'data-from':m.from,'data-to':m.to},messages);
    y+=m.height;
   }
  });
  y+=frameGap;frame.setAttribute('height',y-start);
 }
 text(svg,900,height-32,[page.id===1?'Continue on Page 2 - same actors; finally approved requests proceed to issuance':'End of overview - optional services are independent; detailed processes remain available separately'],23);
 const section=document.createElement('section');section.className='sequence-page';section.id='sequence-whole-'+page.id;section.append(svg);document.querySelector('main').append(section);
});
window.SystemWholeSequencePages=pages;
window.__wholeSequenceReady=true;
})();
