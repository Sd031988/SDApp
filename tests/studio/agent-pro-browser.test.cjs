'use strict';
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
 const serverCode=[
  "const http=require('http'),fs=require('fs'),path=require('path');",
  "http.createServer((req,res)=>{",
  "let p;try{p=path.resolve(process.cwd(),'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}",
  "catch(_){res.writeHead(400).end();return;}",
  "if(!p.startsWith(process.cwd()+path.sep)){res.writeHead(403).end();return;}",
  "fs.stat(p,(e,st)=>{if(e||!st.isFile()){res.writeHead(404).end();return;}",
  "res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');",
  "fs.createReadStream(p).pipe(res);});",
  "}).listen(8879,'127.0.0.1');"
 ].join('\n');
 const server=spawn(process.execPath,['-e',serverCode],{stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:780}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8879/studio/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#app').waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>typeof S!=='undefined'&&S.gestartet&&S.p&&S.p.name,null,{timeout:25000});
  const old=await page.evaluate(()=>JSON.stringify(S.p.dateien));
  const taskButton=page.locator('#agentProBtn');
  assert.equal(await taskButton.count(),1);
  await taskButton.click();
  assert.equal(await page.locator('#agentProOverlay').isVisible(),true);
  await page.locator('#agentProGoal').fill('Verbessere die Startseite ohne bestehende Funktionen zu verändern');
  await page.locator('#agentProAdd').click();
  assert.equal(await page.locator('.agentProTask').count(),1);
  assert.match(await page.locator('.agentProState').innerText(),/Offen/);
  const key=await page.evaluate(()=>'sd-agent-pro:v1:'+encodeURIComponent(S.p.name));
  const persisted=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'[]'),key);
  assert.equal(persisted.length,1);
  assert.equal(persisted[0].status,'open');
  assert.equal(JSON.stringify(persisted).includes('<!doctype'),false);
  await page.locator('.agentProTask button', {hasText:'Beginnen'}).click();
  assert.match(await page.locator('.agentProState').innerText(),/In Arbeit/);
  await page.locator('.agentProTask button', {hasText:'Zur KI-Werkstatt'}).click();
  assert.equal(await page.locator('#kiOverlay').isVisible(),true);
  assert.equal(await page.locator('#kiChangeConsent').isChecked(),false);
  await page.locator('#kiClose').click();
  await taskButton.click();
  await page.locator('.agentProTask button', {hasText:'Prüfphase starten'}).click();
  assert.match(await page.locator('.agentProState').innerText(),/Testen/);
  assert.equal(await page.locator('.agentProTask button', {hasText:'Zur Freigabe'}).isEnabled(),false);
  await page.locator('.agentProTask button', {hasText:'Statisch prüfen'}).click();
  assert.match(await page.locator('#agentProMessage').innerText(),/statische Prüfung/i);
  assert.equal(await page.evaluate(()=>JSON.stringify(S.p.dateien)),old);
  assert.deepEqual(errors,[]);
  await page.locator('#agentProClose').click();
  await page.setViewportSize({width:320,height:740});
  await taskButton.click();
  assert.equal(await page.locator('.agentProTask').count(),1);
  assert.equal(await page.locator('#agentProOverlay').isVisible(),true);
  console.log('Agent Pro mobile task board, local storage and safe handoff passed');
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
