// Offline, guarded template migration. Never connects to the shared database.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const parse=text=>Object.fromEntries([...text.matchAll(/values \('(p[1-5])','([a-f0-9]{64})','((?:''|[^'])*)'::jsonb\) on conflict/g)].map(m=>[m[1],{hash:m[2],sql:m[3]}]));
const before=parse(cp.execFileSync('git',['show','HEAD:integrations/activity-editor/public-setup.sql'],{cwd:root,encoding:'utf8'}));
const after=parse(fs.readFileSync(path.join(root,'integrations/activity-editor/public-setup.sql'),'utf8'));
if(Object.keys(before).length!==5||Object.keys(after).length!==5)throw Error('Expected five known template seeds');
let sql='-- Admin review required. Export customized drafts first. All history is retained.\n-- Refuses unknown templates or customized drafts; rollback is atomic. No automatic database writes.\nbegin;\n';
for(const [id,next]of Object.entries(after)){
 const old=before[id];if(old.hash===next.hash)continue;
 sql+=`
do $$declare t public.activity_public_templates%rowtype; d public.activity_public_drafts%rowtype; next_revision integer;
begin
 perform pg_advisory_xact_lock(hashtext('activity-public:${id}'));
 select * into t from public.activity_public_templates where diagram_id='${id}' for update;
 if t.base_hash='${next.hash}' then return; end if;
 if t.base_hash is distinct from '${old.hash}' then raise exception 'Unknown ${id} template: export and reconcile manually. No changes applied.'; end if;
 select * into d from public.activity_public_drafts where diagram_id='${id}' for update;
 if d.diagram_id is not null and (d.base_hash is distinct from '${old.hash}' or d.state is distinct from '{"nodes":{},"edges":{}}'::jsonb) then
  raise exception 'Customized ${id} draft: export and reconcile manually. No changes applied.';
 end if;
 next_revision:=coalesce(d.revision,0)+1;
 update public.activity_public_templates set base_hash='${next.hash}',seed='${next.sql}'::jsonb where diagram_id='${id}';
 insert into public.activity_public_drafts(diagram_id,base_hash,revision,state) values('${id}','${next.hash}',next_revision,'{"nodes":{},"edges":{}}'::jsonb)
 on conflict(diagram_id) do update set base_hash=excluded.base_hash,revision=excluded.revision,state=excluded.state,updated_at=clock_timestamp();
 insert into public.activity_public_history(diagram_id,revision,base_hash,state,note) values('${id}',next_revision,'${next.hash}','{"nodes":{},"edges":{}}'::jsonb,'Admin template update: inventory forecasting and Activity/Flow Final review. Existing history preserved.');
end $$;
`;
}
sql+='\ncommit;\n';
fs.writeFileSync(path.join(__dirname,'public-template-migration.sql'),sql);
console.log('Generated guarded migration from committed setup seeds; no database writes.');
