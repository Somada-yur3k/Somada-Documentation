/* Shared, deterministic draft validation. No AI claims and no network calls. */
(function(root){
  'use strict';
  const empty=()=>({texts:{},diagrams:{}});
  function validate(seed,state){
    if(!state || typeof state!=='object' || Array.isArray(state) || Object.keys(state).some(k=>!['texts','diagrams'].includes(k))) throw Error('Unsupported draft format.');
    const plain=x=>x && typeof x==='object' && !Array.isArray(x);
    if(!plain(state.texts)||!plain(state.diagrams)||JSON.stringify(state).length>1000000)throw Error('Invalid or oversized draft.');
    for(const [id,value] of Object.entries(state.texts)) {
      if(!seed.fields.some(f=>f.id===id)||typeof value!=='string'||value.length>50000)throw Error('Unknown document field or invalid text: '+id);
    }
    for(const [id,patches] of Object.entries(state.diagrams)) {
      const diagram=seed.diagrams.find(d=>d.id===id);
      if(!diagram||!plain(patches))throw Error('Unknown diagram.');
      for(const [key,patch] of Object.entries(patches)){
        if(!diagram.items.some(i=>i.key===key)||!plain(patch)||Object.keys(patch).some(k=>!['label','removed'].includes(k)))throw Error('Unknown diagram item.');
        if(patch.label!==undefined&&(typeof patch.label!=='string'||patch.label.length>200))throw Error('Labels must be at most 200 characters.');
        if(patch.removed!==undefined&&typeof patch.removed!=='boolean')throw Error('Invalid removal flag.');
      }
    }
    return state;
  }
  function diff(before,after){
    const result=[];
    const add=(area,id,a,b)=>{if(JSON.stringify(a)!==JSON.stringify(b))result.push({area,id,before:a??null,after:b??null});};
    for(const id of new Set([...Object.keys(before.texts),...Object.keys(after.texts)]))add('Documentation',id,before.texts[id],after.texts[id]);
    for(const id of new Set([...Object.keys(before.diagrams),...Object.keys(after.diagrams)])){
      const a=before.diagrams[id]||{},b=after.diagrams[id]||{};
      for(const key of new Set([...Object.keys(a),...Object.keys(b)]))add(id,key,a[key],b[key]);
    }
    return result;
  }
  function review(seed,state){
    validate(seed,state);const findings=[];
    const add=(level,target,message)=>findings.push({level,target,message});
    const active=(d,i)=>!state.diagrams[d.id]?.[i.key]?.removed;
    const label=(d,i)=>state.diagrams[d.id]?.[i.key]?.label??i.label;
    for(const f of seed.fields){
      const value=state.texts[f.id]??f.text;
      if(f.text.trim()&&!value.trim())add('error',f.id,'Required content is blank. Restore it or explain the intended scope change.');
      if(/\b(\w+)\s+\1\b/i.test(value))add('suggestion',f.id,'Possible repeated word. Review in context.');
      if(/\b(?:TBD|TODO|lorem ipsum)\b/i.test(value))add('warning',f.id,'Unfinished placeholder wording.');
      if(/\b(?:SOMADA|MYSADD1)\b/.test(value))add('suggestion',f.id,'Check retired system naming or course-code spelling against the approved title / MSYADD1.');
      if(value!==f.text && f.table && value.trim().length<12)add('suggestion',f.id,'Short table entry: check whether the actor, action, condition and outcome are clear.');
    }
    for(const d of seed.diagrams){
      for(const i of d.items){
        if(!active(d,i)){
          add('warning',d.id+'/'+i.key,'Removed '+i.label+'. Review linked descriptions/events and the corresponding diagrams; removal is not proof that the requirement is obsolete.');continue;
        }
        const name=label(d,i);
        if(!name.trim())add('error',d.id+'/'+i.key,'Visible diagram item has an empty label.');
        if(name!==i.label)add('warning',d.id+'/'+i.key,'Renamed item: check the same terminology in descriptions, events and other DFD levels.');
        if(name.length>55)add('warning',d.id+'/'+i.key,'Long label may overlap nearby routes. Inspect the A4 preview before publishing.');
        if(i.kind==='flow'){
          for(const end of [i.source,i.target]){
            const node=d.items.find(n=>n.kind==='node'&&n.id===end);
            if(node&&!active(d,node))add('error',d.id+'/'+i.key,'Connector still references a removed node: '+end+'. Remove/restore the related items together.');
          }
          if(d.id!=='usecase'&&/^(submit|approve|reject|manage|generate|delete)\s/i.test(name))add('suggestion',d.id+'/'+i.key,'DFD flows should name exchanged data (noun phrases), not actions.');
        }
      }
    }
    const uc=seed.diagrams.find(d=>d.id==='usecase');
    if(uc)for(const link of seed.links){
      const item=uc.items.find(i=>i.id===link.diagramId&&i.kind==='node');
      if(item&&!active(uc,item))add('error','usecase/'+item.key,'Use case removed but '+link.title+' still exists in '+link.docId+' and its linked event rows. Resolve the requirement before publishing.');
      if(item&&active(uc,item)&&!uc.items.some(i=>i.kind==='flow'&&active(uc,i)&&(i.source===item.id||i.target===item.id)))add('error','usecase/'+item.key,'Use case has no remaining actor association or dependency.');
    }
    const l1=seed.diagrams.find(d=>d.id==='dfd1'),l0=seed.diagrams.find(d=>d.id==='dfd0');
    if(l1){
      for(const d of seed.diagrams.filter(d=>d.id.startsWith('dfd2-'))){
        for(const child of d.items.filter(i=>i.parentFlow)){
          const parent=l1.items.find(i=>i.id===child.parentFlow&&i.kind==='flow');
          if(parent&&active(d,child)&&(!active(l1,parent)||label(d,child)!==label(l1,parent)))add('error',d.id+'/'+child.key,'Level 2 boundary flow no longer matches Level 1: '+child.parentFlow+'.');
        }
        for(const parent of l1.items.filter(i=>i.kind==='flow'&&(i.source===d.parent||i.target===d.parent)&&active(l1,i))){
          if(!d.items.some(i=>i.parentFlow===parent.id&&active(d,i)))add('error',d.id,'Missing Level 2 realization of '+parent.label+'.');
        }
      }
      if(l0)for(const item of l0.items.filter(i=>i.kind==='flow')){
        const parent=l1.items.find(i=>i.kind==='flow'&&i.id===item.id);
        if(parent&&(active(l0,item)!==active(l1,parent)||(active(l0,item)&&label(l0,item)!==label(l1,parent))))add('error','dfd0/'+item.key,'Context / Level 1 boundary mismatch: '+item.label+'.');
      }
    }
    add('pending','erd','Current ERD is still pending. No schema completeness score is claimed.');
    return findings;
  }
  const api={empty,validate,diff,review};root.WorkspaceCore=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
