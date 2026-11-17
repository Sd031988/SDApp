'use strict';
// KI-Vervollständigung: Systemprüfung, Modell-IDs in WebLLM, Geistertext mit Tab/Esc (mit nachgebautem Modell –
// echte WebGPU gibt es in GitHub Actions nicht).
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const root=process.cwd();
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.stat(file,(e,st)=>{if(e||!st.isFile()){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port+'/studio/index.html';
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('sdStudioEinst',JSON.stringify({konfetti:false}))});
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof S!=='undefined'&&S.layoutBereit&&S.cm,null,{timeout:30000});
  // 1. Systemprüfung (ohne WebGPU in CI)
  const sys=await page.evaluate(()=>SDKIVervoll.systemPruefen());
  console.log('System:',JSON.stringify(sys));
  assert.equal(typeof sys.webgpu,'boolean');assert.ok(sys.gruende.length);
  // 2. Gibt es die Modell-IDs in WebLLM 0.2.83?
  const fehlend=await page.evaluate(async()=>{const lib=await import('https://esm.run/@mlc-ai/web-llm@0.2.83');const ids=new Set(lib.prebuiltAppConfig.model_list.map(m=>m.model_id));
   return Object.values(SDKIVervoll.MODELLE).flatMap(m=>[m.f16,m.f32]).filter(id=>!ids.has(id));});
  console.log('Fehlende Modell-IDs:',fehlend);assert.deepEqual(fehlend,[]);
  // 3. Geistertext mit nachgebautem Modell
  await page.evaluate(async()=>{const st=document.getElementById('studioStart');if(st)st.hidden=true;
   await projSchreiben({name:'kv-test',dateien:{'app.js':'function summe(a, b) {\n'},haupt:'app.js',versionen:[],erstellt:Date.now()});await projektOeffnen('kv-test','app.js');
   SDKIVervoll._testEngine={completions:{create:async o=>{window._kvPrompt=o.prompt;return {choices:[{text:'  return a + b;\n}'}]}}}};
   await SDKIVervoll.einschalten(true);});
  await page.evaluate(()=>{S.cm.focus();S.cm.setCursor({line:1,ch:0});S.cm.replaceRange('',{line:1,ch:0},{line:1,ch:0},'+input');S.cm.replaceSelection(' ','end','+input');});
  await page.waitForSelector('.kiGeist',{timeout:5000});
  console.log('Geist:',JSON.stringify(await page.textContent('.kiGeist')),'Prompt hat FIM:',await page.evaluate(()=>/<\|fim_prefix\|>[\s\S]*<\|fim_suffix\|>[\s\S]*<\|fim_middle\|>/.test(window._kvPrompt)));
  await page.keyboard.press('Tab');
  const code=await page.evaluate(()=>S.cm.getValue());console.log('Nach Tab:',JSON.stringify(code));
  assert.match(code,/return a \+ b;\n\}/);assert.equal(await page.locator('.kiGeist').count(),0);
  // Esc verwirft
  await page.evaluate(()=>{S.cm.setCursor(S.cm.lastLine(),S.cm.getLine(S.cm.lastLine()).length);S.cm.replaceSelection('\n','end','+input');});
  await page.waitForSelector('.kiGeist',{timeout:5000});await page.keyboard.press('Escape');
  assert.equal(await page.locator('.kiGeist').count(),0);
  assert.match(await page.textContent('#kvStatus'),/Bereit/);
  assert.deepEqual(errors,[]);
  console.log('PASS KI-Vervollständigung: Systemprüfung, Modelle vorhanden, Tab/Esc');
 } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
