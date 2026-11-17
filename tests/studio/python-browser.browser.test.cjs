'use strict';
// Python direkt im Browser (Pyodide über jsDelivr). Läuft in GitHub Actions mit Internet.
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
  await page.waitForFunction(()=>typeof S!=='undefined'&&S.layoutBereit,null,{timeout:30000});
  const lauf=async(dateien,haupt,eingabe,muster,timeout)=>{
   await page.evaluate(async([d,h])=>{const st=document.getElementById('studioStart');if(st)st.hidden=true;
    await projSchreiben({name:'py-test',dateien:d,haupt:h,versionen:[],erstellt:Date.now()});await projektOeffnen('py-test',h);},[dateien,haupt]);
   await page.fill('#eingabe',eingabe||'');
   await page.evaluate(()=>ausfuehren());
   await page.waitForFunction(m=>new RegExp(m).test(document.getElementById('ausgabe').textContent),muster,{timeout:timeout||120000});
   return page.textContent('#ausgabe');
  };
  let t=await lauf({'main.py':'from helfer import gruss\nname = input("Name? ")\nzahl = int(input())\nprint(gruss(name), zahl * 2)\n','helfer.py':'def gruss(n):\n    return "Hallo " + n\n','daten/info.txt':'x'},'main.py','Anna | 21','✅|❌|ℹ',180000);
  console.log(t.slice(0,400));
  assert.match(t,/✅ Ausgeführt \(Python [\d.]+, direkt im Browser/);assert.match(t,/Hallo Anna 42/);
  t=await lauf({'main.py':'import numpy as np\nprint("Summe", int(np.arange(5).sum()))\n'},'main.py','','✅|❌',180000);
  console.log(t.slice(0,300));assert.match(t,/Summe 10/);
  t=await lauf({'main.py':'def f():\n    return 1 / 0\n\nprint("vorher")\nf()\n'},'main.py','','❌|✅');
  console.log(t.slice(0,500));assert.match(t,/ZeroDivisionError/);assert.match(t,/vorher/);
  const probl=await page.evaluate(()=>S.problemeProgramm.map(p=>(p.datei||p.file)+':'+(p.zeile||p.line)));console.log('Probleme:',probl);
  assert.ok(probl.some(p=>/main\.py:2/.test(p)),'Fehlerzeile erkannt');
  t=await lauf({'main.py':'import gibtsnicht_xyz\n'},'main.py','','❌|✅');
  assert.match(t,/gibt es im Browser nicht/);
  assert.deepEqual(errors,[]);
  console.log('PASS Python im Browser: Eingaben, Module, numpy, Fehlerzeilen, Hinweise');
 } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
