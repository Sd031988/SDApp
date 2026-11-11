'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const lessons=require('../../mein-sd-hub/kurse/python.js');
const types={'.mjs':'text/javascript','.js':'text/javascript','.wasm':'application/wasm','.json':'application/json','.html':'text/html','.css':'text/css'};
const server=http.createServer((req,res)=>{let name=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(name===root||name.endsWith(path.sep))name+='/index.html';if(!name.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.stat(name,(error,stat)=>{if(!error&&stat.isDirectory())name+='/index.html';fs.readFile(name,(error,body)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream'});res.end(body);});});});
(async()=>{
 let browser;await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});const context=await browser.newContext({locale:'de-DE'}),page=await context.newPage();
  const external=[],assets=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  context.on('request',req=>{if(!req.url().startsWith(base)&&!req.url().startsWith('blob:')&&!req.url().startsWith('data:'))external.push(req.url());if(req.url().includes('/vendor/pyodide/'))assets.push(req.url());});
  await page.goto(base+'/mein-sd-hub/#akademie');await page.waitForFunction(()=>!!window.SDPythonRunner);
  assert.equal(assets.length,0,'No runtime is downloaded on page entry');
  const run=project=>page.evaluate(async project=>{const progress=[],output=[];const runner=window.SDPythonRunner.create();const result=await runner.run(project,{onProgress:p=>progress.push(p.percent),onOutput:p=>output.push(p.text)});return{...result,progress,output};},project);
  const cold=await run({files:{'main.py':'print("Hallo Python")'},main:'main.py'});
  assert.deepEqual(cold.output,['Hallo Python']);assert.equal(cold.progress[0],0);assert.equal(cold.progress.at(-1),100);assert(cold.progress.some(p=>p>0&&p<95));
  const warm=await run({files:{'main.py':'import hilfe\nprint(hilfe.wert)' ,'hilfe.py':'wert = 42'},main:'main.py'});assert.deepEqual(warm.output,['42']);
  console.log(JSON.stringify({measurement:'Python startup on desktop Chromium, local HTTP, unthrottled',coldReadyMs:cold.readyMs,coldTotalMs:cold.totalMs,warmReadyMs:warm.readyMs,warmTotalMs:warm.totalMs}));
  for(const lesson of lessons){
   const good=await run({files:{'main.py':lesson.aufgabe.loesung.python},main:'main.py',stdin:lesson.beispiel.eingabe,checks:lesson.aufgabe.faelle});assert(good.checks.every(x=>x.ok),lesson.id+' solution '+JSON.stringify(good.checks));
   for(const code of ['# '+lesson.aufgabe.loesung.python.replaceAll('\n','\n# '),'print('+JSON.stringify(lesson.aufgabe.faelle[0].ausgabe)+')']){
    const bad=await run({files:{'main.py':code},main:'main.py',checks:lesson.aufgabe.faelle});assert(bad.checks.some(x=>!x.ok),lesson.id+' rejects comments or fixed example output');
   }
  }
  await assert.rejects(run({files:{'main.py':'print(unknown)'},main:'main.py'}),/NameError/);
  await assert.rejects(run({files:{'main.py':'if :'},main:'main.py'}),/SyntaxError/);
  await assert.rejects(run({files:{'../main.py':'print(1)'},main:'../main.py'}),/Projektpfad/);
  const stopped=await page.evaluate(async()=>{const runner=window.SDPythonRunner.create();const result=runner.run({files:{'main.py':'while True: pass'},main:'main.py'},{onProgress:p=>{if(p.percent===100)setTimeout(()=>runner.stop(),100);}}).then(()=>false,e=>/abgebrochen/.test(e.message));let ticks=0;const timer=setInterval(()=>ticks++,20);const ok=await result;clearInterval(timer);return {ok,ticks};});assert(stopped.ok&&stopped.ticks>2,'Stop terminates worker while UI remains responsive');
  await assert.rejects(run({files:{'main.py':'while True: pass'},main:'main.py',timeoutMs:2500}),/Zeitlimit/);
  // Persistent runtime cache, including module sources, works offline with a NEW worker.
  await context.setOffline(true);const offline=await run({files:{'main.py':'print(6 * 7)'},main:'main.py'});assert.deepEqual(offline.output,['42']);await context.setOffline(false);
  assert.equal(external.filter(url=>/wandbox/.test(url)).length,0,'No silent online fallback');
  // Actual Academy UI: wrong starter does not finish a lesson; correct practice + quiz does.
  await page.locator('[data-tab="akademie"]').click();await page.locator('.course').filter({has:page.locator('b',{hasText:/^Python Grundlagen$/})}).click();
  await page.locator('.python-editor').waitFor();await page.locator('.python-lesson .btn.primary').first().click();await page.waitForFunction(()=>document.querySelector('.python-lesson [role="status"]').textContent.includes('noch nicht'));
  await page.locator('.python-editor').fill(lessons[0].aufgabe.loesung.python);await page.locator('.python-lesson .btn.primary').first().click();await page.waitForFunction(()=>document.querySelector('.python-lesson [role="status"]').textContent.includes('bestanden.'));
  for(const [i,q] of lessons[0].quiz.entries())await page.locator('.python-lesson .code-quiz').nth(i).locator('button').nth(q.richtig).click();
  await page.waitForFunction(()=>Array.from({length:localStorage.length},(_,i)=>localStorage.getItem(localStorage.key(i))).some(s=>{try{return JSON.parse(s).completedLessons?.includes('py-1')}catch{return false}}));
  await page.locator('#langWahl').selectOption('fa');assert.equal(await page.locator('.python-lesson > h4').getAttribute('dir'),'ltr');assert.equal(await page.locator('.python-lesson > h4').getAttribute('lang'),'de');
  assert.deepEqual(errors,[]);
  console.log('PASS Python: real runtime, all eight solutions and bypass attempts, input, multi-file imports, errors, stop, timeout, offline, Academy completion and RTL');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
