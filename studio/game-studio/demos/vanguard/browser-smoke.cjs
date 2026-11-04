'use strict';
/* Vanguard browser smoke: runs on GitHub Actions with Playwright/Chromium.
 * Never writes user project files. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
const prefix='/studio/game-studio/';
const allow=new Map([
 ['demos/vanguard/index.html','text/html'],
 ['demos/vanguard/style.css','text/css'],
 ['demos/vanguard/game.js','application/javascript'],
 ['demos/vanguard/mission-core.js','application/javascript'],
 ['large-world-core.js','application/javascript'],
 ['large-world-terrain.js','application/javascript']
]);
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname;
 if(!name.startsWith(prefix)){res.writeHead(404).end();return;}
 const relative=name.slice(prefix.length),mime=allow.get(relative);
 if(!mime){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',mime);
 fs.createReadStream(path.join(root,'studio/game-studio',relative))
  .on('error',()=>{if(!res.headersSent)res.writeHead(404).end();}).pipe(res);
});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const url='http://127.0.0.1:'+server.address().port+prefix+'demos/vanguard/index.html';
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.dataset.gameReady==='true'||!document.querySelector('#failure').hidden,undefined,{timeout:30000});
  assert.equal(await page.locator('body').getAttribute('data-game-ready'),'true',await page.locator('#failure').textContent());
  await page.waitForFunction(()=>Number.parseInt(document.querySelector('#drawCalls').textContent)>0,undefined,{timeout:30000});
  assert.match(await page.locator('#cellCount').innerText(),/^9 ZELLEN$/);
  assert.equal(await page.locator('.objective').count(),3);
  assert.match(await page.locator('#killCount').innerText(),/00 \/ 07/);
  const initial=await page.locator('#targetDistance').innerText();
  await page.keyboard.down('w');
  await page.waitForTimeout(1700);
  await page.keyboard.up('w');
  await page.waitForFunction(old=>document.querySelector('#targetDistance').textContent!==old,initial,{timeout:15000});
  const out=path.join(root,'game-studio-workspace-artifacts');
  fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,'vanguard-desktop.png'),fullPage:false});
  await page.locator('#restart').click();
  await page.waitForFunction(old=>document.querySelector('#targetDistance').textContent===old,initial,{timeout:15000});
  assert.equal(await page.locator('#hpValue').innerText(),'100');
  assert.deepEqual(errors,[]);
  const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),mobileErrors=[];
  mobile.on('pageerror',e=>mobileErrors.push(e.message));
  await mobile.goto(url,{waitUntil:'load'});
  await mobile.waitForFunction(()=>document.body.dataset.gameReady==='true',undefined,{timeout:30000});
  assert.equal(await mobile.locator('[data-action]').count(),8);
  assert.equal(await mobile.locator('[data-action="attack"]').isVisible(),true);
  await mobile.screenshot({path:path.join(out,'vanguard-mobile.png'),fullPage:false});
  assert.deepEqual(mobileErrors,[]);
  console.log('Vanguard browser smoke passed: WebGL, chunks, inputs, restart, desktop and mobile HUD.');
 }catch(e){console.error(e);process.exitCode=1;}
 finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})();