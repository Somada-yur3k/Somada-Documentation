// Read-only audit of diagram, full descriptions and event-table coverage.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'Docs.html'),'utf8');
const data=vm.runInNewContext(html.match(/<script>\s*\/\*[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'')+'; DATA');
const diagram=fs.readFileSync(path.join(root,'assets/figures-v2/usecase-diagram-source.html'),'utf8');
const model=vm.runInNewContext(diagram.slice(diagram.indexOf('const ACTORS ='),diagram.indexOf('const CANVAS_W'))+'; ({ACTORS,BASE_UC,SUPPORT_UC,RELATIONSHIPS})');
const roles={classrep:'Class Representative',faculty:'Faculty',dean:'Dean',headlab:'Head Laboratory',physics:'Physics Laboratory Staff',circuits:'Circuits Laboratory Staff'};
const names=new Map([...model.BASE_UC,...model.SUPPORT_UC].map(u=>[u.id,u.label.join(' ')]));
const sorted=values=>Array.from(new Set(values)).sort();
const split=value=>value.split(',').map(s=>s.trim());
assert.equal(data.useCases.length,20);
assert.equal(new Set(data.useCases.map(u=>u.id)).size,20);
assert.deepEqual(sorted(data.useCases.map(u=>u.diagramId)),sorted(model.BASE_UC.map(u=>u.id)));
const dependencies=[];
data.useCases.forEach((u,i)=>{
  assert.equal(u.table,i+3);
  assert.equal(u.useCaseName,names.get(u.diagramId));
  assert.equal(u.title,u.useCaseName);
  const expected=model.ACTORS.filter(a=>a.uses.includes(u.diagramId)).map(a=>roles[a.id]);
  assert.deepEqual(sorted(split(u.actors)),sorted(expected),u.id+' actors');
  u.related.forEach(name=>assert([...names.values()].includes(name),'Unknown related use case: '+name));
  u.dependencies.forEach(d=>{
    assert.equal(d.name,names.get(d.diagramId));
    assert(d.condition && d.behavior);
    dependencies.push(d.type==='include'?u.diagramId+'|'+d.diagramId+'|include':d.diagramId+'|'+u.diagramId+'|extend');
  });
  const events=data.events.filter(e=>e.diagramId===u.diagramId);
  assert(events.length,u.id+' has an event');
  assert.deepEqual(sorted(events.flatMap(e=>split(e.source))),sorted(expected),u.id+' event actors');
  assert(!/^(Unchanged|Renamed|Also genuinely|Genuinely missing)/.test(u.briefDescription));
});
assert.equal(dependencies.length,11);
assert.deepEqual(sorted(dependencies),sorted(model.RELATIONSHIPS.map(d=>d.from+'|'+d.to+'|'+d.type)));
assert.equal(data.events.length,24);
data.events.forEach(e=>{
  assert(model.BASE_UC.some(u=>u.id===e.diagramId));
  assert.equal(e.useCase,names.get(e.diagramId));
});
assert(!/View My Dashboard|View Laboratory Dashboard/.test(JSON.stringify([data.useCases,data.events])));
assert(html.includes('Table 23: Gap Analysis'));
assert(html.includes('{uc.briefDescription}'));
console.log('Alignment passed: 20 main descriptions (Tables 3–22), 10 supporting use cases / 11 dependencies, 24 events; names, roles, references and numbering match.');
