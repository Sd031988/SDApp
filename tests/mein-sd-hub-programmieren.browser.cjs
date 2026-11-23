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
async function zuSeite(page,name){for(let i=0;i<40;i++){if(await page.evaluate(n=>document.querySelector('.ak-step-balken button[aria-current="step"]')?.dataset.akTitle===n,name))return;await page.locator(".ak-step-nav .ak-weiter").click()}throw new Error("Seite nicht erreicht: "+name)}
async function quizLoesen(page,kurs,index){const quiz=await page.evaluate(([k,i])=>window.SDAkademieKurse[k][i].quiz.map(q=>q.antworten[q.richtig]),[kurs,index]);const boxen=page.locator(".ak-seite:not([hidden]) .code-quiz");for(let i=0;i<quiz.length;i++)await boxen.nth(i).locator("button",{hasText:quiz[i]}).first().click()}
(async()=>{
 await new Promise(r=>server.listen(0,"127.0.0.1",r));const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const page=await browser.newPage({locale:"de-DE",viewport:{width:1250,height:900}});const errors=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")console.error("Konsole:",m.text())});
  page.on("dialog",d=>d.accept());
  await page.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
  await page.locator('[data-tab="akademie"]').click();
  for(const g of ["Python & KI","C++ & Rust","Uni-Kurse & Videos"])assert.ok(await page.locator(".course-group h3",{hasText:g}).count()===1,g);
  // Profi-Katalog: Kennzahlen, Suche, Universitätskurse mit Kostenhinweis
  assert.equal(await page.locator("#akStats .ak-stat").count(),5);
  await page.locator("#akSuche").fill("Ownership");
  assert.equal(await page.locator("#courses button.course").count(),1);
  await page.locator("#akSuche").fill("");
  assert.ok(await page.locator("#akUniGrid .ak-uni-karte").count()>=16);
  assert.ok(await page.locator("#akUniGrid .ak-kosten").count()>=6,"Coursera-Kostenhinweis fehlt");
  await page.locator("#akUniFilter button",{hasText:"Komplett kostenlos"}).click();
  assert.equal(await page.locator("#akUniGrid .ak-vorschau").count(),0);
  await page.locator("button.course").filter({has:page.locator("b",{hasText:/^Python für Einsteiger$/})}).click();
  await page.locator(".code-lesson h4",{hasText:"Dein erstes Python-Programm"}).waitFor();
  // Schritt für Schritt: Fortschrittsbalken, erste Seite ist die Übersicht, Aufgabe und Quiz sind gesperrt
  assert.ok(await page.locator(".ak-step-balken button").count()>=8);
  assert.equal(await page.locator(".ak-step-nav .ak-zurueck").isDisabled(),true);
  await page.locator(".ak-step-nav .ak-weiter").click();
  assert.equal(await page.locator(".ak-seite:not([hidden]) .code-step").count(),1,"Eine Erklärung pro Seite");
  await zuSeite(page,"Jetzt selbst schreiben");
  assert.equal(await page.locator(".ak-step-nav .ak-weiter").isDisabled(),true,"Aufgabe muss gesperrt sein");
  const ta=page.locator(".code-lesson textarea.code-textarea").first();
  await ta.fill('print("Hallo Welt")\nprint("Amina")\n');
  {
   await page.locator(".code-lesson .ak-seite:not([hidden]) button",{hasText:"Ausführen"}).click();
   try{await page.waitForFunction(()=>/Ausgeführt|LAUFZEITFEHLER|nicht laden|nicht im Browser|Gestoppt|beendet/.test(document.querySelector(".ak-seite:not([hidden]) .prog-ausgabe")?.textContent||""),null,{timeout:180000})}
   catch(e){console.error("Ausgabe bis jetzt:",await page.locator(".prog-ausgabe").textContent(),"Fehler:",errors);throw e}
   const out=await page.locator(".ak-seite:not([hidden]) .prog-ausgabe").textContent();console.log("Python-Ausgabe:",out.replace(/\n/g," | "));
   if(!process.env.SD_OFFLINE)assert.match(out,/Hallo Welt/);
  }
  await page.locator(".code-lesson .code-pruefen").click();
  const fehler=await page.locator(".code-checks .code-error").allInnerTexts();
  assert.deepEqual(fehler,[],"Prüfung meldet Fehler");
  await page.locator(".ak-step-nav .ak-weiter:not([disabled])").click();
  // Quiz: richtige Antwort per Datenbestand wählen, danach Abschlussseite mit XP
  await quizLoesen(page,"python-start",0);
  await zuSeite(page,"Das merkst du dir");
  await page.locator(".ak-xp").waitFor();
  assert.equal(await page.locator(".ak-lektion-nav").isVisible(),true,"Nächste Lektion erst am Ende");
  // C++-Lektion: Lösung zeigen, prüfen, ins Code-Studio übernehmen
  await page.locator("#kursZurueck").click();
  await page.locator("button.course").filter({has:page.locator("b",{hasText:/^C\+\+ für Einsteiger$/})}).click();
  await page.locator(".code-lesson h4",{hasText:"Hallo Welt in C++"}).waitFor();
  await zuSeite(page,"Jetzt selbst schreiben");
  await page.locator(".code-lesson .code-pruefen").click();await page.locator(".code-lesson .code-pruefen").click();
  await page.locator(".code-lesson button",{hasText:"Lösung zeigen"}).click();
  await page.locator(".code-lesson .code-pruefen").click();
  assert.equal(await page.locator(".code-checks .code-error").count(),0);
  await page.locator(".ak-step-nav .ak-weiter:not([disabled])").click();
  await quizLoesen(page,"cpp-start",0);
  await zuSeite(page,"Das merkst du dir");
  await Promise.all([page.waitForURL(/studio\/index\.html\?projekt=/,{timeout:20000}),page.locator(".code-lesson button",{hasText:"Im Code-Studio öffnen"}).click()]);
  const projekt=await page.evaluate(()=>new Promise(r=>{const q=indexedDB.open("sdCodeStudio",1);q.onsuccess=()=>{const g=q.result.transaction("projekte").objectStore("projekte").getAll();g.onsuccess=()=>r(g.result.map(p=>({name:p.name,haupt:p.haupt})))}}));
  assert.ok(projekt.some(p=>/Hallo Welt in C\+\+/.test(p.name)&&p.haupt==="main.cpp"),JSON.stringify(projekt));
  assert.deepEqual(errors.filter(e=>!/ResizeObserver/.test(e)),[]);
  console.log("Akademie Programmieren: OK"+(process.env.SD_OFFLINE?" (ohne echten Python-Lauf)":""));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
