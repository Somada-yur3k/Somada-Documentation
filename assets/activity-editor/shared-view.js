// Public read-only projection on System Diagrams. Never saves or changes Git assets.
(async function(){
 const message=document.createElement('p');message.id='activity-shared-status';message.className='notice';
 document.querySelector('.intro')?.append(message);
 message.textContent='Loading latest public Activity Diagrams…';
 if(new URLSearchParams(location.search).get('authored')==='1'){message.textContent='Authored baseline view — shared drafts intentionally excluded for reproducible checks.';window.__activityPublicReady=true;return;}
 try{
  for(let i=0;i<300&&!window.__systemDiagramsReady;i++)await new Promise(r=>setTimeout(r,50));
  if(!window.__systemDiagramsReady)throw Error('Authored diagrams did not finish loading.');
  const config=window.ActivityEditorConfig;if(!config?.supabaseUrl||!config.publishableKey)throw Error('Shared database not configured.');
  const response=await fetch(config.supabaseUrl+'/rest/v1/activity_public_drafts?select=diagram_id,base_hash,revision,state',{cache:'no-store',headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error(response.status===404?'Public database setup has not been installed.':'Shared data unavailable ('+response.status+').');
  const rows=await response.json(),loaded=[],skipped=[];
  for(const row of rows){try{
   const model=window.SystemDiagramChildProcesses.find(m=>m.id===row.diagram_id);if(!model)throw Error('Unknown diagram');
   const seed=window.ActivityEditorCore.clone(window.SystemActivityGeometry[model.id]);seed.name=model.name;
   const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(seed))),hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
   if(hash!==row.base_hash)throw Error('Version mismatch');window.ActivityEditorCore.validate(seed,row.state);
   const svg=window.ActivityDrawing.clean(window.ActivityDrawing.draw(seed,row.state));
   document.querySelector('#activity-'+model.id+' .canvas').replaceChildren(svg);loaded.push(model.id+' r'+row.revision);
  }catch{skipped.push(row.diagram_id);}}
  message.textContent=(loaded.length?'Public shared Activity Diagrams: '+loaded.join(', ')+'. Refresh to see newer saves.':'Authored activities shown; no public saves yet.')+(skipped.length?' Could not apply '+skipped.join(', ')+'; authored fallback retained.':'')+' Shared edits are unreviewed. Static PNG/PDF downloads and Google Docs remain the authored version; print this page or export from the Activity Editor for shared edits.';
 }catch(error){message.textContent='Showing authored Activity Diagrams, not a verified latest shared version. '+error.message;}
 window.__activityPublicReady=true;
})();
