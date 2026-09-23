// Local browser regression only; no Google requests or real keys.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../assets/google-doc-sync.js'),'utf8');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage();
    await page.route('**/*',route=>{
      assert.equal(route.request().url(),'http://sync-test.local/');
      return route.fulfill({contentType:'text/html',body:'<!doctype html><body></body>'});
    });
    const open=async()=>{await page.goto('http://sync-test.local/');await page.addScriptTag({content:source});await page.evaluate(()=>GoogleDocSync.open());};
    const key='test-only-not-a-real-secret-1234567890';
    const endpoint='https://script.google.com/macros/s/TEST_DEPLOYMENT/exec';
    await open();
    assert.equal(await page.locator('[name=key]').inputValue(),'');
    assert.equal(await page.locator('[name=remember]').isChecked(),false);
    await page.locator('[name=endpoint]').fill(endpoint);
    await page.locator('[name=key]').fill(key);
    await page.locator('[data-save]').click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('lab-google-doc-final-term-connection')),null);
    await page.locator('[name=remember]').check();
    await page.locator('[data-save]').click();
    await open();
    assert.equal(await page.locator('[name=key]').inputValue(),key);
    assert.equal(await page.locator('[name=remember]').isChecked(),true);
    await page.locator('[name=endpoint]').fill(endpoint.replace('TEST_DEPLOYMENT','OTHER'));
    assert.equal(await page.locator('[name=key]').inputValue(),'');
    assert.equal(await page.locator('[name=remember]').isChecked(),false);
    await page.locator('[data-forget]').click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('lab-google-doc-final-term-connection')),null);
    await open();
    assert.equal(await page.locator('[name=key]').inputValue(),'');
    await page.evaluate(()=>localStorage.setItem('lab-google-doc-final-term-connection','bad json'));
    await open();
    assert.equal(await page.locator('[name=key]').inputValue(),'');
    await page.evaluate(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}}));
    await page.locator('[name=key]').fill(key);
    await page.locator('[data-save]').click();
    assert.match(await page.locator('.gdoc-status').innerText(),/storage is unavailable/);
    await page.locator('[data-forget]').click();
    assert.match(await page.locator('.gdoc-status').innerText(),/storage could not be accessed/);
    console.log('PASS: opt-in remember, reload, endpoint isolation, forget, malformed/blocked storage. No external writes.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
