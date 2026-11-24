"use strict";
// Deutsch an einem Ort: Die früheren Akademie-Deutschkurse laufen als „Praxis: Alltag und Beruf“ in „Deutsch lernen“.
// Geprüft: Akademie zeigt nur eine Deutsch-Karte, Praxis-Liste mit 28 Lektionen, Lektion Schritt für Schritt, Quiz sperrt „Weiter“, Abschluss wird gespeichert.
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
  const page=await browser.newPage({locale:"de-DE",viewport:{width:390,height:844}});const errors=[];page.on("pageerror",e=>{if(!/localStorage/.test(e.message))errors.push(e.message)});
  // Akademie: Fakultät Deutsch, eine Karte führt zu Deutsch lernen
  await page.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});await page.locator('[data-tab="akademie"]').click();
  await page.locator('#akBereiche [data-wert="Deutsch"]').click();
  const karte=page.locator("#courses a.ak-deutsch-karte");assert.equal(await karte.count(),1);
  await Promise.all([page.waitForURL(/\/deutsch\/$/),karte.click()]);
  // Profil anlegen, Niveau A1 wählen, Praxis öffnen
  await page.locator('input[placeholder="Name"]').fill("Test");await page.getByRole("button",{name:/Profil anlegen/}).click();
  // B1-Prüfung ist ein eigener Bereich nach B1 und erscheint nicht mehr oben in allen Niveaus
  await page.locator("#lB1PruefCard").waitFor();assert.equal(await page.locator(".b1-entries,#sdB1FixedEntry").count(),0);
  await page.locator("#lBody button",{hasText:/^A1Anfänger/}).click();
  await page.locator("#lPraxisBtn").waitFor();assert.equal(await page.locator(".b1-entries,#sdB1FixedEntry,#lB1PruefBtn").count(),0,"keine B1-Prüfung auf der A1-Startseite");
  await page.locator("#lPraxisBtn").click();
  await page.locator("[data-pl]").first().waitFor();
  assert.equal(await page.locator("[data-pl]").count(),28,"alle Praxis-Lektionen");
  assert.equal(await page.locator("details.l-praxis[open]").count(),1,"passender Kurs ist aufgeklappt");
  // Profil spricht Dari (Standard): jede Lektion zeigt ihren Titel zusätzlich auf Dari
  assert.equal(await page.locator("[data-pl] .l-px-tr[dir=rtl]").count(),28,"Dari-Titel in der Liste");
  await page.locator("[data-pl]").first().click();
  await page.locator("#lPxWei").waitFor();
  const schritte=async()=>page.evaluate(()=>document.querySelector(".l-lhead small").textContent);
  assert.match(await schritte(),/^Schritt 1 von \d+$/);
  assert.ok(await page.locator("#lPx h2 .l-px-tr[lang=fa]").count()===1&&await page.locator("#lPx p.l-ptext .l-px-tr").count()===1,"Titel und Erklärung auf Dari");
  assert.equal(await page.locator("#lPx .kv-box .kv-start").count(),1,"Video zur ersten Lektion");
  assert.equal(await page.locator("#lPx .kv-box h5 .l-px-tr").count(),1,"Video-Überschrift auf Dari");
  let uebungDari=false;
  let quizGesehen=false,uebungen=0;
  for(let i=0;i<20;i++){
   if(await page.locator("#lPx .ak-uebung").count()){uebungen++;if(await page.locator("#lPx .ak-uebung .l-px-tr").count())uebungDari=true}
   if(await page.locator("#lPx .l-bq").count()){
    quizGesehen=true;assert.equal(await page.locator("#lPxWei").isDisabled(),true,"Quiz sperrt Weiter");
    const qs=await page.evaluate(()=>window.SDAkademieKurse.german[0].quiz.map(q=>q.antworten[q.richtig]));
    for(let k=0;k<qs.length;k++)await page.locator("#lPx .l-bq").nth(k).locator("button",{hasText:qs[k]}).first().click();
   }
   if(!(await page.locator("#lPxWei").count()))break;
   await page.locator("#lPxWei:not([disabled])").click();
  }
  assert.ok(quizGesehen,"Quiz fehlt");assert.ok(uebungDari,"Übungen mit Dari-Hilfe");assert.equal(uebungen,4,"vier Übungen");
  await page.locator(".l-geschafft").waitFor();
  const gespeichert=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem("sdLearn")).profiles)[0].praxis);
  assert.ok(gespeichert["g-1"],"Abschluss gespeichert");
  await page.locator("#lPxListe").click();
  assert.match(await page.locator("details.l-praxis").first().locator("summary").textContent(),/1\/4/,"Fortschritt in der Liste");
  const breite=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(breite<=2,"kein seitliches Scrollen");
  assert.deepEqual(errors,[]);
  // eigener B1-Prüfungsbereich öffnet die Musterprüfungen
  await page.goto(base+"/deutsch/");await page.locator("#lLvBtn").click();await page.locator("#lB1PruefCard").click();
  await page.locator("#lB1Muster").click();await page.locator("#b1x").waitFor();
  console.log("Deutsch Praxis: OK");
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
