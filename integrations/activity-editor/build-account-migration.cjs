// Admin-reviewed migration bundle only. Never contacts Supabase.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const context={window:{},document:{createElementNS:()=>({setAttribute(){},append(){},textContent:''})}};
vm.createContext(context);vm.runInContext(read('assets/system-diagrams/process-activities.js'),context);
const model=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json')).find(m=>m.id==='p1');
context.window.SystemProcessActivity(model);const seed=JSON.parse(JSON.stringify(context.window.SystemActivityGeometry.p1));seed.name=model.name;
const old=JSON.parse(JSON.stringify(seed));
for(const [key,title]of Object.entries({'account-input':'Enter Student ID\nand assigned Faculty','account-check':'Check unique ID\nand Faculty account','account-save':'Issue representative\naccount','account-result':'Email credentials\nto assigned Faculty'}))old.nodes[key].title=title;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),before=hash(old),after=hash(seed),quoted=JSON.stringify(seed).replace(/'/g,"''");
const sql=`-- Optional: only if the PREVIOUS public editor setup is already installed.
-- Preserves positional/route edits and history. Stops if account labels were edited.
-- Run manually in Supabase SQL Editor after reviewing/exporting public drafts.
begin;
do $$declare t public.activity_public_templates%rowtype; d public.activity_public_drafts%rowtype; k text;
begin
 perform pg_advisory_xact_lock(hashtext('activity-public:p1'));
 select * into t from public.activity_public_templates where diagram_id='p1' for update;
 if t.base_hash='${after}' then return; end if;
 if t.base_hash is distinct from '${before}' then raise exception 'Unexpected template version; review manually, no change applied'; end if;
 select * into d from public.activity_public_drafts where diagram_id='p1' for update;
 if d.diagram_id is not null then
  if d.base_hash<>'${before}' then raise exception 'Unexpected draft version; no change applied'; end if;
  foreach k in array array['account-input','account-check','account-save','account-result'] loop
   if (d.state->'nodes'->k) ? 'label' then raise exception 'Account label override on %: export and reconcile manually; no change applied',k; end if;
  end loop;
 end if;
 update public.activity_public_templates set base_hash='${after}',seed='${quoted}'::jsonb where diagram_id='p1';
 if d.diagram_id is not null then
  update public.activity_public_drafts set base_hash='${after}',revision=d.revision+1,updated_at=clock_timestamp() where diagram_id='p1';
  insert into public.activity_public_history(diagram_id,revision,base_hash,state,note) values('p1',d.revision+1,'${after}',d.state,'Admin source migration: Head Laboratory creates Class Representative and Faculty accounts; Dean pre-assigned, provisioning pending. Position/route edits preserved.');
 end if;
end $$;
commit;
`;
fs.writeFileSync(path.join(__dirname,'public-account-scope-migration.sql'),sql);
console.log('Generated guarded account-scope migration; no database writes.');
