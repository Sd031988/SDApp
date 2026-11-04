'use strict';
/* Chromium smoke test for the standalone Vanguard Eclipse game.
 * Verifies actual WebGL shader compilation and gameplay in GitHub CI. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const relative='/studio/game-studio/demos/vanguard-eclipse/index.html';
(async()=>{
 let browser;
 const server=http.createServer((req,res)=>{
   const url=new URL(req.url,'http://localhost').pathname;
   if(url!==relative){res.writeHead(404).end();return;}
   res.setHeader('Content-Type','text/html;charset=utf-8');
   fs.createReadStream(path.join(root,'studio/game-studio/demos/vanguard-eclipse/index.html'))
     .on('error',()=>{if(!res.headersSent)res.writeHead(404).end();}).pipe(res);
 });
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const url='http://127.0.0.1:'+server.address().port+relative;
  const shots=path.join(root,'game-studio-workspace-artifacts');fs.mkdirSync(shots,{recursive:true});
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'load'});
   await page.waitForFunction(()=>document.body.dataset.gameReady==='true'||!document.querySelector('#failure').hidden,undefined,{timeout:30000});
   assert.equal(await page.locator('body').getAttribute('data-game-ready'),'true',await page.locator('#failure').innerText());
   await page.waitForFunction(()=>Number.parseInt(document.getElementById('drawCalls').textContent)>0,undefined,{timeout:30000});
   assert.equal(await page.locator('#startScreen').isVisible(),true);
   assert.equal(await page.locator('.objective').count(),3);
   assert.equal(await page.locator('[data-action]').count(),10);
   await page.locator('#startGame').click();
   await page.waitForFunction(()=>document.getElementById('startScreen').hidden===true);
   await page.waitForTimeout(400);
   await page.screenshot({path:path.join(shots,mobile?'vanguard-eclipse-mobile-intro-world.png':'vanguard-eclipse-desktop-intro-world.png'),fullPage:false});
   if(mobile){
    const b=page.locator('[data-action="pulse"]');assert.equal(await b.isVisible(),true);
    await b.dispatchEvent('pointerdown',{pointerId:20});
    await page.waitForTimeout(180);
    await b.dispatchEvent('pointerup',{pointerId:20});
   }else{
    await page.keyboard.press('q');
   }
   await page.waitForFunction(()=>document.getElementById('pulseStatus').textContent!=='BEREIT',{timeout:15000});
   assert(Number(await page.locator('#staminaValue').innerText())<100,'Pulse must spend stamina.');
   assert(Number.parseInt(await page.locator('#drawCalls').innerText())<1200,'Too many draw calls in baseline scene.');
   await page.screenshot({path:path.join(shots,mobile?'vanguard-eclipse-mobile.png':'vanguard-eclipse-desktop.png'),fullPage:false});
   await page.locator('#restart').click();
   await page.waitForFunction(()=>document.getElementById('pulseStatus').textContent==='BEREIT');
   assert.equal(await page.locator('#hpValue').innerText(),'100');
   assert.deepEqual(errors,[],'Uncaught browser exceptions');
   await page.close();
  }
  console.log('Vanguard Eclipse browser smoke passed: WebGL shaders, Desktop/Mobile, pulse, reset and 3D rendering.');
 }catch(e){console.error(e);process.exitCode=1;}
 finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})();