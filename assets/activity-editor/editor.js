(async function(){
'use strict';
const C=window.ActivityEditorCore,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',config=window.ActivityEditorConfig||{};
let id='p1',seed,hash,state=C.empty(),selection=null,undo=[],redo=[],drag=null,busy=false,revision=0,remoteLoaded=false,history=[],saved=C.empty();
const seeds={},hashes={};
function status(message){$('status').textContent=message;}
function element(tag,attrs={},parent){const n=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))n.setAttribute(key,value);parent?.append(n);return n;}
function configured(){return /^https:\/\/[a-z0-9.-]+$/.test(config.supabaseUrl||'')&&!!config.publishableKey&&!String(config.publishableKey).startsWith('sb_secret_');}
function key(){return 'activity-editor-v1:'+id;}
function remember(){try{localStorage.setItem(key(),JSON.stringify({baseHash:hash,state,note:$('note').value}));}catch{status('Browser backup unavailable. Export review JSON before leaving.');}}
function checkpoint(before){undo.push(before);if(undo.length>60)undo.shift();redo=[];remember();render();}
function change(fn){if(busy)return;const before=C.clone(state);try{fn();C.validate(seed,state);checkpoint(before);}catch(error){state=before;status(error.message);render();}}
function render(){
 const svg=window.ActivityDrawing.draw(seed,state,selection);
 $('canvas').replaceChildren(svg);
 $('undo').disabled=busy||!undo.length;$('redo').disabled=busy||!redo.length;
 const findings=C.review(seed,state);
 for(const g of svg.querySelectorAll('.node')){const n=seed.nodes[g.dataset.node],t=g.querySelector('text');if(!t)continue;const b=t.getBBox(),p=state.nodes[g.dataset.node]||{dx:0,dy:0};if(b.x<n.x+p.dx+3||b.x+b.width>n.x+p.dx+n.w-3||b.y<n.y+p.dy+3||b.y+b.height>n.y+p.dy+n.h-3)findings.push({level:'error',message:'Label does not fit: '+g.dataset.node+'. Shorten it or insert a line break.'});}
 $('findings').replaceChildren();for(const f of findings){const li=document.createElement('li');li.textContent=f.level.toUpperCase()+': '+f.message;$('findings').append(li);}if(!findings.length){const li=document.createElement('li');li.textContent='No shape overlap or shape-crossing errors found. Review arrow crossings and label placement visually.';$('findings').append(li);}
 window.__activityEditorFindings=findings;
 $('save').disabled=busy||!remoteLoaded;$('load').disabled=busy||!configured();$('history').disabled=busy||!configured();$('recover').disabled=busy;
}
function select(type,key){selection={type,key};const n=type==='node'?seed.nodes[key]:seed.routes[key];$('selection').textContent=type==='node'?key+' · '+n.kind:'Arrow '+(+key+1)+' · '+n.from+' → '+n.to;
 const editable=type==='edge'||['action','decision'].includes(n.kind);$('label').disabled=$('apply-label').disabled=!editable;$('label').value=editable?(type==='node'?state.nodes[key]?.label??n.title:state.edges[key]?.label??n.guard??''):'';render();}
function svgPoint(event){const svg=$('canvas').querySelector('svg');return new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());}
const canvas=$('canvas');
canvas.addEventListener('pointerdown',event=>{
 if(busy||event.button!==0)return;const handle=event.target.closest('[data-handle]'),node=event.target.closest('[data-node]'),edge=event.target.closest('[data-edge]');
 if(handle){drag={type:'edge',key:handle.dataset.handle,segment:+handle.dataset.segment,before:C.clone(state),point:svgPoint(event),points:C.route(seed,state,+handle.dataset.handle)};}
 else if(node){select('node',node.dataset.node);drag={type:'node',key:node.dataset.node,before:C.clone(state),point:svgPoint(event)};}
 else if(edge){select('edge',edge.dataset.edge);return;}else return;
 canvas.setPointerCapture(event.pointerId);event.preventDefault();
});
canvas.addEventListener('pointermove',event=>{
 if(!drag)return;const p=svgPoint(event),dx=p.x-drag.point.x,dy=p.y-drag.point.y;state=C.clone(drag.before);
 if(drag.type==='node'){const n=seed.nodes[drag.key],patch=state.nodes[drag.key]||{dx:0,dy:0};patch.dx=Math.max(-n.x,Math.min(seed.width-n.x-n.w,Math.round(patch.dx+dx)));patch.dy=Math.max(100-n.y,Math.min(seed.height-n.y-n.h,Math.round(patch.dy+dy)));state.nodes[drag.key]=patch;}
 else {let ps=C.clone(drag.points),j=drag.segment;if(j===-1){const a=ps[0],b=ps.at(-1),next=ps[1],previous=ps.at(-2),vertical=a[0]===next[0];const start=[a[0]+Math.sign(next[0]-a[0])*16,a[1]+Math.sign(next[1]-a[1])*16],end=[b[0]+Math.sign(previous[0]-b[0])*16,b[1]+Math.sign(previous[1]-b[1])*16];ps=vertical?[a,start,[p.x,start[1]],[p.x,end[1]],end,b]:[a,start,[start[0],p.y],[end[0],p.y],end,b];}
  else{const vertical=ps[j][0]===ps[j+1][0],axis=vertical?0:1,delta=vertical?dx:dy;ps[j][axis]=Math.round(ps[j][axis]+delta);ps[j+1][axis]=Math.round(ps[j+1][axis]+delta);}
  state.edges[drag.key]={...state.edges[drag.key],points:ps};
 }
 try{C.validate(seed,state);}catch{state=C.clone(drag.before);}render();
});
canvas.addEventListener('pointerup',()=>{if(!drag)return;const before=drag.before;drag=null;if(C.diff(before,state).length){checkpoint(before);status('Local draft changed. Save shared draft to share with members.');}});
canvas.addEventListener('pointercancel',()=>{if(drag){state=drag.before;drag=null;render();}});
canvas.addEventListener('keydown',event=>{if(!selection||selection.type!=='node'||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const step=event.shiftKey?10:2;change(()=>{const p=state.nodes[selection.key]||{dx:0,dy:0};p.dx+=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0;p.dy+=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;state.nodes[selection.key]=p;});canvas.querySelector(`[data-node="${selection.key}"]`)?.focus();});
function download(name,value,type){const url=URL.createObjectURL(new Blob([value],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download').onclick=()=>download('activity-'+id+'-review.json',JSON.stringify({format:1,diagram:id,baseHash:hash,revision,state,note:$('note').value,changesSinceLoaded:C.diff(saved,state),history,exportedAt:new Date().toISOString()},null,2),'application/json');
$('svg-export').onclick=()=>{const svg=canvas.querySelector('svg').cloneNode(true);svg.querySelectorAll('[data-editor-only]').forEach(n=>n.remove());svg.querySelectorAll('[class],[tabindex],[role]').forEach(n=>{n.removeAttribute('class');n.removeAttribute('tabindex');n.removeAttribute('role');});download('activity-'+id+'-draft.svg',new XMLSerializer().serializeToString(svg),'image/svg+xml');};
$('apply-label').onclick=()=>{if(!selection)return;change(()=>{const {type,key}=selection;if(type==='node')state.nodes[key]={dx:0,dy:0,...state.nodes[key],label:$('label').value};else state.edges[key]={...state.edges[key],label:$('label').value};});};
$('undo').onclick=()=>{if(undo.length){redo.push(C.clone(state));state=undo.pop();remember();render();}};
$('redo').onclick=()=>{if(redo.length){undo.push(C.clone(state));state=redo.pop();remember();render();}};
$('reset').onclick=()=>{if(confirm('Reset this local diagram to the authored layout? Shared data is unchanged until you save.'))change(()=>state=C.empty());};
$('note').oninput=remember;
$('import').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>1000000)throw Error('Review file is too large.');const doc=JSON.parse(await file.text());if(doc.format!==1||doc.diagram!==id||doc.baseHash!==hash)throw Error('Different diagram or authored version. Select the matching diagram; stale drafts need manual review.');C.validate(seed,doc.state);if(!confirm('Replace local draft with this imported draft?'))return;change(()=>state=C.clone(doc.state));$('note').value=typeof doc.note==='string'?doc.note.slice(0,2000):'';remember();status('Imported locally, not yet saved online.');}catch(e){status(e.message);}finally{event.target.value='';}};
async function request(path,body){const response=await fetch(config.supabaseUrl+path,{method:body===undefined?'GET':'POST',cache:'no-store',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});const result=await response.json().catch(()=>null);if(!response.ok)throw Error(response.status===404?'Public database setup is missing. Run public-setup.sql in Supabase.':result?.message||'Connection failed ('+response.status+').');return result;}
async function task(fn){if(busy)return;busy=true;$('diagram').disabled=true;render();try{await fn();}catch(e){status(e.message+' Your local backup is retained.');}finally{busy=false;$('diagram').disabled=false;render();}}
async function getHistory(){history=await request('/rest/v1/activity_public_history?diagram_id=eq.'+id+'&select=*&order=revision.desc&limit=50');$('history-list').replaceChildren();for(const row of history){const li=document.createElement('li');li.textContent='r'+row.revision+' · Anonymous edit · '+new Date(row.created_at).toLocaleString()+' — '+row.note;const restore=document.createElement('button');restore.textContent='Restore as local draft';restore.onclick=()=>{if(busy)return;try{if(row.base_hash!==hash)throw Error('This revision belongs to another authored version.');C.validate(seed,row.state);if(confirm('Restore revision '+row.revision+' locally? Save for everyone to share the restored version.')){change(()=>state=C.clone(row.state));status('Restored locally; save to create a new shared revision.');}}catch(e){status(e.message);}};li.append(document.createElement('br'),restore);$('history-list').append(li);}}
async function loadLatest(){remoteLoaded=false;const rows=await request('/rest/v1/activity_public_drafts?diagram_id=eq.'+id+'&select=*');const row=rows[0];if(row&&row.base_hash!==hash)throw Error('Shared draft belongs to a different authored version. Administrator migration is required.');const next=row?.state||C.empty();C.validate(seed,next);state=C.clone(next);saved=C.clone(state);revision=row?.revision||0;remoteLoaded=true;selection=null;undo=[];redo=[];$('label').value='';$('label').disabled=$('apply-label').disabled=true;$('note').value='';$('selection').textContent='Latest shared version loaded. Click a shape or arrow to edit.';status('Latest shared revision '+revision+' loaded. No login or approval required.');try{await getHistory();}catch(e){status('Latest shared revision '+revision+' loaded; history unavailable: '+e.message);}}
$('load').onclick=()=>task(async()=>{if(C.diff(saved,state).length&&!confirm('Load latest shared version? Your unsaved work remains in Recover local backup.'))return;await loadLatest();});
$('save').onclick=()=>task(async()=>{if(!remoteLoaded)throw Error('Load latest shared version first.');C.validate(seed,state);const snapshot=C.clone(state);const row=await request('/rest/v1/rpc/activity_public_save',{p_diagram:id,p_expected:revision,p_hash:hash,p_state:snapshot,p_note:$('note').value.trim()||'Diagram edit'});revision=row.revision;saved=snapshot;remember();status('Saved shared revision '+revision+'. Everyone sees this version after refreshing.');try{await getHistory();}catch(e){status('Saved shared revision '+revision+'; history unavailable: '+e.message);}});
$('history').onclick=()=>task(getHistory);
$('recover').onclick=()=>{if(busy)return;try{const local=JSON.parse(localStorage.getItem(key())||'null');if(!local)throw Error('No local backup for this diagram.');if(local.baseHash!==hash)throw Error('Local backup uses an older authored version.');C.validate(seed,local.state);if(confirm('Recover the local backup? Shared data stays unchanged until Save for everyone.')){change(()=>state=C.clone(local.state));$('note').value=local.note||'';status('Local backup recovered. Save for everyone to share it.');}}catch(e){status(e.message);}};
async function switchDiagram(next){id=next;seed=seeds[id];hash=hashes[id];state=C.empty();saved=C.empty();selection=null;undo=[];redo=[];revision=0;remoteLoaded=false;history=[];$('history-list').replaceChildren();$('note').value='';$('label').value='';$('label').disabled=$('apply-label').disabled=true;render();if(configured()){status('Loading latest shared version…');await task(loadLatest);}else status('Database not configured. Local editing/export and Recover local backup are available.');}
$('diagram').onchange=()=>switchDiagram($('diagram').value);
try{
 const response=await fetch('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json');if(!response.ok)throw Error('Cannot load canonical diagrams.');const models=await response.json();
 for(const model of models){window.SystemProcessActivity(model);const geometry=C.clone(window.SystemActivityGeometry[model.id]);geometry.name=model.name;seeds[model.id]=geometry;const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(geometry)));hashes[model.id]=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
 const requested=new URLSearchParams(location.search).get('process');if(Object.hasOwn(seeds,requested))id=requested;
 $('diagram').value=id;$('connection').textContent='Public collaboration: no accounts or approval. Notes and revision history are visible to everyone. Avoid private information.';await switchDiagram(id);window.__activityEditorReady=true;
}catch(e){status('Editor unavailable: '+e.message+'. Use HTTPS or localhost and serve the site, not file://.');}
window.addEventListener('beforeunload',event=>{if(C.diff(saved,state).length){event.preventDefault();event.returnValue='';}});
})();
