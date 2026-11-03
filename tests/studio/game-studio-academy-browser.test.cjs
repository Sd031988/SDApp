'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const allowed=new Map([
 ['/studio/game-studio/academy/index.html','text/html'],
 ['/studio/game-studio/academy/academy.js','application/javascript'],
 ['/studio/game-studio/academy/academy.css','text/css'],
 ['/icon.svg','image/svg+xml']
]);
(async()=>{
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost'),type=allowed.get(u.pathname);
  if(!type){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',type);
  fs.createReadStream(path.join(root,u.pathname)).on('error',()=>{if(!res.headersSent)res.writeHead(404).end();}).pipe(res);
 });
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const origin='http://127.0.0.1:'+server.address().port;
  await page.goto(origin+'/studio/game-studio/academy/index.html');
  await page.waitForSelector('[data-lesson]');
  assert.match(await page.title(),/SD Game-Studio Academy/);
  assert.equal(await page.locator('[data-track]').count(),4);
  assert.equal(await page.locator('[data-lesson]').count(),4);
  assert.equal(await page.locator('#progressCount').innerText(),'0 von 16');
  assert.equal(await page.locator('[data-complete]').isDisabled(),true);
  await page.locator('[data-choice="0"]').click();
  assert.equal(await page.locator('[data-complete]').isDisabled(),true,'Wrong quiz must not unlock completion');
  await page.locator('[data-task]').nth(0).check();
  await page.locator('[data-task]').nth(1).check();
  await page.locator('[data-task]').nth(2).check();
  await page.locator('[data-choice="1"]').click();
  assert.equal(await page.locator('[data-complete]').isEnabled(),true);
  await page.locator('[data-complete]').click();
  assert.equal(await page.locator('#progressCount').innerText(),'1 von 16');
  await page.reload();
  await page.waitForSelector('[data-lesson]');
  assert.equal(await page.locator('#progressCount').innerText(),'1 von 16','Progress survives reload');
  await page.locator('[data-track="3"]').click();
  assert.match(await page.locator('.lesson-body h2').innerText(),/Großwelt kennenlernen/);
  assert.equal(await page.locator('.action-callout a').getAttribute('href'),'../large-world.html');
  assert.deepEqual(errors,[],'No JavaScript errors on desktop');
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await page.waitForSelector('[data-track]');
  assert.equal(await page.locator('[data-track]').count(),4);
  assert.equal(await page.locator('#progressCount').innerText(),'1 von 16');
  assert.deepEqual(errors,[],'No JavaScript errors on mobile');
  console.log('Academy browser smoke tests passed');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
