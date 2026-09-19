// Generates an admin-run setup bundle; never writes to Supabase.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
// Geometry generation requires only DOM construction, not browser layout.
const dummy=()=>({setAttribute(){},append(){},querySelector:dummy,textContent:''});
const context={window:{},document:{createElementNS:dummy}};vm.createContext(context);
vm.runInContext(read('assets/system-diagrams/process-activities.js'),context);
const models=JSON.parse(read('assets/figures-v2/dfd-level2-compact/dfd-level2-model.json'));
const quotes=s=>"'"+s.replace(/'/g,"''")+"'";
const inserts=models.map(model=>{context.window.SystemProcessActivity(model);const seed=JSON.parse(JSON.stringify(context.window.SystemActivityGeometry[model.id]));seed.name=model.name;const value=JSON.stringify(seed),hash=crypto.createHash('sha256').update(value).digest('hex');return `insert into public.activity_public_templates(diagram_id,base_hash,seed) values (${quotes(model.id)},${quotes(hash)},${quotes(value)}::jsonb) on conflict(diagram_id) do nothing;`;}).join('\n');
const content=read('integrations/activity-editor/public-schema.sql').replace('-- TEMPLATE_INSERTS: the build script inserts the five canonical seeds here.',inserts);
const target=path.join(__dirname,'public-setup.sql');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n')!==content.replace(/\r\n/g,'\n'))throw Error('Public setup bundle is stale. Rebuild it.');}
else fs.writeFileSync(target,content);
console.log('Public setup bundle '+(process.argv.includes('--check')?'verified':'generated')+' for five canonical diagrams; no database writes.');
