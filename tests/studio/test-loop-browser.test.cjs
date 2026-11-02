'use strict';
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
 const serverScript=[
  "const http=require('http'),fs=require('fs'),path=require('path');",
  "http.createServer((req,res)=>{",
  "let p;try{p=path.resolve(process.cwd(),'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}",
  "catch(_){res.writeHead(400).end();return;}",
  "if(!p.startsWith(process.cwd()+path.sep)){res.writeHead(403).end();return;}",
  "fs.stat(p,(e,st)=>{if(e||!st.isFile()){res.writeHead(404).end();return;}",
  "res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');",
  "fs.createReadStream(p).pipe(res);});",
  "}).listen(8878,'127.0.0.1');"
 ].join('\n');
 const server=spawn(process.execPath,['-e',serverScript],{stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8878/studio/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#app').waitFor({state:'visible',timeout:20000});
  const original=await page.evaluate(()=>JSON.stringify(S.p?.dateien||{}));
  await page.locator('#kiCodeBtn').click();
  // Browser runtime is never invoked for user-supplied source: test this separately.
  await page.evaluate(()=>{
   window.SDKITestLoop.run([{path:'app.js',content:'window.__notExecutedByStaticTests=true'}],{},
    window.SDKICodeReview.review,window.SDStudioTaskAgent.projectGraph);
  });
  assert.equal(await page.evaluate(()=>window.__notExecutedByStaticTests),undefined);
  await page.locator('#kiResult').fill([
   '### Datei: index.html','~~~html',
   '<a href="/faq" target="_blank">FAQ</a>',
   '~~~'
  ].join('\n'));
  await page.locator('#kiAnalyse').click();
  await page.locator('#kiRepairPrepare').click();
  const initialDiagnostics=await page.evaluate(()=>({
    review:document.querySelector('#kiReviewSummary')?.textContent,
    repair:document.querySelector('#kiRepairStatus')?.textContent,
    proposals:document.querySelectorAll('.kiRepairAfter').length,
    status:document.querySelector('#kiStatus')?.textContent,
    selected:[...document.querySelectorAll('#kiFiles input:checked')].map(e=>e.dataset.path)
  }));
  assert.equal(await page.locator('#kiTestRun').isEnabled(),true,JSON.stringify(initialDiagnostics));
  await page.locator('#kiTestRun').click();
  assert.match(await page.locator('#kiTestStatus').innerText(),/1 behoben, 0 neu/);
  assert.equal(await page.locator('#kiRepairStage').isEnabled(),true);
  assert.equal(await page.evaluate(()=>window.__notExecutedByStaticTests),undefined);
  assert.equal(await page.evaluate(()=>JSON.stringify(S.p?.dateien||{})),original);
  await page.locator('#kiRepairStage').click();
  const stagedDiagnostics=await page.evaluate(()=>({
    status:document.querySelector('#kiRepairStatus')?.textContent,
    testStatus:document.querySelector('#kiTestStatus')?.textContent,
    diffVisible:!document.querySelector('#kiDiff')?.hidden,
    diffText:document.querySelector('#kiDiffNew')?.textContent?.slice(0,300),
    files:[...document.querySelectorAll('#kiFiles input:checked')].map(e=>e.dataset.path)
  }));
  assert.match(await page.locator('#kiDiffNew').innerText(),/noopener noreferrer/,JSON.stringify(stagedDiagnostics));
  assert.equal(await page.evaluate(()=>window.__notExecutedByStaticTests),undefined);
  assert.equal(await page.evaluate(()=>JSON.stringify(S.p?.dateien||{})),original);
  await page.locator('#kiDiffClose').click();
  await page.locator('#kiClose').click();
  const regression=await page.evaluate(()=>{
   const loop=window.SDKITestLoop,review=window.SDKICodeReview.review,graph=window.SDStudioTaskAgent.projectGraph;
   const base=loop.run([{path:'index.html',content:'<h1>ok</h1>'}],{},review,graph);
   const next=loop.run([{path:'index.html',content:'<h1>ok</h1><script src="missing.js"></script>'}],{},review,graph);
   return loop.compare(base,next);
  });
  assert.equal(regression.canStage,false);
  assert(regression.introduced.some(f=>f.rule==='asset'));
  assert.deepEqual(errors,[]);
  console.log('Safe static before/after browser loop passed');
 }finally{
  await browser?.close();
  server.kill();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
