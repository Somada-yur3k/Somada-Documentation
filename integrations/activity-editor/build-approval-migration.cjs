// Generate an admin-reviewed bundle, never connect to Supabase.
// Activity 2 topology changed: custom drafts must be reconciled, not rebased blindly.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'assets/system-diagrams/process-activities.js'),'utf8');
const models=JSON.parse(fs.readFileSync(path.join(root,'assets/figures-v2/dfd-level2-compact/dfd-level2-model.json'),'utf8'));
const oldP2=`}else if(model.id==='p2'){
  dispatch([
   ['availability',365,'View slots?', 'Choose laboratory\\nand schedule','Allowed?', 'Retrieve and display\\navailability',0],
   ['request',640,'Submit /\\nreschedule?', 'Select block / items;\\ncheck availability','Valid?', 'Save request & holds;\\nroute if required',1,0],
   ['cancel',915,'Cancel?', 'Select own request;\\nconfirm cancellation','Eligible?', 'Cancel; release hold;\\nnotify if needed',1],
   ['tracking',1190,'View\\ntracking?', 'Open own status\\nor history','Own records?', 'Display own status\\nand history',3],
   ['approval',1465,'Decide?', 'Faculty / Dean: click\\nApprove or Reject','Pending for\\nthis reviewer?', 'Save decision; advance\\nroute or release hold',2]
  ]);refuseOther('approval',1580);
 `;
const previous=source.replace(/}else if\(model.id==='p2'\)\{[\s\S]*?(?=}else if\(model.id==='p4'\))/,oldP2)
 .replace("const compact=model.id==='p2'","const compact=false")
 .replace('Retrieve finally approved\\nreservation','Retrieve approved\\nreservation')
 .replace('Final approval;\\nstock valid?','Approved;\\nstock valid?');
function seeds(code){
 const ctx={window:{},document:{createElementNS:()=>({setAttribute(){},append(){},textContent:''})}};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 return ['p2','p4'].map(id=>{const model=models.find(m=>m.id===id);ctx.window.SystemProcessActivity(model);const seed=JSON.parse(JSON.stringify(ctx.window.SystemActivityGeometry[id]));seed.name=model.name;return seed;});
}
const hash=s=>crypto.createHash('sha256').update(JSON.stringify(s)).digest('hex');
const before=seeds(previous),after=seeds(source);
let sql=`-- Optional existing-public-setup migration. New projects use public-setup.sql.
-- Review/export drafts first. Refuses ANY customized p2/p4 draft; reconcile manually.
-- Keeps all history. No SQL is run by this generator.
begin;
`;
after.forEach((seed,i)=>{
 const id=['p2','p4'][i],oldHash=hash(before[i]),newHash=hash(seed);
 if(oldHash===newHash)throw Error('Expected changed template '+id);
 sql+=`
do $$declare t public.activity_public_templates%rowtype; d public.activity_public_drafts%rowtype; next_revision integer;
begin
 perform pg_advisory_xact_lock(hashtext('activity-public:${id}'));
 select * into t from public.activity_public_templates where diagram_id='${id}' for update;
 if t.base_hash='${newHash}' then return; end if;
 if t.base_hash is distinct from '${oldHash}' then raise exception 'Unexpected ${id} template; no changes applied. Reconcile manually.'; end if;
 select * into d from public.activity_public_drafts where diagram_id='${id}' for update;
 if d.diagram_id is not null and (d.base_hash is distinct from '${oldHash}' or d.state is distinct from '{"nodes":{},"edges":{}}'::jsonb) then
  raise exception 'Customized or unexpected ${id} draft. Export and reconcile manually; no changes applied.';
 end if;
 next_revision:=coalesce(d.revision,0)+1;
 update public.activity_public_templates set base_hash='${newHash}',seed='${JSON.stringify(seed).replace(/'/g,"''")}'::jsonb where diagram_id='${id}';
 insert into public.activity_public_drafts(diagram_id,base_hash,revision,state) values('${id}','${newHash}',next_revision,'{"nodes":{},"edges":{}}'::jsonb)
 on conflict(diagram_id) do update set base_hash=excluded.base_hash,revision=excluded.revision,state=excluded.state,updated_at=clock_timestamp();
 insert into public.activity_public_history(diagram_id,revision,base_hash,state,note) values('${id}',next_revision,'${newHash}','{"nodes":{},"edges":{}}'::jsonb,'Admin approval alignment: intermediate Faculty approval remains Pending Dean; final approval required before issuance. Previous history retained.');
end $$;
`;
});
sql+='\ncommit;\n';
fs.writeFileSync(path.join(__dirname,'public-approval-migration.sql'),sql);
console.log('Generated guarded p2/p4 approval migration. Customized drafts are refused; no database writes.');
