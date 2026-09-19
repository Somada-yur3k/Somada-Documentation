// Prepare a guarded P2 template migration; never connects to Supabase.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dummy=()=>({setAttribute(){},append(){},querySelector:dummy,textContent:''});
const ctx={window:{},document:{createElementNS:dummy}};vm.createContext(ctx);vm.runInContext(read('assets/system-diagrams/process-activities.js'),ctx);
const model=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json')).find(p=>p.id==='p2');ctx.window.SystemProcessActivity(model);
const seed=JSON.parse(JSON.stringify(ctx.window.SystemActivityGeometry.p2));seed.name=model.name;
const before='0028201f8168c9c0b2962e29cf28eac0c1b41518017f2367607ce109e0cfb9c7',after=crypto.createHash('sha256').update(JSON.stringify(seed)).digest('hex');
const sql=`-- Optional existing Activity Editor migration; NOT a reservation database migration.
-- Run after reviewing/exporting shared drafts. Refuses customized or unknown drafts.
-- Existing history is retained. No SQL is executed by the build script.
begin;
do $$declare t public.activity_public_templates%rowtype; d public.activity_public_drafts%rowtype; next_revision integer;
begin
 perform pg_advisory_xact_lock(hashtext('activity-public:p2'));
 select * into t from public.activity_public_templates where diagram_id='p2' for update;
 if t.base_hash='${after}' then return; end if;
 if t.base_hash is distinct from '${before}' then raise exception 'Unexpected p2 template; reconcile manually. No change applied.'; end if;
 select * into d from public.activity_public_drafts where diagram_id='p2' for update;
 if d.diagram_id is not null and (d.base_hash is distinct from '${before}' or d.state is distinct from '{"nodes":{},"edges":{}}'::jsonb) then
  raise exception 'Customized p2 draft: export and reconcile before migration. No changes applied.';
 end if;
 next_revision:=coalesce(d.revision,0)+1;
 update public.activity_public_templates set base_hash='${after}',seed='${JSON.stringify(seed).replaceAll("'","''")}'::jsonb where diagram_id='p2';
 insert into public.activity_public_drafts(diagram_id,base_hash,revision,state) values('p2','${after}',next_revision,'{"nodes":{},"edges":{}}'::jsonb)
 on conflict(diagram_id) do update set base_hash=excluded.base_hash,revision=excluded.revision,state=excluded.state,updated_at=clock_timestamp();
 insert into public.activity_public_history(diagram_id,revision,base_hash,state,note) values('p2',next_revision,'${after}','{"nodes":{},"edges":{}}'::jsonb,'Reservation Type: Group or Student Only required for both Class Representative schedule variants. Previous history retained.');
end $$;
commit;
`;
fs.writeFileSync(path.join(__dirname,'public-reservation-type-migration.sql'),sql);
console.log('Prepared guarded Activity 2 template migration; no remote writes.');
