(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),empty=()=>({nodes:{},edges:{}}),plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const safeKeys=(o,keys)=>Object.keys(o).every(k=>keys.includes(k));
function validate(seed,state){
 if(!plain(state)||!safeKeys(state,['nodes','edges'])||!plain(state.nodes)||!plain(state.edges)||JSON.stringify(state).length>200000)throw Error('Invalid draft structure or size.');
 for(const [key,p]of Object.entries(state.nodes)){
  if(!Object.hasOwn(seed.nodes,key)||!plain(p)||!safeKeys(p,['dx','dy','label']))throw Error('Unknown shape or property.');
  if(!Number.isFinite(p.dx)||!Number.isFinite(p.dy))throw Error('Invalid shape position.');
  const n=seed.nodes[key];if(n.x+p.dx<0||n.y+p.dy<100||n.x+n.w+p.dx>seed.width||n.y+n.h+p.dy>seed.height)throw Error('Keep shapes inside the A4 canvas and below the heading.');
  if(p.label!==undefined&&(typeof p.label!=='string'||!p.label.trim()||p.label.length>180||!['action','decision'].includes(n.kind)))throw Error('Invalid shape label.');
 }
 for(const [key,p]of Object.entries(state.edges)){
  if(!/^\d+$/.test(key)||!seed.routes[+key]||!plain(p)||!safeKeys(p,['points','label']))throw Error('Unknown arrow or property.');
  if(p.label!==undefined&&(typeof p.label!=='string'||p.label.length>100||(seed.routes[+key].guard&&!p.label.trim())))throw Error('A decision arrow needs a guard label.');
  if(p.points!==undefined&&(!Array.isArray(p.points)||p.points.length<2||p.points.length>30||p.points.some(p=>!Array.isArray(p)||p.length!==2||p.some((v,i)=>!Number.isFinite(v)||v<0||v>(i?seed.height:seed.width)))))throw Error('Invalid route coordinates.');
 }
 return state;
}
function route(seed,state,index){
 const r=seed.routes[index],a=state.nodes[r.from]||{dx:0,dy:0},b=state.nodes[r.to]||{dx:0,dy:0};
 const points=clone(state.edges[index]?.points||r.points),first=r.points[0],last=r.points.at(-1);
 const start=[first[0]+a.dx,first[1]+a.dy],end=[last[0]+b.dx,last[1]+b.dy];
 const verticalStart=r.points[0][0]===r.points[1][0],verticalEnd=r.points.at(-1)[0]===r.points.at(-2)[0];
 if(points.length===2&&start[0]!==end[0]&&start[1]!==end[1]){
  const mid=verticalStart?(start[1]+end[1])/2:(start[0]+end[0])/2;
  return verticalStart?[start,[start[0],mid],[end[0],mid],end]:[start,[mid,start[1]],[mid,end[1]],end];
 }
 points[0]=start;points[points.length-1]=end;
 if(points.length>2){points[1][verticalStart?0:1]=start[verticalStart?0:1];points[points.length-2][verticalEnd?0:1]=end[verticalEnd?0:1];}
 const out=[points[0]];
 for(const p of points.slice(1)){const prev=out.at(-1);if(prev[0]!==p[0]&&prev[1]!==p[1])out.push([p[0],prev[1]]);if(prev[0]!==p[0]||prev[1]!==p[1])out.push(p);}
 return out;
}
function diff(before,after){const out=[];for(const area of ['nodes','edges'])for(const key of new Set([...Object.keys(before[area]),...Object.keys(after[area])]))if(JSON.stringify(before[area][key])!==JSON.stringify(after[area][key]))out.push({area,key,before:before[area][key]??null,after:after[area][key]??null});return out;}
function review(seed,state){
 validate(seed,state);const findings=[],nodes=Object.entries(seed.nodes).map(([key,n])=>({key,...n,x:n.x+(state.nodes[key]?.dx||0),y:n.y+(state.nodes[key]?.dy||0)}));
 for(let i=0;i<nodes.length;i++)for(const b of nodes.slice(i+1)){const a=nodes[i];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)findings.push({level:'error',message:'Shapes overlap: '+a.key+' / '+b.key});}
 seed.routes.forEach((r,i)=>{const ps=route(seed,state,i);for(const n of nodes){if([r.from,r.to].includes(n.key))continue;for(let j=1;j<ps.length;j++){const a=ps[j-1],b=ps[j];if(a[0]===b[0]?a[0]>n.x&&a[0]<n.x+n.w&&Math.max(a[1],b[1])>n.y&&Math.min(a[1],b[1])<n.y+n.h:a[1]>n.y&&a[1]<n.y+n.h&&Math.max(a[0],b[0])>n.x&&Math.min(a[0],b[0])<n.x+n.w){findings.push({level:'error',message:'Arrow '+(i+1)+' crosses shape '+n.key});break;}}}});
 for(const [key,p]of Object.entries(state.nodes))if(p.label&&p.label!==seed.nodes[key].title)findings.push({level:'warning',message:'Changed wording: '+key+'. Check its DFD and full description; those are not automatically edited.'});
 for(const [key,p]of Object.entries(state.edges))if(p.label!==undefined&&p.label!==(seed.routes[key].guard||''))findings.push({level:'warning',message:'Changed arrow condition '+(+key+1)+': adviser review required.'});
 return findings;
}
const api={clone,empty,validate,route,diff,review};root.ActivityEditorCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
