'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),http=require('node:http'),
fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const staticFiles=new Map([
['/studio/game-studio/large-world.html','text/html'],
['/studio/game-studio/large-world.js','application/javascript'],
['/studio/game-studio/large-world-core.js','application/javascript'],
['/studio/game-studio/scene-core.js','application/javascript'],
['/studio/game-studio/large-world.css','text/css']
]);
(async()=>{
let browser;const server=http.createServer((req,res)=>{
const name=new URL(req.url,'http://localhost').pathname,mime=staticFiles.get(name);
if(!mime){res.writeHead(404).end();return;}
res.setHeader('Content-Type',mime);
fs.createReadStream(path.join(root,name)).on('error',()=>{if(!res.headersSent)res.writeHead(404).end();}).pipe(res);
});
try{
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+server.address().port+'/studio/game-studio/large-world.html',{waitUntil:'load'});
await page.waitForFunction(()=>['true','error'].includes(document.body.dataset.ready),undefined,{timeout:20000});
assert.equal(await page.locator('body').getAttribute('data-ready'),'true',await page.locator('#worldStatus').innerText());
await page.waitForFunction(()=>Number(document.getElementById('activeCells').textContent)===9);
assert.equal(await page.locator('#worldCells').innerText(),'256');
assert.equal(await page.locator('#worldObjects').innerText(),'2.048');
assert.equal(await page.locator('#activeObjects').innerText(),'72');
await page.waitForFunction(()=>Number(document.getElementById('drawnObjects').textContent)>0,undefined,{timeout:15000});
const calls=Number(await page.locator('#drawnObjects').innerText());
assert(calls>0&&calls<800,'Chunk Culling muss einen Bruchteil der 2.048 Objektinstanzen zeichnen');
const coords0=await page.locator('#cameraCoordinates').innerText();
const shots=path.join(root,'game-studio-large-world-artifacts');
fs.mkdirSync(shots,{recursive:true});
await page.screenshot({path:path.join(shots,'large-world-desktop.png'),fullPage:false});
await page.keyboard.down('w');
await page.waitForTimeout(1100);
await page.keyboard.up('w');
await page.waitForFunction(prev=>document.querySelector('#cameraCoordinates').textContent!==prev,coords0);
const first=Number((await page.locator('#worldObjects').innerText()).replace('.',''));
await page.locator('#addTree').click();
assert.equal(await page.locator('#worldObjects').innerText(),(first+1).toLocaleString('de-DE'));
const dl=page.waitForEvent('download');await page.locator('#saveWorld').click();const file=await dl;
assert.equal(file.suggestedFilename(),'sd-game-large-world-v3.json');
const data=fs.readFileSync(await file.path());
const parsed=JSON.parse(data.toString());
assert.equal(parsed.version,3);
assert.equal(parsed.cells.length,256);
assert.equal(parsed.cells.reduce((n,c)=>n+c.objects.length,0),2049);
await page.locator('#resetWorld').click();
assert.equal(await page.locator('#worldObjects').innerText(),'2.048');
await page.locator('#worldFile').setInputFiles({name:'saved-world.json',mimeType:'application/json',buffer:data});
await page.waitForFunction(()=>document.querySelector('#worldObjects').textContent==='2.049');
const beforeBad=await page.locator('#worldObjects').innerText();
await page.locator('#worldFile').setInputFiles({name:'bad-world.json',mimeType:'application/json',
buffer:Buffer.from(JSON.stringify({version:2,name:'old project'}))});
await page.waitForFunction(()=>document.querySelector('#worldStatus').textContent.includes('Import abgelehnt'));
assert.equal(await page.locator('#worldObjects').innerText(),beforeBad);
await page.locator('#fullscreenWorld').click();
assert.equal(await page.locator('.tools').isVisible(),false);
await page.locator('#fullscreenWorld').click();
assert.equal(await page.locator('.tools').isVisible(),true);
await page.setViewportSize({width:390,height:844});
await page.locator('#fullscreenWorld').click();
const box=await page.locator('#worldCanvas').boundingBox();
assert(box.width>=380&&box.height>=650,'Mobile Großwelt soll echte Bildschirmfläche nutzen');
await page.screenshot({path:path.join(shots,'large-world-mobile.png'),fullPage:false});
await page.locator('#fullscreenWorld').click();
await page.locator('#worldCanvas').evaluate(el=>el.getContext('webgl')!==null).then(value=>assert.equal(value,true));
assert.deepEqual(errors,[]);
console.log('Large World v3 browser: 256 chunks, 2048 instances, selective rendering, save/import and mobile focus passed.');
}catch(error){console.error(error);process.exitCode=1;}
finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})();