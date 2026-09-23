const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),os=require('node:os');
const C=require('../../assets/activity-editor/core.js'),root=path.resolve(__dirname,'../..');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1450,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const base='http://127.0.0.1:'+server.address().port;
 await page.route('**/assets/activity-editor/config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.ActivityEditorConfig={supabaseUrl:'',publishableKey:''}"}));
 await page.goto(base+'/Activity-Editor.html');await page.waitForFunction(()=>window.__activityEditorReady);
 assert.match(await page.locator('#status').textContent(),/not configured/);assert(await page.locator('#save').isDisabled());
 for(const id of ['p1','p2','p3','p4','p5']){
  await page.selectOption('#diagram',id);
  const seed=await page.evaluate(id=>window.SystemActivityGeometry[id],id);C.validate(seed,C.empty());assert.equal(C.review(seed,C.empty()).length,0,id+' authored geometry valid');
  for(const [key,n]of Object.entries(seed.nodes).filter(([,n])=>n.kind==='flow-final')){
   assert.equal(await page.locator('[data-node="'+key+'"] circle').count(),1,'Flow Final circle remains visible in editor');
   assert.equal(await page.locator('[data-node="'+key+'"] path').count(),1,'Flow Final X remains visible in editor/export');
  }
  assert.deepEqual(await page.evaluate(()=>window.__activityEditorFindings.filter(f=>f.level==='error')),[],id+' labels fit');
  const moved={nodes:{},edges:{}};const [key,n]=Object.entries(seed.nodes).find(([,n])=>n.kind==='action');moved.nodes[key]={dx:12,dy:8};C.validate(seed,moved);
  for(let i=0;i<seed.routes.length;i++){const r=seed.routes[i],points=C.route(seed,moved,i);for(let j=1;j<points.length;j++)assert(points[j][0]===points[j-1][0]||points[j][1]===points[j-1][1]);if(r.from===key)assert.deepEqual(points[0],[r.points[0][0]+12,r.points[0][1]+8]);if(r.to===key)assert.deepEqual(points.at(-1),[r.points.at(-1)[0]+12,r.points.at(-1)[1]+8]);}
  assert.throws(()=>C.validate(seed,{nodes:{unknown:{dx:0,dy:0}},edges:{}}));assert.throws(()=>C.validate(seed,{nodes:{[key]:{dx:Infinity,dy:0}},edges:{}}));
 }
 await page.selectOption('#diagram','p1');let node=page.locator('[data-node="choose"]');const box=await node.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+25,box.y+box.height/2+12,{steps:5});await page.mouse.up();
 assert(!(await page.locator('#undo').isDisabled()));await page.locator('#label').fill('Choose operation');await page.click('#apply-label');assert.match(await node.textContent(),/Choose operation/);await page.click('#undo');assert.match(await node.textContent(),/Choose access/);await page.click('#redo');
 await page.locator('[data-edge="0"]').first().dispatchEvent('pointerdown',{button:0});const handle=page.locator('.handle').first();assert(await handle.count());const hb=await handle.boundingBox();await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await page.mouse.down();await page.mouse.move(hb.x+hb.width/2+45,hb.y+hb.height/2,{steps:5});await page.mouse.up();
 const reviewDownload=page.waitForEvent('download');await page.click('#download');const review=JSON.parse(fs.readFileSync(await (await reviewDownload).path(),'utf8'));assert(review.state.nodes.choose);assert(Object.keys(review.state.edges).length);assert.equal(review.format,1);
 await page.locator('#import').setInputFiles({name:'wrong-version.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...review,baseHash:'wrong'}))});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Different diagram'));assert.match(await node.textContent(),/Choose operation/);
 await page.locator('#import').setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(review))});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Imported locally'));
 const svgDownload=page.waitForEvent('download');await page.click('#svg-export');const svg=fs.readFileSync(await (await svgDownload).path(),'utf8');assert(!svg.includes('data-editor-only'));assert(!svg.includes('class="handle"'));assert(svg.includes('marker-end'));assert(!svg.includes('<script'));
 await page.reload();await page.waitForFunction(()=>window.__activityEditorReady);await page.click('#recover');assert.match(await page.locator('[data-node="choose"]').textContent(),/Choose operation/);
 // Mock public access: no login endpoints, auth tokens, memberships or approval.
 await page.route('**/assets/activity-editor/config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.ActivityEditorConfig={supabaseUrl:'https://activity-test.invalid',publishableKey:'sb_publishable_test'}"}));
 let row=null,conflict=false,offline=false,entries=[],saveRequests=0;
 await page.route('https://activity-test.invalid/**',async route=>{const req=route.request(),url=new URL(req.url()),body=req.postDataJSON();let data;
  assert(!req.headers().authorization,'Public browser sends no auth token');
  if(url.pathname==='/rest/v1/activity_public_drafts')data=row?[row]:[];
  else if(url.pathname==='/rest/v1/activity_public_history')data=entries;
  else if(url.pathname==='/rest/v1/rpc/activity_public_save'){
   saveRequests++;
   if(offline)return route.abort('failed');
   if(conflict)return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({message:'Revision conflict: someone saved first.'})});
   row={diagram_id:body.p_diagram,base_hash:body.p_hash,revision:(row?.revision||0)+1,state:body.p_state};entries=[{...row,note:body.p_note,created_at:new Date().toISOString()},...entries];data={revision:row.revision};
  }else throw Error('Unexpected private API: '+url.pathname);
  return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.reload();await page.waitForFunction(()=>window.__activityEditorReady);
 assert.equal(await page.locator('#login,#publish').count(),0);assert(!(await page.locator('#save').isDisabled()));
 assert.match(await page.locator('[data-node="choose"]').textContent(),/Choose access/,'Shared load wins over old local edits');
 await page.fill('#note','Adviser review: use shorter label');await page.locator('[data-node="choose"]').dispatchEvent('pointerdown',{button:0,pointerId:1,clientX:400,clientY:300});await page.locator('#canvas').dispatchEvent('pointerup');await page.fill('#label','Choose operation');await page.click('#apply-label');await page.click('#save');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Saved shared revision'));assert.equal(row.revision,1);assert.match(await page.locator('#history-list').textContent(),/Adviser review/);
 // Another browser's latest save must win on refresh; unsaved local backup remains recoverable.
 const viewer=await browser.newPage();await viewer.route('**/assets/activity-editor/config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.ActivityEditorConfig={supabaseUrl:'https://activity-test.invalid',publishableKey:'sb_publishable_test'}"}));
 await viewer.route('https://activity-test.invalid/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify([row])}));
 await viewer.goto(base+'/System-Diagrams.html');await viewer.waitForFunction(()=>window.__activityPublicReady);assert.match(await viewer.locator('#activity-p1').textContent(),/Choose operation/);await viewer.close();
 conflict=true;await page.fill('#label','Unsaved local wording');await page.click('#apply-label');await page.click('#save');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Revision conflict'));assert.match(await page.locator('[data-node="choose"]').textContent(),/Unsaved local wording/);
 row.state={nodes:{choose:{dx:0,dy:0,label:'Latest public wording'}},edges:{}};row.revision=2;
 await page.reload();await page.waitForFunction(()=>window.__activityEditorReady);assert.match(await page.locator('[data-node="choose"]').textContent(),/Latest public wording/);assert.equal(saveRequests,2,'Refreshing never saves');
 await page.click('#recover');assert.match(await page.locator('[data-node="choose"]').textContent(),/Unsaved local wording/);
 conflict=false;offline=true;await page.click('#save');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Failed to fetch'));assert.match(await page.locator('[data-node="choose"]').textContent(),/Unsaved local wording/);
 await page.screenshot({path:path.join(os.tmpdir(),'activity-editor-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});assert(await page.locator('#diagram').isVisible());await page.screenshot({path:path.join(os.tmpdir(),'activity-editor-mobile.png')});assert.deepEqual(errors,[]);
 console.log('PASS: five diagrams, dragging, attached routes, labels, undo/redo, recovery, exports, anonymous save/history, refresh precedence, shared viewer, conflicts and offline protection. Live database migration still required.');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
