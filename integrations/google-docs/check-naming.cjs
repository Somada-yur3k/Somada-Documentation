// Current title / Q&A-only scope checks. No live Google Docs writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..'),title='A Web-Based Physics and Circuits Laboratory Management System with AI Capabilities for NU Fairview';
const html=fs.readFileSync(path.join(root,'Docs.html'),'utf8');
const data=vm.runInNewContext(html.match(/<script>\s*\/\*[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'')+'; DATA');
assert.equal(data.meta.title,title);
assert(html.includes('<title>'+title+'</title>'));
assert(!/\bSOMADA\b/.test(html));
assert(!data.entities.some(e=>e.name==='FORECAST_RESULT'));
assert(data.useCases.find(u=>u.id==='uc-askq').briefDescription.startsWith('The authenticated Q&A chatbot'));
assert.equal(data.useCases.find(u=>u.id==='uc-askq').actors,'Class Representative, Faculty');
assert(data.gaps.find(g=>g.id==='14').proposed.includes('outside the current AI scope'));
assert(data.gaps.find(g=>g.id==='16').proposed.includes('do not generate AI-written'));
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1920,height:1825}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const base=`http://127.0.0.1:${server.address().port}/`;
    await page.goto(base+'index.html');
    assert.equal(await page.locator('h1').innerText(),title);
    assert(!/\bSOMADA\b/.test(await page.locator('body').innerText()));
    await page.screenshot({path:path.join(os.tmpdir(),'laboratory-title-home.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile home has no horizontal overflow');
    await page.setViewportSize({width:1920,height:1825});
    await page.goto(base+'assets/figures-v2/usecase-diagram-source.html?export=1');
    await page.waitForFunction(()=>window.__done);
    assert(!/\bSOMADA\b/.test(await page.locator('svg').textContent()));
    const bounds=await page.evaluate(()=>{
      const text=[...document.querySelectorAll('svg > text')].find(n=>n.textContent.startsWith('A Web-Based'));
      const b=text.getBBox();return{x:b.x,y:b.y,w:b.width,h:b.height,boundary:BOUNDARY};
    });
    assert(bounds.x>=bounds.boundary.x&&bounds.x+bounds.w<=bounds.boundary.x+bounds.boundary.w,'Full title fits use-case boundary');
    if(process.argv.includes('--render'))await page.locator('#stage svg').screenshot({path:path.join(root,'assets/figures-v2/usecase-diagram-draft.png')});
    await page.locator('#stage svg').screenshot({path:path.join(os.tmpdir(),'laboratory-title-usecase.png')});
    assert.deepEqual(errors,[]);
    console.log('Naming / scope checks passed: full title, no retired visible brand, Q&A-only AI, legacy ERD notice, mobile home and use-case title bounds.');
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
