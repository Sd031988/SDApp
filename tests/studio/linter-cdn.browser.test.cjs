'use strict';
// Prüft die echten Prüfer aus dem Netz (Ruff als WebAssembly über jsDelivr). Läuft in GitHub Actions mit Internet.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const root=process.cwd();
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.stat(file,(e,st)=>{if(e||!st.isFile()){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port+'/studio/index.html';
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')console.log('[console]',m.text().slice(0,300))});
  await page.addInitScript(()=>{if(window.top!==window)return;localStorage.setItem('sdStudioEinst',JSON.stringify({konfetti:false}))});
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof S!=='undefined'&&S.layoutBereit,null,{timeout:30000});
  await page.evaluate(async()=>{const st=document.getElementById('studioStart');if(st)st.hidden=true;
   await projSchreiben({name:'lint-test',dateien:{'main.py':'import os\nimport sys\n\ndef f():\n    x = 1\n    return y\n\nprint( f() )\n'},haupt:'main.py',versionen:[],erstellt:Date.now()});await projektOeffnen('lint-test');});
  let ok=false;
  for(let i=0;i<3&&!ok;i++){
   await page.evaluate(()=>SDLinter.lintenJetzt().catch(()=>{}));
   try{await page.waitForFunction(()=>(S.problemeAnalyse||[]).some(p=>p.lint),null,{timeout:45000});ok=true}catch(e){console.log('Versuch',i+1,'Ruff:',await page.evaluate(()=>SDLinter.ruffStatus))}
  }
  console.log('Ruff-Status:',await page.evaluate(()=>SDLinter.ruffStatus));
  const funde=await page.evaluate(()=>(S.problemeAnalyse||[]).filter(p=>p.lint).map(p=>p.line+' '+p.severity+' '+p.text));
  console.log(funde.join('\n'));
  assert.ok(ok,'Ruff liefert Ergebnisse');
  assert.ok(funde.some(f=>/F401/.test(f)),'ungenutzter Import erkannt');
  assert.ok(funde.some(f=>/F821/.test(f)&&/ error /.test(f)),'nicht definierter Name als Fehler');
  assert.ok(funde.some(f=>/F841/.test(f)),'ungenutzte Variable erkannt');
  assert.match(await page.locator('#problemListe').innerText(),/Ruff F821/);
  await page.evaluate(()=>SDLinter.formatieren());
  await page.waitForFunction(()=>/print\(f\(\)\)/.test(S.p.dateien['main.py']),null,{timeout:20000});
  // JavaScript mit ESLint
  await page.evaluate(async()=>{await projSchreiben({name:'js-lint',dateien:{
    'index.html':'<script src="helfer.js"></script><script src="app.js"></script>',
    'helfer.js':'function rechne(a, b) {\n  return a + b;\n}\n',
    'app.js':'const ergebnis = rechne(1, 2);\nconsole.log(ergbnis);\nfunction ungenutzt() { let x = 5; }\nif (ergebnis == "3") { document.title = "ok"; }\n',
    'kaputt.js':'function f( {\n  return 1;\n'},haupt:'index.html',versionen:[],erstellt:Date.now()});await projektOeffnen('js-lint','app.js');});
  let jsOk=false;
  for(let i=0;i<3&&!jsOk;i++){await page.evaluate(()=>SDLinter.lintenJetzt().catch(()=>{}));
   try{await page.waitForFunction(()=>(S.problemeAnalyse||[]).some(p=>p.lint&&/ESLint/.test(p.text)),null,{timeout:45000});jsOk=true}catch(e){console.log('ESLint-Versuch',i+1,await page.evaluate(()=>SDLinter.eslintStatus))}}
  console.log('ESLint-Status:',await page.evaluate(()=>SDLinter.eslintStatus));
  const js=await page.evaluate(()=>(S.problemeAnalyse||[]).filter(p=>p.lint).map(p=>p.file+':'+p.line+' '+p.severity+' '+p.text));
  console.log(js.join('\n'));
  assert.ok(jsOk,'ESLint liefert Ergebnisse');
  assert.ok(js.some(f=>/app\.js:2 error .*no-undef.*ergbnis/.test(f)),'Tippfehler im Namen erkannt');
  assert.ok(!js.some(f=>/no-undef.*rechne/.test(f)),'Funktion aus anderem Skript ist bekannt');
  assert.ok(!js.some(f=>/no-undef.*(console|document)/.test(f)),'Browser-Namen sind bekannt');
  assert.ok(js.some(f=>/app\.js:3 warning .*no-unused-vars.*'x'/.test(f)),'ungenutzte lokale Variable');
  assert.ok(js.some(f=>/app\.js:4 warning .*eqeqeq/.test(f)),'== erkannt');
  assert.ok(js.some(f=>/kaputt\.js:\d+ error ESLint Syntax/.test(f)),'Syntaxfehler erkannt');
  assert.ok(!js.some(f=>/no-redeclare/.test(f)),'keine falschen Doppel-Deklarationen');
  assert.deepEqual(errors.filter(e=>!/ergbnis/.test(e)),[],'nur der absichtliche Fehler aus der Vorschau');
  console.log('PASS Ruff und ESLint im Browser: Prüfen und Formatieren');
 } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
