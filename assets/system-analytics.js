/* Read-only audit UI. Escapes content and checks snapshot source fingerprints. */
(async function(){
 'use strict';
 const $=id=>document.getElementById(id),escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const badge=(status,label)=>`<span class="status ${escape(status)}">${escape(label||({pass:'Linked',fail:'Needs review',pending:'Pending',fixed:'Fixed'}[status]))}</span>`;
 const link=(href,label)=>`<a href="${escape(href)}">${escape(label)}</a>`;
 const percent=(n,d)=>d?Math.round(n*100/d):0;
 function sourceForFingerprint(source,path){
  const normalized=source.replace(/\r\n/g,'\n');
  if(!/\.html$/i.test(path))return normalized;
  // Live Server inserts this marked block immediately before </body>.
  // Remove only that transport-added block, not authored scripts, comments,
  // whitespace, or any document/diagram content. A normal static host is unchanged.
  return normalized.replace(/^<!-- Code injected by live-server -->\n<script>\n([\s\S]*?)\n<\/script>\n(?=<\/body>)/m,(block,script)=>{
   const knownReload=script.startsWith('\t// <![CDATA[  <-- For SVG support\n')&&
    script.includes("if ('WebSocket' in window)")&&script.includes('function refreshCSS()')&&
    script.includes('var socket = new WebSocket(address);')&&
    script.includes("console.log('Live reload enabled.');")&&script.endsWith('\t// ]]>');
   return knownReload?'':block;
  });
 }
 try{
  const response=await fetch('assets/system-audit.json',{cache:'no-store'});if(!response.ok)throw Error('Audit evidence could not be loaded.');const data=await response.json();
  if(data.version!==1||!Array.isArray(data.features)||!Array.isArray(data.groups))throw Error('Unsupported audit evidence.');
  const pending=data.findings.filter(f=>f.status==='pending'),linked=data.features.filter(f=>f.status==='pass').length,available=data.groups.filter(g=>g.status!=='pending').length,done=data.backlog.filter(b=>/^(done|completed)$/i.test(b.status)).length;
  const metrics=[['Feature trace coverage',percent(linked,data.features.length)+'%',`${linked} / ${data.features.length} main use cases linked`],['Artifact availability',percent(available,data.groups.length)+'%',`${available} / ${data.groups.length} current artifacts · ERD pending`],['Open review items',pending.length,'Consultation decisions + missing ERD'],['Recorded implementation',percent(done,data.backlog.length)+'%',`${done} / ${data.backlog.length} backlog items marked complete`]];
  $('metrics').innerHTML=metrics.map(([label,value,note],i)=>`<article class="metric ${i===0?'primary':''}"><span class="label">${escape(label)}</span><strong class="value">${escape(value)}</strong><p>${escape(note)}</p></article>`).join('');
  $('model-grid').innerHTML=data.groups.map((g,i)=>`<a class="model-card ${g.status}" href="${escape(g.href)}"><span class="index">MODEL 0${i+1}</span><h3>${escape(g.name)}</h3><span class="score">${g.percent===null?'Pending':g.percent+'%'}</span><div class="bar" aria-hidden="true"><span style="width:${g.percent||0}%"></span></div><small>${g.percent===null?'No current ERD to validate':`${g.passed} / ${g.total} structural checks`}</small></a>`).join('');
  const c=data.counts;$('inventory').innerHTML=[['actors',c.actors],['main use cases',c.mainUseCases],['supporting use cases',c.supportingUseCases],['events',c.events],['L0 exchanges',c.l0],['L1 flows',c.l1],['child processes',c.children],['L2 boundary realizations',c.l2]].map(([name,n])=>`<span><strong>${n}</strong> ${name}</span>`).join('');
  const parents=[...new Set(data.features.map(f=>f.parent))].sort();$('process-filter').innerHTML+=parents.map(p=>`<option value="${p}">Process ${p.slice(1)}.0</option>`).join('');
  function renderFeatures(){const q=$('feature-search').value.trim().toLowerCase(),p=$('process-filter').value;const rows=data.features.filter(f=>(!p||f.parent===p)&&(!q||[f.name,...f.actors,...f.steps,...f.backlog,...f.stores].join(' ').toLowerCase().includes(q)));$('trace-count').textContent=`${rows.length} of ${data.features.length} features`;
   $('features').innerHTML=rows.map(f=>`<tr><td>${link('Docs.html#'+f.docId,f.name)}<small>Table ${f.table}</small>${f.note?`<small>${escape(f.note)}</small>`:''}</td><td>${f.actors.map(escape).join('<br>')}</td><td>${link('Docs.html#backlog','Backlog '+f.backlog.join(', '))}<small>${f.events} event${f.events===1?'':'s'} mapped</small></td><td>${link('assets/figures-v2/dfd-level2-compact/dfd-level2-compact.html?process='+f.parent,f.steps.map(s=>s.slice(1)).join(' · '))}<small>${f.stores.length?f.stores.map(s=>s.toUpperCase()).join(', '):'No direct store exchange'}</small><details><summary>Flow IDs</summary><small>${f.flowIds.map(escape).join('<br>')}</small></details></td><td>${badge(f.status)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No matching features. Try another search or process.</td></tr>';
  }
  $('feature-search').addEventListener('input',renderFeatures);$('process-filter').addEventListener('change',renderFeatures);renderFeatures();
  function renderFindings(){const selected=$('finding-filter').value;$('findings').innerHTML=data.findings.filter(f=>selected==='all'||f.status===selected).map(f=>`<article class="finding ${escape(f.status)}">${badge(f.status)} <span class="muted">${escape(f.id)}</span><h3>${escape(f.title)}</h3><p>${escape(f.detail)}</p>${link(f.href,'Review source ↗')}</article>`).join('');}
  $('finding-filter').addEventListener('change',renderFindings);renderFindings();
  $('stores').innerHTML=data.stores.map(s=>`<details><summary>${escape(s.number)} · ${escape(s.name)}</summary><p>Reads: ${escape(s.readers.join(', ')||'None in this scope')}<br>Writes: ${escape(s.writers.join(', ')||'Pre-populated; maintenance policy pending')}<br>${escape(s.schemaStatus)}</p></details>`).join('');
  $('check-filter').innerHTML+=data.groups.filter(g=>g.total).map(g=>`<option value="${g.id}">${escape(g.name)}</option>`).join('');
  function renderChecks(){const group=$('check-filter').value;$('checks').innerHTML=data.checks.filter(c=>!group||c.group===group).map(c=>`<li>${badge(c.status,c.status==='pass'?'Pass':'Fail')} ${link(c.href,c.label)}</li>`).join('');}
  $('check-filter').addEventListener('change',renderChecks);renderChecks();
  $('sources').innerHTML=data.sources.map(s=>`<li>${link(s.path,s.path)}<code>SHA-256: ${escape(s.sha256)}</code></li>`).join('');
  $('audit-footer').textContent=`Audit generated ${new Date(data.generatedAt).toLocaleString('en-PH',{timeZone:'Asia/Manila'})} (Manila) · Local-source evidence only · No live Google Docs changes`;
  // Do not silently present an old green score after the documentation changes.
  if(!crypto.subtle){$('load-state').classList.add('error');$('load-state').textContent='Snapshot loaded; source freshness cannot be verified here. Open via HTTPS or localhost. Percentages are hidden until verification.';return;}
  const stale=await Promise.all(data.sources.map(async s=>{const r=await fetch(s.path,{cache:'no-store'});if(!r.ok)throw Error('Cannot verify source: '+s.path);const bytes=new TextEncoder().encode(sourceForFingerprint(await r.text(),s.path));const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')!==s.sha256?s.path:null;}));
  if(stale.some(Boolean))throw Error('Audit snapshot is stale. Rebuild the evidence before using percentages. Changed: '+stale.filter(Boolean).join(', '));
  $('audit-content').hidden=false;$('load-state').textContent='Source-verified snapshot · Automated model checks and pending consultation items are reported separately.';
  window.__auditReady=true;
 }catch(error){$('load-state').classList.add('error');$('load-state').textContent=error.message+' Run the local audit build and refresh this page.';window.__auditError=error.message;}
})();
