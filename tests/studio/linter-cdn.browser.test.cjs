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
  await page.addInitScript(()=>{localStorage.setItem('sdStudioEinst',JSON.stringify({konfetti:false}))});
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
  assert.deepEqual(errors,[]);
  console.log('PASS Ruff im Browser: Prüfen und Formatieren');
 } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
