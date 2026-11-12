'use strict';
/* Chromium/SwiftShader integration smoke for the actual Ops game.
 * A mobile browser context is NOT a physical iPhone/Safari certification.
 */
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const base='/studio/game-studio/engine/';
const engineRoot=path.join(root,'studio/game-studio/engine');
const screenshotDir=path.join(root,'game-studio-workspace-artifacts');
function serve(req,res){
 const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname);
 if(!name.startsWith(base)){res.writeHead(404).end();return;}
 const file=path.resolve(engineRoot,name.slice(base.length));
 if(file!==engineRoot&&!file.startsWith(engineRoot+path.sep)){res.writeHead(403).end();return;}
 const extension=path.extname(file);
 const types={'.js':'text/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary'};
 res.setHeader('Content-Type',types[extension]||'application/octet-stream');
 const stream=fs.createReadStream(file);
 stream.on('error',()=>{if(!res.headersSent)res.writeHead(404).end();});
 stream.pipe(res);
}
async function play(page,url){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'load',timeout:90000});
 await page.locator('#mode').selectOption('city');
 await page.locator('#carChoice').selectOption('suv');
 await page.locator('#play').click();
 await page.waitForFunction(()=>{
  const hud=document.getElementById('hud')?.textContent||'';
  const error=document.getElementById('status')?.textContent||'';
  return hud.includes('NORDHAFEN OPS · FREIE STADT')||error.includes('Start fehlgeschlagen:');
 },undefined,{timeout:90000});
 const state=await page.locator('#status').innerText();
 assert.ok(!state.includes('Start fehlgeschlagen:'),'3D game failed: '+state);
 assert.match(await page.locator('#hud').innerText(),/FREIE STADT/);
 return errors;
}
(async()=>{
 const server=http.createServer(serve);let browser;
 try{
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const url='http://127.0.0.1:'+server.address().port+base+'nordhafen-ops.html';
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-web-security']});
  fs.mkdirSync(screenshotDir,{recursive:true});
  const desktop=await browser.newPage({viewport:{width:1280,height:800}});
  const desktopErrors=await play(desktop,url);
  await desktop.locator('#game').focus();
  await desktop.keyboard.press('f');
  await desktop.waitForFunction(()=>document.getElementById('vehicleToggle')?.textContent==='Aussteigen',undefined,{timeout:15000});
  await desktop.keyboard.down('w');
  await desktop.waitForTimeout(1100);
  await desktop.keyboard.up('w');
  assert.match(await desktop.locator('#hud').innerText(),/Auto: \d+ km\/h/);
  await desktop.screenshot({path:path.join(screenshotDir,'nordhafen-ops-desktop-drive.png')});
  assert.deepEqual(desktopErrors,[],'Desktop runtime errors');
  await desktop.close();
  const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const phoneErrors=await play(phone,url);
  assert.equal(await phone.locator('#footControls').isVisible(),true,'foot controls on mobile');
  await phone.locator('[data-foot-action="vehicle"]').tap();
  await phone.waitForFunction(()=>document.getElementById('vehicleToggle')?.textContent==='Aussteigen',undefined,{timeout:15000});
  assert.equal(await phone.locator('#driveControls').isVisible(),true,'car pad on mobile');
  assert.equal(await phone.locator('#footControls').isVisible(),false,'on-foot pad hidden while driving');
  await phone.screenshot({path:path.join(screenshotDir,'nordhafen-ops-mobile-drive.png')});
  assert.deepEqual(phoneErrors,[],'Mobile emulation runtime errors');
  console.log('Nordhafen Ops: real Chromium/Havok large city loaded; F entered SUV and mobile touch entered vehicle.');
 }catch(e){console.error(e);process.exitCode=1;}
 finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
})();
