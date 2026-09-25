// Read-only check of paper numbering and the actual sync payload. No Google writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/Docs.html');
  await page.waitForFunction(()=>document.querySelectorAll('.a4-page-number').length>0,null,{timeout:120000});
  assert.deepEqual(errors,[]);
  const sourceLists=await page.locator('.doc-source #overview ol').evaluateAll(lists=>lists.map(list=>({start:list.start,type:getComputedStyle(list).listStyleType,items:[...list.children].map(li=>li.textContent.trim())})));
  assert.deepEqual(sourceLists.map(list=>list.items.length),[4,6,8,6]);
  assert(sourceLists.every(list=>list.start===1&&list.type==='decimal'));
  const client=fs.readFileSync(path.join(root,'assets/google-doc-sync.js'),'utf8');
  await page.addScriptTag({content:client.replace('window.GoogleDocSync={ open };','window.__collectNumberedSection=collectSection;')});
  const blocks=await page.evaluate(async()=>(await window.__collectNumberedSection('overview')).blocks);
  const expected=sourceLists.flatMap(list=>list.items.map((text,i)=>(i+1)+'. '+text));
  const exported=blocks.filter(block=>block.role==='list');
  assert.deepEqual(exported.map(block=>block.text),expected,'SOP, objectives, scope and limitations keep all numbers in sync');
  for(const block of exported){
   assert.equal(block.runs[0].start,0);assert.equal(block.runs.at(-1).end,block.text.length);
   block.runs.slice(1).forEach((run,i)=>assert.equal(run.start,block.runs[i].end));
  }
  const printed=await page.locator('.doc-pages .academic-numbered-list li').allTextContents();
  assert.deepEqual(printed.map(text=>text.trim()),sourceLists.flatMap(list=>list.items),'All numbered items survive pagination');
  const pages=page.locator('.doc-pages .pagedjs_page').filter({has:page.locator('.academic-numbered-list')});
  for(let i=0;i<await pages.count();i++)await pages.nth(i).screenshot({path:path.join(os.tmpdir(),'docs-clarity-numbering-'+i+'.png')});
  console.log('PASS: four independently numbered lists (4 SOP, 6 objectives, 8 scope, 6 limitations); complete A4 text and numbered sync paragraphs with valid formatting.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
