"use strict";
// Akademie: Python-/C++-Lektionen im Browser – Code schreiben, Python wirklich ausführen (Pyodide vom CDN), prüfen, Quiz, Code-Studio.
// Lokal ohne Internet: SD_OFFLINE=1 überspringt nur den echten Python-Lauf.
const assert=require("node:assert/strict"),http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html;charset=utf-8",".js":"application/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{const url=new URL(req.url,"http://localhost");let rel=decodeURIComponent(url.pathname).replace(/^\/+/,"");if(!rel||rel.endsWith("/"))rel+="index.html";
 const p=path.resolve(root,rel);if(!p.startsWith(root)){res.writeHead(403);return res.end()}
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{"Content-Type":mime[path.extname(p)]||"application/octet-stream"});res.end(b)})});
(async()=>{
 await new Promise(r=>server.listen(0,"127.0.0.1",r));const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const page=await browser.newPage({locale:"de-DE",viewport:{width:1250,height:900}});const errors=[];page.on("pageerror",e=>errors.push(e.message));
  page.on("dialog",d=>d.accept());
  await page.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
  await page.locator('[data-tab="akademie"]').click();
  for(const g of ["Python & KI","C++ & Rust","Uni-Kurse & Videos"])assert.ok(await page.locator(".course-group h3",{hasText:g}).count()===1,g);
  await page.locator("button.course").filter({has:page.locator("b",{hasText:/^Python für Einsteiger$/})}).click();
  await page.locator(".code-lesson h4",{hasText:"Dein erstes Python-Programm"}).waitFor();
  const ta=page.locator(".code-lesson textarea.code-textarea").first();
  await ta.fill('print("Hallo Welt")\nprint("Amina")\n');
  if(!process.env.SD_OFFLINE){
   await page.locator(".code-lesson button",{hasText:"Ausführen"}).click();
   await page.waitForFunction(()=>/Ausgeführt/.test(document.querySelector(".code-lesson pre.code-example:not([hidden]):last-of-type")?.textContent||[...document.querySelectorAll(".code-lesson pre.code-example")].map(p=>p.textContent).join("")),null,{timeout:120000});
   const out=await page.evaluate(()=>[...document.querySelectorAll(".code-lesson pre.code-example")].map(p=>p.textContent).join("\n"));
   assert.match(out,/Hallo Welt/);
  }
  await page.locator(".code-lesson .code-pruefen").click();
  const fehler=await page.locator(".code-checks .code-error").allInnerTexts();
  if(process.env.SD_OFFLINE)assert.deepEqual(fehler.map(t=>/zuerst mit ▶ Ausführen/.test(t)),fehler.length?[true]:[]);
  else assert.deepEqual(fehler,[],"Prüfung meldet Fehler");
  // Quiz: richtige Antwort per Datenbestand wählen
  const quiz=await page.evaluate(()=>window.SDAkademieKurse["python-start"][0].quiz.map(q=>q.antworten[q.richtig]));
  const boxen=page.locator(".code-quiz");
  for(let i=0;i<quiz.length;i++)await boxen.nth(i).locator("button",{hasText:quiz[i]}).first().click();
  await page.locator(".code-ok",{hasText:"Lektion abgeschlossen"}).waitFor();
  // C++-Lektion: Lösung zeigen, prüfen, ins Code-Studio übernehmen
  await page.locator("#kursZurueck").click();
  await page.locator("button.course").filter({has:page.locator("b",{hasText:/^C\+\+ für Einsteiger$/})}).click();
  await page.locator(".code-lesson h4",{hasText:"Hallo Welt in C++"}).waitFor();
  await page.locator(".code-lesson .code-pruefen").click();await page.locator(".code-lesson .code-pruefen").click();
  await page.locator(".code-lesson button",{hasText:"Lösung zeigen"}).click();
  await page.locator(".code-lesson .code-pruefen").click();
  assert.equal(await page.locator(".code-checks .code-error").count(),0);
  await Promise.all([page.waitForURL(/studio\/index\.html\?projekt=/,{timeout:20000}),page.locator(".code-lesson button",{hasText:"Im Code-Studio öffnen"}).click()]);
  const projekt=await page.evaluate(()=>new Promise(r=>{const q=indexedDB.open("sdCodeStudio",1);q.onsuccess=()=>{const g=q.result.transaction("projekte").objectStore("projekte").getAll();g.onsuccess=()=>r(g.result.map(p=>({name:p.name,haupt:p.haupt})))}}));
  assert.ok(projekt.some(p=>/Hallo Welt in C\+\+/.test(p.name)&&p.haupt==="main.cpp"),JSON.stringify(projekt));
  assert.deepEqual(errors.filter(e=>!/ResizeObserver/.test(e)),[]);
  console.log("Akademie Programmieren: OK"+(process.env.SD_OFFLINE?" (ohne echten Python-Lauf)":""));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
