/* Shared configurable arrow-label layout for authored UML Activity / Swimlane SVGs.
 * Labels are measured after attachment. Only text placement / wrapping changes;
 * no node, control-flow route, guard, actor or business rule is changed.
 */
(function(){
'use strict';
const FONT=21,GAP=10,NS='http://www.w3.org/2000/svg';
const rect=b=>({x:b.x,y:b.y,w:b.width??b.w,h:b.height??b.h});
const padded=(b,p)=>({x:b.x-p,y:b.y-p,w:b.w+2*p,h:b.h+2*p});
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const touchesNode=(box,node,pad)=>node.kind==='decision'
 ? Math.max(box.x-node.x-node.w/2,node.x+node.w/2-box.x-box.w,0)/(node.w/2+pad*2)+Math.max(box.y-node.y-node.h/2,node.y+node.h/2-box.y-box.h,0)/(node.h/2+pad*2)<1
 : overlap(box,padded(node,pad));
const distance=(a,b)=>Math.hypot(Math.max(a.x-b.x-b.w,b.x-a.x-a.w,0),Math.max(a.y-b.y-b.h,b.y-a.y-a.h,0));
const segments=routes=>routes.flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,route:r,box:{x:Math.min(r.points[i][0],b[0]),y:Math.min(r.points[i][1],b[1]),w:Math.abs(b[0]-r.points[i][0]),h:Math.abs(b[1]-r.points[i][1])}})));
function wrap(value,max){return value.split('\n').flatMap(line=>{const rows=[];let row='';const words=line.split(' ');for(let i=0;i<words.length;i++){const word=words[i]==='/'&&i+1<words.length?words[i]+' '+words[++i]:words[i];if(row&&row.length+word.length+1>max){rows.push(row);row=word;}else row+=(row?' ':'')+word;}rows.push(row);return rows;});}
function setText(t,rows,x,y,font=FONT){
 t.replaceChildren();t.setAttribute('font-size',font);t.setAttribute('text-anchor','middle');
 rows.forEach((row,i)=>{const span=document.createElementNS(NS,'tspan');span.setAttribute('x',x);span.setAttribute('y',y+(i-(rows.length-1)/2)*font*1.16+font*.34);span.textContent=row+(i<rows.length-1?' ':'');t.append(span);});
}
window.SystemArrowLabels={fontSize:FONT,layout(svg,geometry,{fontSize:font=FONT}={}){
 if(!Number.isFinite(font)||font<=0)throw Error('Invalid arrow-label font size');
 svg.setAttribute('data-arrow-label-font-size',font);
 const texts=[...svg.querySelectorAll('[data-flow-label]')],lines=segments(geometry.routes),plans=[];
 // Swimlane dividers are not control-flow arrows, but text must clear them too.
 for(const x of geometry.laneBounds||[])lines.push({route:{from:'lane-divider',to:'lane-divider',guard:null},a:[x,62],b:[x,geometry.height-12],box:{x,y:62,w:0,h:geometry.height-74}});
 const obstacles=[...Object.values(geometry.nodes).map(n=>({...rect(n),kind:n.kind})),...[...svg.querySelectorAll('text:not([data-flow-label])')].map(n=>rect(n.getBBox()))];
 // Measure in a stable order; the solver below reserves constrained slots
 // before flexible labels can occupy them.
 const ordered=texts.map(t=>({t,value:t.getAttribute('data-label-text')||t.textContent,preferred:[Number(t.getAttribute('data-label-x')),Number(t.getAttribute('data-label-y'))],owned:lines.filter(s=>s.route.from===t.getAttribute('data-label-from')&&s.route.to===t.getAttribute('data-label-to')&&s.route.guard===(t.getAttribute('data-label-guard')||null))})).sort((a,b)=>b.value.length-a.value.length);
 const failures=[];
 for(const item of ordered){
  const {t,value,preferred,owned}=item,candidates=[];
  const variants=[value.split('\n'),wrap(value,22),wrap(value,17),wrap(value,12),wrap(value,8)].filter((rows,i,all)=>all.findIndex(r=>r.join('\n')===rows.join('\n'))===i);
  variants.forEach((rows,variant)=>{
   setText(t,rows,0,0,font);const measure=rect(t.getBBox()),w=measure.w,h=measure.h;
   const add=(x,y)=>{
    const box={x:x-w/2,y:y-h/2,w,h};
    if(box.x<8||box.y<8||box.x+w>geometry.width-8||box.y+h>geometry.height-8)return;
    if(obstacles.some(b=>touchesNode(box,b,6))||lines.some(s=>overlap(padded(box,GAP),s.box)))return;
    const near=owned.length?Math.min(...owned.map(s=>distance(box,s.box))):0;
    if(owned.length&&near>44)return;
    // Prefer a small gap from the matching arrow, then the original branch
    // neighborhood. Wrapping is used only when a full line will not fit.
    const score=near*2+Math.hypot(x-preferred[0],y-preferred[1])*.12+(rows.length-1)*80+variant*4;
    candidates.push({rows,x,y,box,score,near});
   };
   add(preferred[0],preferred[1]);
   if(!owned.length){for(const d of [12,24,36,48,64])for(const [dx,dy]of [[0,-d],[0,d],[-d,0],[d,0]])add(preferred[0]+dx,preferred[1]+dy);return;}
   for(const s of owned){
    const horizontal=s.a[1]===s.b[1],lo=horizontal?s.box.x:s.box.y,length=horizontal?s.box.w:s.box.h;
    const preferredAlong=horizontal?preferred[0]:preferred[1];
    const positions=[.15,.3,.5,.7,.85].map(f=>lo+length*f).concat(Math.max(lo,Math.min(lo+length,preferredAlong)));
    // Narrow gaps between a decision and the next action may lie between
    // proportional samples; inspect them at a small fixed interval too.
    for(let offset=10;offset<length;offset+=10)positions.push(lo+offset);
    for(const along of positions)for(const gap of [12,18,26,36,44])for(const sign of [-1,1]){
     if(horizontal)add(along,s.a[1]+sign*(gap+h/2));else add(s.a[0]+sign*(gap+w/2),along);
    }
   }
  });
  candidates.sort((a,b)=>a.score-b.score);
  if(!candidates.length){setText(t,value.split('\n'),preferred[0],preferred[1],font);failures.push(t.getAttribute('data-flow-label'));continue;}
  plans.push({...item,candidates});
 }
 if(failures.length)throw Error('No clear '+font+' px label position: '+failures.join(', '));
 // Reserve the most constrained remaining position first. Backtracking keeps
 // a nearby flexible label from forcing a tight branch's label far away.
 let attempts=0;
 function solve(todo,placed){
  if(!todo.length)return placed;
  if(++attempts>25000)return null;
  const choices=todo.map(plan=>({plan,options:plan.candidates.filter(c=>!placed.some(p=>overlap(c.box,padded(p.best.box,8))))})).sort((a,b)=>a.options.length-b.options.length);
  const {plan,options}=choices[0];if(!options.length)return null;
  for(const best of options.slice(0,100)){const solution=solve(todo.filter(p=>p!==plan),placed.concat({plan,best}));if(solution)return solution;}
  return null;
 }
 const solution=solve(plans,[]);if(!solution)throw Error(font+' px labels need more branch spacing');
 for(const {plan:{t},best} of solution){
  // Centre using the measured glyph box, not an assumed font ascent.
  setText(t,best.rows,0,0,font);const actual=t.getBBox();setText(t,best.rows,best.x-actual.x-actual.width/2,best.y-actual.y-actual.height/2,font);
  t.setAttribute('data-arrow-gap',best.near.toFixed(2));
 }
 return texts.length;
}};
})();
