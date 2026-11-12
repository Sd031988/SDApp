'use strict';
/* Nordhafen Ops: reproducible frame-rate measurement (30 s drive through Freie Stadt).
 * Headless Chromium renders with SwiftShader (software, no GPU). The absolute FPS
 * values are therefore NOT representative of real devices; only before/after
 * comparisons on the same machine are meaningful. Mobile = emulation, not an iPhone.
 *
 * Optional environment:
 *   NORDHAFEN_PERF_SECONDS  drive measurement duration (default 30)
 *   NORDHAFEN_PERF_IDLE_SECONDS  parked-in-car measurement before driving (default 10);
 *                           same camera view every run, best for before/after comparisons
 *   NORDHAFEN_LOCAL_DEPS    folder with node_modules/babylonjs, babylonjs-loaders and
 *                           @babylonjs/havok – serves the CDN scripts locally (offline runs)
 *   CHROME_PATH             browser executable instead of the Playwright download
 *   NORDHAFEN_PERF_OUT      write the JSON result to this file
 */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const base='/studio/game-studio/engine/';
const engineRoot=path.join(root,'studio/game-studio/engine');
const seconds=Number(process.env.NORDHAFEN_PERF_SECONDS)||30;
const types={'.js':'text/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.wasm':'application/wasm'};
function serve(req,res){
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(!name.startsWith(base)){res.writeHead(404).end();return;}
 const file=path.resolve(engineRoot,name.slice(base.length));
 if(file!==engineRoot&&!file.startsWith(engineRoot+path.sep)){res.writeHead(403).end();return;}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
 const stream=fs.createReadStream(file);
 stream.on('error',()=>{if(!res.headersSent)res.writeHead(404).end();});
 stream.pipe(res);
}
async function routeLocalDeps(context){
 const deps=process.env.NORDHAFEN_LOCAL_DEPS;
 if(!deps)return;
 const nm=path.join(deps,'node_modules');
 const map={
  'babylon.js':path.join(nm,'babylonjs/babylon.js'),
  'babylonjs.loaders.min.js':path.join(nm,'babylonjs-loaders/babylonjs.loaders.min.js'),
  'HavokPhysics_umd.js':path.join(nm,'@babylonjs/havok/lib/umd/HavokPhysics_umd.js'),
  'HavokPhysics.wasm':path.join(nm,'@babylonjs/havok/lib/umd/HavokPhysics.wasm')
 };
 await context.route('https://cdn.babylonjs.com/**',route=>{
  const file=map[path.basename(new URL(route.request().url()).pathname)];
  if(!file)return route.fulfill({status:404,body:''});
  return route.fulfill({status:200,body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});
 });
}
async function start(page,url){
 page.__errors=[];page.on('pageerror',e=>page.__errors.push(e.message));
 await page.goto(url,{waitUntil:'load',timeout:90000});
 await page.locator('#mode').selectOption('city');
 await page.locator('#carChoice').selectOption('suv');
 await page.locator('#play').click();
 await page.waitForFunction(()=>{
  const hud=document.getElementById('hud')?.textContent||'';
  return hud.includes('Verkehr: ')||(document.getElementById('status')?.textContent||'').includes('Start fehlgeschlagen:');
 },undefined,{timeout:90000});
 const status=await page.locator('#status').innerText();
 if(status.includes('Start fehlgeschlagen:'))throw new Error('Spielstart fehlgeschlagen: '+status);
}
async function measure(page,drive){
 await page.evaluate(()=>{
  window.__perf={frames:[],last:performance.now(),run:true};
  window.__perf.maxSpeed=0;
  const tick=now=>{const p=window.__perf;if(!p.run)return;p.frames.push(now-p.last);p.last=now;
   const m=(document.getElementById('hud')?.textContent||'').match(/Auto: (-?\d+) km\/h/);if(m)p.maxSpeed=Math.max(p.maxSpeed,Math.abs(Number(m[1])));
   requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
 });
 await drive(seconds*1000);
 return page.evaluate(()=>{
  const p=window.__perf;p.run=false;
  const ms=p.frames.slice(5).filter(x=>x>0),total=ms.reduce((a,b)=>a+b,0);
  const sorted=[...ms].sort((a,b)=>b-a),worst=sorted.slice(0,Math.max(1,Math.floor(sorted.length/100)));
  const hud=document.getElementById('hud')?.textContent||'';
  return {frames:ms.length,avgFps:+(ms.length*1000/total).toFixed(1),
   low1Fps:+(1000/(worst.reduce((a,b)=>a+b,0)/worst.length)).toFixed(1),
   maxFrameMs:+sorted[0].toFixed(1),maxSpeedKmh:p.maxSpeed,hudSpeed:(hud.match(/Auto: (-?\d+) km\/h/)||[])[1]||null,
   traffic:(hud.match(/Verkehr: ([^\n]+)/)||[])[1]?.trim()||null};
 });
}
async function keyboardEnter(page){
 await page.locator('#game').focus();
 await page.keyboard.press('f');
 await page.waitForFunction(()=>document.getElementById('vehicleToggle')?.textContent==='Aussteigen',undefined,{timeout:15000});
}
async function touchEnter(page){
 await page.locator('[data-foot-action="vehicle"]').tap();
 await page.waitForFunction(()=>document.getElementById('vehicleToggle')?.textContent==='Aussteigen',undefined,{timeout:15000});
}
const idleSeconds=Number(process.env.NORDHAFEN_PERF_IDLE_SECONDS)||10;
async function idle(page){await page.waitForTimeout(idleSeconds*1000);}
async function keyboardDrive(page,duration){
 const end=Date.now()+duration;let turn=0;
 await page.keyboard.down('w');
 while(Date.now()<end){
  const key=turn++%2?'a':'d';
  await page.keyboard.down(key);await page.waitForTimeout(Math.min(700,end-Date.now()));await page.keyboard.up(key);
  await page.waitForTimeout(Math.max(0,Math.min(3300,end-Date.now())));
 }
 await page.keyboard.up('w');
}
async function touchDrive(page,duration){
 const press=(key,down)=>page.evaluate(([k,d])=>{
  const b=document.querySelector('[data-drive-key="'+k+'"]');
  b?.dispatchEvent(new PointerEvent(d?'pointerdown':'pointerup',{bubbles:true,pointerId:7,pointerType:'touch'}));
 },[key,down]);
 const end=Date.now()+duration;let turn=0;
 await press('KeyW',true);
 while(Date.now()<end){
  const key=turn++%2?'KeyA':'KeyD';
  await press(key,true);await page.waitForTimeout(Math.min(700,end-Date.now()));await press(key,false);
  await page.waitForTimeout(Math.max(0,Math.min(3300,end-Date.now())));
 }
 await press('KeyW',false);
}
(async()=>{
 const server=http.createServer(serve);let browser;
 try{
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const url='http://127.0.0.1:'+server.address().port+base+'nordhafen-ops.html';
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
   args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-web-security']});
  const result={seconds,renderer:'SwiftShader (Software, kein GPU)',date:new Date().toISOString()};
  const only=process.env.NORDHAFEN_PERF_ONLY||'';
  if(only!=='mobile'){
  const desktopContext=await browser.newContext({viewport:{width:1920,height:1080}});
  await routeLocalDeps(desktopContext);
  const desktop=await desktopContext.newPage();
  await start(desktop,url);
  await keyboardEnter(desktop);
  // Same view in every run: sitting in the parked car at the spawn point.
  result.desktopParked=await measure(desktop,()=>idle(desktop));
  result.desktop=await measure(desktop,d=>keyboardDrive(desktop,d));
  result.desktop.pageErrors=desktop.__errors;
  await desktopContext.close();
  }
  if(only!=='desktop'){
  const phoneContext=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:3,
   userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});
  await routeLocalDeps(phoneContext);
  const phone=await phoneContext.newPage();
  await start(phone,url);
  await touchEnter(phone);
  result.mobileParked=await measure(phone,()=>idle(phone));
  result.mobileEmulation=await measure(phone,d=>touchDrive(phone,d));
  result.mobileEmulation.pageErrors=phone.__errors;
  await phoneContext.close();
  }
  console.log(JSON.stringify(result,null,1));
  if(process.env.NORDHAFEN_PERF_OUT)fs.writeFileSync(process.env.NORDHAFEN_PERF_OUT,JSON.stringify(result,null,1));
 }catch(e){console.error(e);process.exitCode=1;}
 finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
})();
