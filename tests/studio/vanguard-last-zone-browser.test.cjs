'use strict';
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const game=path.resolve(__dirname,'../../studio/game-studio/demos/vanguard-last-zone/index.html');
const server=http.createServer((req,res)=>{
  if(new URL(req.url,'http://localhost').pathname!=='/game'){res.writeHead(404).end();return;}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  fs.createReadStream(game).on('error',()=>{if(!res.headersSent)res.writeHead(500).end();}).pipe(res);
});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const url='http://127.0.0.1:'+server.address().port+'/game';
  const screenshots=path.resolve(__dirname,'../../game-studio-workspace-artifacts');fs.mkdirSync(screenshots,{recursive:true});
  const desktop=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];desktop.on('pageerror',e=>errors.push(e.message));
  await desktop.goto(url,{waitUntil:'load'});
  await desktop.waitForFunction(()=>document.body.dataset.gameReady==='true'||!document.getElementById('failure').hidden,undefined,{timeout:30000});
  assert.equal(await desktop.locator('body').getAttribute('data-game-ready'),'true',await desktop.locator('#failure').innerText());
  await desktop.waitForFunction(()=>Number.parseInt(document.getElementById('drawCalls').textContent)>0,undefined,{timeout:30000});
  assert.equal(await desktop.locator('#startGame').isVisible(),true);
  await desktop.locator('#startGame').click();
  assert.equal(await desktop.locator('#startScreen').isVisible(),false);
  const initial=Number(await desktop.locator('#magValue').innerText());
  await desktop.keyboard.down('j');await desktop.waitForTimeout(380);await desktop.keyboard.up('j');
  await desktop.waitForFunction(old=>Number(document.getElementById('magValue').textContent)<old,initial,{timeout:10000});
  const day=await desktop.locator('#timeOfDay').innerText();
  await desktop.keyboard.press('n');
  await desktop.waitForFunction(old=>document.getElementById('timeOfDay').textContent!==old,day,{timeout:10000});
  await desktop.screenshot({path:path.join(screenshots,'last-zone-desktop.png')});
  assert.deepEqual(errors,[]);
  const mobile=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const mErrors=[];mobile.on('pageerror',e=>mErrors.push(e.message));
  await mobile.goto(url,{waitUntil:'load'});
  await mobile.waitForFunction(()=>document.body.dataset.gameReady==='true'||!document.getElementById('failure').hidden,undefined,{timeout:30000});
  assert.equal(await mobile.locator('body').getAttribute('data-game-ready'),'true',await mobile.locator('#failure').innerText());
  await mobile.locator('#startGame').click();
  assert.equal(await mobile.locator('[data-action="forward"]').isVisible(),true);
  assert.equal(await mobile.locator('[data-action="interact"]').isVisible(),true);
  assert.equal(await mobile.locator('[data-action="attack"]').isVisible(),true);
  await mobile.screenshot({path:path.join(screenshots,'last-zone-mobile.png')});
  assert.deepEqual(mErrors,[]);
  console.log('Last Zone browser: desktop/mobile WebGL, gameplay start, fire, day/night and touch controls passed.');
 }catch(e){console.error(e);process.exitCode=1;}
 finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})();