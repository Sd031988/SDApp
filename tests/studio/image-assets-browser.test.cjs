'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../../studio');
const allowed=new Map([
  ['/jpeg-xl.html','text/html; charset=utf-8'],
  ['/image-assets.js','text/javascript; charset=utf-8']
]);
const server=http.createServer((req,res)=>{
  const type=allowed.get(new URL(req.url,'http://localhost').pathname);
  if(!type){res.writeHead(404);res.end();return;}
  const name=new URL(req.url,'http://localhost').pathname.slice(1);
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});
  fs.createReadStream(path.join(root,name)).pipe(res);
});
(async()=>{
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/jpeg-xl.html');
  await page.locator('#jxlFile').setInputFiles({
    name:'straße.jxl',mimeType:'image/jxl',buffer:Buffer.from([0x01,0x02,0x03])
  });
  await page.locator('#fallbackFile').setInputFiles({
    name:'straße.png',mimeType:'image/png',
    buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLytQAAAABJRU5ErkJggg==','base64')
  });
  await page.locator('#altText').fill('Berg & "Sonne"');
  const html=await page.locator('#htmlCode').inputValue();
  assert.match(html,/srcset="assets\/stra%C3%9Fe\.jxl" type="image\/jxl"/);
  assert.match(html,/src="assets\/stra%C3%9Fe\.png"/);
  assert.match(html,/alt="Berg &amp; &quot;Sonne&quot;"/);
  assert.equal(await page.locator('#copyBtn').isDisabled(),false);
  await page.locator('#folder').fill('../geheim');
  assert.equal(await page.locator('#copyBtn').isDisabled(),true);
  assert.match(await page.locator('#status').innerText(),/Bildordner/);
  await page.close();
  process.stdout.write('JPEG XL Bild-Asset Browserprüfung erfolgreich.\n');
}finally{
  if(browser)await browser.close();
  await new Promise(ok=>server.close(ok));
}
})().catch(err=>{console.error(err);process.exitCode=1;});