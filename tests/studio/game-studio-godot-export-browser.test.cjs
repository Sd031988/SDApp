'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const allowed=new Map([
  ['/studio/game-studio/godot-export.html','text/html'],
  ['/studio/game-studio/godot-export-ui.js','application/javascript'],
  ['/studio/game-studio/godot-export-core.js','application/javascript'],
  ['/studio/game-studio/scene-core.js','application/javascript'],
  ['/studio/game-studio/glb-core.js','application/javascript'],
  ['/studio/game-studio/project-assets.js','application/javascript'],
  ['/icon.svg','image/svg+xml']
]);
(async()=>{
 const server=http.createServer((req,res)=>{
   const pathname=new URL(req.url,'http://localhost').pathname;
   const mime=allowed.get(pathname);
   if(!mime){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',mime);
   fs.createReadStream(path.join(root,pathname)).on('error',()=>{if(!res.headersSent)res.writeHead(404).end();}).pipe(res);
 });
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1260,height:820},acceptDownloads:true});
  const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>requests.push(new URL(request.url()).pathname));
  await page.goto('http://127.0.0.1:'+server.address().port+'/studio/game-studio/godot-export.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.dataset.ready==='true');
  assert.equal(await page.locator('#download').isEnabled(),false);
  await page.locator('#demo').click();
  assert.equal(await page.locator('#sceneObjects').innerText(),'6');
  assert.equal(await page.locator('#download').isEnabled(),true);
  const started=page.waitForEvent('download');
  await page.locator('#download').click();
  const download=await started;
  assert.match(download.suggestedFilename(),/Godot4\.zip/);
  const bytes=fs.readFileSync(await download.path());
  assert.equal(bytes.readUInt32LE(0),0x04034b50);
  assert.match(await page.locator('#status').innerText(),/ZIP erstellt/);
  await page.locator('#file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":3,"cells":[]}')});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Import fehlgeschlagen'));
  assert.equal(await page.locator('#download').isEnabled(),false);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#demo').isVisible(),true);
  assert.equal(await page.locator('#fileButton').isVisible(),true);
  assert.deepEqual(errors,[]);
  assert(requests.every(value=>allowed.has(value)),'Only locally hosted scripts and assets should load.');
  console.log('SD Game-Studio Godot Export: Chromium UI, ZIP download, import validation, responsive layout passed.');
 } finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(err=>{console.error(err);process.exitCode=1;});
