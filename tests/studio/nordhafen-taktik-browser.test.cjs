'use strict';
/* Echter Chromium / Babylon / Havok Test der Nordhafen-Bewegung. Kein GPU-FPS-Beweis:
   nutzt SwiftShader und eine kleine Testkarte, nicht die komplette Produktionswelt. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const engineRoot=path.join(root,'studio/game-studio/engine');
const routeBase='/studio/game-studio/engine/';
const mini=`sd.himmel({zeit:'tag'});
sd.gelaende({groesse:150,hoehe:0,aufloesung:36,seed:4,flach:[[0,0,55,0]]});
sd.spieler({pos:[0,null,0],waffen:['pistole'],aussehen:'mensch',
mensch:{taktik:true,oberteil:'#344c55',weste:true}});
if(!sd.taktik) throw new Error('Taktik-Modul nicht geladen');
sd.taktik();
sd.nachricht('Taktik-Bewegung Browser-Test',3);`;
function serve(req,res){
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(!pathname.startsWith(routeBase)){res.writeHead(404).end();return;}
 const name=pathname.slice(routeBase.length);
 const file=path.resolve(engineRoot,name);
 if(!file.startsWith(engineRoot+path.sep) && file!==engineRoot){res.writeHead(403).end();return;}
 let mime='application/octet-stream';
 if(file.endsWith('.html'))mime='text/html;charset=utf-8';
 if(file.endsWith('.js'))mime='text/javascript;charset=utf-8';
 if(file.endsWith('.json'))mime='application/json';
 res.setHeader('Content-Type',mime);
 const s=fs.createReadStream(file);s.on('error',()=>{if(!res.headersSent)res.writeHead(404).end();});s.pipe(res);
}
async function go(page,url){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/spiele/nordhafen.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:mini}));
 await page.goto(url,{waitUntil:'load',timeout:90000});
 await page.locator('#spielen').click();
 await page.waitForFunction(()=>!!window.SD_SPIEL?.ctx?.spieler?.cc,undefined,{timeout:90000});
 return errors;
}
(async()=>{
 const server=http.createServer(serve);let browser;
 try {
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const url='http://127.0.0.1:'+server.address().port+routeBase+'index.html?spiel=nordhafen&test=1';
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-web-security']});
  const shots=path.join(root,'game-studio-workspace-artifacts');fs.mkdirSync(shots,{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=await go(page,url);
  assert.equal(await page.locator('.sw[data-spiel="nordhafen"]').getAttribute('class'),'sw an');
  const before=await page.evaluate(()=>{const s=SD_SPIEL.ctx.spieler;window.__basisKapsel=s.cc.shape;return {halb:s.taktikHalbhoehe||.9,form:s.taktikForm||'stehen'};});
  assert.equal(before.form,'stehen');
  await page.keyboard.press('z');
  await page.waitForFunction(()=>SD_SPIEL.ctx.spieler.taktikForm==='liegen',{timeout:10000});
  const prone=await page.evaluate(()=>{const s=SD_SPIEL.ctx.spieler;return {form:s.taktikForm,halb:s.taktikHalbhoehe,kopf:s.taktikKopfOffset,phys:s.cc.shape!==window.__basisKapsel};});
  assert.equal(prone.form,'liegen');assert.ok(prone.kopf<.25);
  if(!prone.phys)console.log('Browser: Havok-Kapsel nicht geändert; visueller Fallback aktiv.');
  await page.keyboard.down('w');
  await page.waitForTimeout(450);
  const crawl=await page.evaluate(()=>({speed:SD_SPIEL.ctx.spieler.tempo,neigung:SD_SPIEL.ctx.spieler.k.rotation.x}));
  assert.ok(crawl.speed<2.8,'Kriechgeschwindigkeit soll deutlich langsamer als Sprint sein.');
  assert.ok(crawl.neigung>0.6,'Modell muss sich beim Kriechen tatsächlich hinlegen.');
  await page.keyboard.up('w');await page.keyboard.press('z');
  await page.waitForFunction(()=>SD_SPIEL.ctx.spieler.taktikForm==='stehen',{timeout:10000});
  await page.keyboard.down('Shift');await page.keyboard.down('w');
  await page.waitForTimeout(200);await page.keyboard.press('x');
  await page.waitForFunction(()=>SD_SPIEL.ctx.spieler.taktikRutsch===true,{timeout:3000});
  await page.keyboard.up('w');await page.keyboard.up('Shift');
  await page.waitForTimeout(900);
  await page.waitForFunction(()=>!SD_SPIEL.ctx.spieler.taktikRutsch,{timeout:3000});
  await page.keyboard.press('b');
  await page.waitForFunction(()=>SD_SPIEL.ctx.spieler.taktikSchulter===-1,undefined,{timeout:3000});
  assert.equal(await page.evaluate(()=>SD_SPIEL.ctx.spieler.taktikSchulter),-1);
  await page.mouse.move(640,400);await page.mouse.down({button:'right'});
  await page.keyboard.down('q');await page.waitForTimeout(230);
  const lean=await page.evaluate(()=>SD_SPIEL.ctx.spieler.taktikNeigung);
  assert.ok(lean < -0.3, 'Beim Zielen muss sich die Figur nach links lehnen.');
  await page.keyboard.up('q');await page.mouse.up({button:'right'});
  assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(shots,'nordhafen-taktik-desktop.png')});
  await page.close();
  const mobile=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const mErrors=await go(mobile,url);
  assert.equal(await mobile.locator('#tProne').isVisible(),true);
  await mobile.locator('#tProne').dispatchEvent('touchstart');
  await mobile.waitForFunction(()=>SD_SPIEL.ctx.spieler.taktikForm==='liegen',{timeout:10000});
  await mobile.locator('#tProne').dispatchEvent('touchend');
  await mobile.screenshot({path:path.join(shots,'nordhafen-taktik-mobile.png')});
  assert.deepEqual(mErrors,[]);
  console.log('Nordhafen tactical Chrome / Havok smoke: prone, crawl, slide, lean, shoulder and touch controls passed.');
 }catch(e){console.error(e);process.exitCode=1;}
 finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
})();
