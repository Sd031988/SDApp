"use strict";
const assert=require("node:assert/strict");
const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html;charset=utf-8",".js":"application/javascript;charset=utf-8",".mjs":"application/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".svg":"image/svg+xml",".woff2":"font/woff2",".png":"image/png"};
const server=http.createServer((req,res)=>{
try{
const url=new URL(req.url,"http://localhost");let rel=decodeURIComponent(url.pathname).replace(/^\/+/,"");if(!rel||rel.endsWith("/"))rel+="index.html";
const p=path.resolve(root,rel);if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403);return res.end("Forbidden")}
fs.readFile(p,(err,body)=>{if(err){res.writeHead(404);return res.end("Not found")}res.writeHead(200,{"Content-Type":mime[path.extname(p)]||"application/octet-stream"});res.end(body)})
}catch(e){res.writeHead(400);res.end("Bad request")}}
);
(async()=>{
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port,base="http://127.0.0.1:"+port;
let browser;
try{
browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1250,height:820}});const page=await ctx.newPage();const errors=[];
page.on("pageerror",e=>errors.push(e.message));
await page.goto(base+"/mein-sd-hub/",{waitUntil:"load"});
assert.match(await page.title(),/Mein SD Hub/);
assert.equal(await page.locator(".tab[data-tab]").count(),6); // Six content tabs, plus the mobile More control.
assert.equal(await page.locator("#goalGrid .goal").count(),5);
await page.locator('[data-tab="wegweiser"]').click();
await page.locator("#goalSearch").fill("Ich möchte B1 üben");
await page.locator("#goalSearchBtn").click();
assert.match(await page.locator("#wayResults").innerText(),/B1-Prüfungstraining/);
await page.locator("#wayResults .star").first().click();
await page.locator('[data-tab="uebersicht"]').click();
assert.equal(await page.locator("#statFavs").innerText(),"1");
await page.locator("#nickname").fill("Tester");
assert.match(await page.locator("#greeting").innerText(),/Tester/);
await page.locator('[data-tab="akademie"]').click();
assert.equal(await page.locator("#courses .course").count(),await page.evaluate(()=>window.SDPersonalData.academy.length));
await page.locator(".course").filter({has:page.locator("b",{hasText:/^Programmieren anfangen$/})}).click();
await page.locator(".lesson-btn").first().waitFor();
const lessonChecks=await page.evaluate(()=>{
 const D=window.SDPersonalData;
 return D.academy.find(c=>c.id==="code").lessons.map(lesson=>{
  const run=code=>{const doc=new DOMParser().parseFromString(code.html,"text/html");return lesson.aufgabe.pruefungen.map(p=>D.pruefeCode(p.test,code,doc))};
  return {id:lesson.id,solution:run(lesson.aufgabe.loesung),start:run(lesson.beispiel)};
 });
});
for(const lesson of lessonChecks){
 assert.ok(lesson.solution.every(Boolean),"Musterlösung nicht bestanden: "+lesson.id);
 assert.ok(lesson.start.some(x=>!x),"Startcode ist schon vollständig: "+lesson.id);
}

await page.locator(".course").filter({hasText:"Deutsch im Alltag"}).click();
await page.locator(".lesson-btn").first().waitFor();
for(const correct of require(path.join(root,"mein-sd-hub/kurse/german.js"))[0].quiz.map(q=>q.richtig)){
 await page.locator(".ak-lesson-quiz .answers button").nth(correct).click();
 await page.locator(".ak-lesson-quiz .btn").click();
}
assert.equal(await page.locator('[data-tab="uebersicht"]').count(),1);
await page.locator('[data-tab="uebersicht"]').click();
assert.equal(await page.locator("#statLessons").innerText(),"1");
await page.locator('[data-tab="akademie"]').click();
await page.locator(".course").filter({has:page.locator("b",{hasText:/^Programmieren anfangen$/})}).click();
await page.locator(".lesson-btn").first().waitFor();
assert.equal(await page.locator(".lesson-btn").count(),12);
assert.equal(await page.locator(".code-textarea").count(),1);
assert.equal(await page.locator(".code-frame[sandbox='allow-scripts']").count(),1);
await page.locator(".code-textarea").fill("<h1>Meine erste Seite</h1><p>Ich lerne selbst.</p>");
await page.waitForTimeout(500);
assert.match(await page.locator(".code-frame").getAttribute("srcdoc"),/Meine erste Seite/);
await page.locator(".code-pruefen").click();
const expectedChecks=await page.evaluate(()=>window.SDPersonalData.academy.find(c=>c.id==="code").lessons[0].aufgabe.pruefungen.length);
assert.equal(await page.locator(".code-checks .code-ok").count(),expectedChecks+1);
await page.locator(".code-tabs button").filter({hasText:"CSS"}).click();
await page.locator(".code-textarea").fill("body { background-color: #eef; }");
await page.locator(".code-tabs button").filter({hasText:"HTML"}).click();
assert.match(await page.locator(".code-textarea").inputValue(),/Meine erste Seite/);
await page.locator(".course").filter({hasText:"Deutsch im Alltag"}).click();
await page.locator('[data-tab="leben"]').click();
assert.equal(await page.locator("#pathGrid .path").count(),4);
await page.locator("#pathSteps input[type=checkbox]").first().check();
await page.locator('[data-tab="uebersicht"]').click();
assert.equal(await page.locator("#statSteps").innerText(),"1");
await page.locator('[data-tab="projekte"]').click();
assert.equal(await page.locator("#projectGrid .project").count(),4);
const downloadEvent=page.waitForEvent("download");
await page.locator("#downloadProject").click();const download=await downloadEvent;
assert.equal(download.suggestedFilename(),"mein-profil.html");
await page.locator('[data-tab="sprache"]').click();
assert.equal(await page.locator("#phraseList .phrase").count(),10);
await page.locator("#translateLang").selectOption("fa");
assert.match(await page.locator("#phraseList .phrase").first().innerText(),/روز بخیر/);
await page.reload();
await page.locator('[data-tab="uebersicht"]').click();
assert.match(await page.locator("#greeting").innerText(),/Tester/);
assert.equal(await page.locator("#statLessons").innerText(),"1");
assert.equal(await page.locator("#statSteps").innerText(),"1");
page.once("dialog",dialog=>dialog.accept());
await page.locator("#clearState").click();
assert.equal(await page.locator("#statLessons").innerText(),"0");
await page.reload();
assert.equal(await page.locator("#statFavs").innerText(),"0");
assert.equal(await page.locator("#statLessons").innerText(),"0");
const home=await ctx.newPage();await home.goto(base+"/",{waitUntil:"load"});assert.equal(await home.locator("#bento").count(),1);assert.equal(await home.locator("#mein-sd-hub").count(),1);await home.close();
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await mobile.goto(base+"/mein-sd-hub/",{waitUntil:"load"});
await mobile.locator('[data-tab="wegweiser"]').click();
assert.equal(await mobile.locator("#goalGrid .goal").count(),5);
const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
assert.ok(overflow<=3,"Unexpected mobile horizontal overflow: "+overflow);
await mobile.close();
for(const width of [320,390,1300]){
 const checkPage=await browser.newPage({viewport:{width,height:840}});
 await checkPage.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await checkPage.locator('[data-tab="akademie"]').click();
 await checkPage.locator(".course").filter({has:checkPage.locator("b",{hasText:/^Programmieren anfangen$/})}).click();
 await checkPage.locator(".lesson-btn").first().waitFor();
assert.equal(await checkPage.locator(".lesson-btn").count(),12);
 const overflow=await checkPage.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=3,"Horizontales Scrollen bei "+width+" px: "+overflow);
 await checkPage.locator(".code-textarea").fill("<h1>Meine eigene Webseite</h1><p>Ich lerne HTML.</p>");
 await checkPage.waitForTimeout(450);
 assert.match(await checkPage.locator(".code-frame").getAttribute("srcdoc"),/Meine eigene Webseite/);
 await checkPage.locator(".code-pruefen").click();
 assert.equal(await checkPage.locator(".code-checks .code-error").count(),0);
 for(const quiz of await checkPage.locator(".code-quiz").all())await quiz.locator(".answers button").first().click();
 await checkPage.locator(".code-lesson button").filter({hasText:"Im Code-Studio öffnen"}).click();
 await checkPage.waitForURL(url=>url.pathname==="/studio/index.html"&&url.searchParams.has("projekt"),{timeout:15000});
 const name=new URL(checkPage.url()).searchParams.get("projekt");
 assert.ok(name.startsWith("Akademie – "));
 await checkPage.close();
}


/* Alle Übungsformen werden mit Touch-freundlichen Bedienelementen geprüft. */
for(const width of [320,390,1300]){
 const exercisePage=await browser.newPage({viewport:{width,height:840}});
 exercisePage.on("pageerror",e=>errors.push("Übung "+width+": "+e.message));
 await exercisePage.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await exercisePage.locator('[data-tab="akademie"]').click();
 const cases=[
  ["Deutsch im Alltag",0,"luecke"],
  ["Deutsch im Alltag",0,"hoeren"],
  ["Deutsch im Alltag",1,"zuordnen"],
  ["Computer-Start",1,"auswahl"],
  ["Computer-Start",2,"reihenfolge"],
  ["Bewerbung & Beruf",2,"schreiben"]
 ];
 for(const [course,lesson,typ] of cases){
  await exercisePage.locator(".course").filter({has:exercisePage.locator("b",{hasText:new RegExp("^"+course+"$")})}).click();
  await exercisePage.locator(".lesson-btn").nth(lesson).click();
  const box=exercisePage.locator(".ak-uebung").filter({has:exercisePage.locator("h5",{hasText:{
   luecke:"Satz zur Vorstellung",hoeren:"Eine Vorstellung hören",zuordnen:"Höfliche Fragen",
   auswahl:"Verdächtige Nachricht",reihenfolge:"Eine Datei sicher",schreiben:"Ein kurzer Satz"
  }[typ]})});
  await box.waitFor();
  const check=box.getByRole("button",{name:"Prüfen"});
  if(typ==="schreiben"){
   await box.locator("textarea").fill("Ich interessiere mich für die Stelle im Verkauf.");
   await check.click();
   assert.match(await box.locator('[role="status"]').innerText(),/keine automatische Note/i);
   assert.equal(await box.getByRole("button",{name:"Lösung zeigen"}).isVisible(),true);
   assert.match(await box.innerText(),/Checkliste|Ich nenne die Stelle/);
  }else{
   for(let attempt=1;attempt<=3;attempt++){
    await check.click();
    assert.match(await box.locator('[role="status"]').innerText(),/Noch nicht richtig/);
    assert.equal(await box.locator(".hint, p").filter({hasText:/^Tipp:/}).isVisible(),attempt>=2);
    assert.equal(await box.getByRole("button",{name:"Lösung zeigen"}).isVisible(),attempt>=3);
   }
   await box.getByRole("button",{name:"Lösung zeigen"}).click();
   assert.match(await box.innerText(),/Musterlösung:/);
   if(typ==="luecke"){await box.locator('input[type="text"]').nth(0).fill("heiße");await box.locator('input[type="text"]').nth(1).fill("wohne")}
   if(typ==="hoeren")await box.locator('input[type="text"]').fill("Samira");
   if(typ==="zuordnen"){await box.locator("select").nth(0).selectOption({label:"Wo finde ich Brot?"});await box.locator("select").nth(1).selectOption({label:"Wie viel kostet das?"});await box.locator("select").nth(2).selectOption({label:"Kann ich bitte bezahlen?"})}
   if(typ==="auswahl"){await box.locator('input[type="checkbox"]').nth(0).check();await box.locator('input[type="checkbox"]').nth(1).check()}
   if(typ==="reihenfolge"){await box.getByRole("button",{name:"Ordner öffnen Hoch"}).click();await box.getByRole("button",{name:"Datei sinnvoll benennen Hoch"}).click()}
   await check.click();
   assert.match(await box.locator('[role="status"]').innerText(),/Richtig/);
  }
  const extra=await exercisePage.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(extra<=3,"Übungsansicht läuft bei "+width+" px "+typ+" über: "+extra);
 }
 await exercisePage.close();
}


/* D1-Kursabschluss: acht Lektionen, zehn Fragen und Druckansicht. */
const finalPage=await browser.newPage({viewport:{width:390,height:844}});
finalPage.on("pageerror",e=>errors.push("Abschluss: "+e.message));
await finalPage.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
await finalPage.locator('[data-tab="akademie"]').click();
await finalPage.locator(".course").filter({hasText:"Deutsch im Alltag"}).click();
await finalPage.locator(".lesson-btn").first().waitFor();
const germanQuiz=require(path.join(root,"mein-sd-hub/kurse/german.js"));
for(let i=0;i<8;i++){
 await finalPage.locator(".lesson-btn").nth(i).click();
 for(let j=0;j<3;j++){
  await finalPage.locator(".ak-lesson-quiz .answers button").nth(germanQuiz[i].quiz[j].richtig).click();
  await finalPage.locator(".ak-lesson-quiz .btn").click();
 }
}
await finalPage.getByRole("button",{name:"Abschlusstest starten (10 Fragen)"}).click();
for(let i=0;i<10;i++){
 await finalPage.locator(".ak-final-questions .answers button").nth([0,1,2,1,2,0,2,0,1,1][i]).click();
}
assert.match(await finalPage.locator(".ak-final-questions").innerText(),/10 von 10/);
assert.equal(await finalPage.getByText("Teilnahmebestätigung",{exact:true}).count(),1);
assert.match(await finalPage.locator(".ak-certificate").innerText(),/KEIN offizielles Zertifikat/);
await finalPage.locator(".ak-certificate input").fill("Testperson");
assert.equal(await finalPage.getByRole("button",{name:"Teilnahmebestätigung drucken"}).count(),1);
await finalPage.close();


/* C1: Nicht-Programmierkurs zeigt Lernschritte und passende Übungen ohne Code-Editor. */
for(const width of [320,390,1300]){
 const c1=await browser.newPage({viewport:{width,height:820}});
 c1.on("pageerror",e=>errors.push("C1 "+width+": "+e.message));
 await c1.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await c1.locator('[data-tab="akademie"]').click();
 await c1.locator(".course").filter({has:c1.locator("b",{hasText:/^Computer-Start$/})}).click();
 await c1.locator(".lesson-btn").first().waitFor();
 assert.equal(await c1.locator(".lesson-btn").count(),8);
 await c1.locator(".lesson-btn").first().click();
 for(const [questionIndex,correctIndex] of [2,0,1].entries()){
  assert.match(await c1.locator(".ak-lesson-quiz h4").innerText(),new RegExp((questionIndex+1)+"/3"));
  assert.equal(await c1.locator(".ak-lesson-quiz .answers button").count(),3);
  await c1.locator(".ak-lesson-quiz .answers button").nth(correctIndex).click();
  await c1.locator(".ak-lesson-quiz button.btn").click();
 }
 assert.equal(await c1.evaluate(()=>Array.from({length:localStorage.length},(_,i)=>localStorage.getItem(localStorage.key(i))).some(raw=>{try{return JSON.parse(raw).completedLessons?.includes("d-1")}catch{return false}})),true,"C1 speichert den Abschluss erst nach allen drei richtigen Antworten");
 for(let i=0;i<8;i++){
  await c1.locator(".lesson-btn").nth(i).click();
  assert.equal(await c1.locator(".ak-practice-step").count(),4,"C1 Schrittzahl "+i);
  assert.equal(await c1.locator(".code-editor").count(),0,"C1 zeigt unerwartet einen Code-Editor");
 }
 const overflow=await c1.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=3,"C1 "+width+"px Überlauf: "+overflow);
 await c1.close();
}
/* C2: Nicht-Programmierkurs lädt alle acht Internet- und E-Mail-Lektionen. */
for(const width of [320,390,1300]){
 const c2=await browser.newPage({viewport:{width,height:820}});
 c2.on("pageerror",e=>errors.push("C2 "+width+": "+e.message));
 await c2.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await c2.locator('[data-tab="akademie"]').click();
 await c2.locator(".course").filter({has:c2.locator("b",{hasText:/^Internet & E-Mail$/})}).click();
 await c2.locator(".lesson-btn").first().waitFor();
 assert.equal(await c2.locator(".lesson-btn").count(),8);
 for(let i=0;i<8;i++){
  await c2.locator(".lesson-btn").nth(i).click();
  assert.equal(await c2.locator(".ak-practice-step").count(),4,"C2 Schrittzahl "+i);
  assert.equal(await c2.locator(".ak-lesson-quiz .answers button").count(),3,"C2 Quiz "+i);
  assert.equal(await c2.locator(".code-editor").count(),0,"C2 darf keinen Code-Editor zeigen");
 }
 const overflow=await c2.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=3,"C2 "+width+"px Überlauf: "+overflow);
 await c2.close();
}
/* D2: Deutsch A2 in drei Viewports mit Sprachübungen. */
for(const width of [320,390,1300]){
 const d2=await browser.newPage({viewport:{width,height:820}});
 d2.on("pageerror",e=>errors.push("D2 "+width+": "+e.message));
 await d2.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await d2.locator('[data-tab="akademie"]').click();
 await d2.locator(".course").filter({has:d2.locator("b",{hasText:/^Deutsch A2$/})}).click();
 await d2.locator(".lesson-btn").first().waitFor();
 assert.equal(await d2.locator(".lesson-btn").count(),8);
 for(let i=0;i<8;i++){
  await d2.locator(".lesson-btn").nth(i).click();
  assert.equal(await d2.locator(".ak-practice-step").count(),4);
  assert.equal(await d2.locator(".ak-lesson-quiz .answers button").count(),3);
  assert.equal(await d2.locator(".code-editor").count(),0);
 }
 assert.ok(await d2.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=3,"D2 Überlauf "+width);
 await d2.close();
}
/* C5: Profi-Werkzeuge auf drei Viewports ohne Code-Editor prüfen. */
for(const width of [320,390,1300]){
 const c5=await browser.newPage({viewport:{width,height:820}});
 c5.on("pageerror",e=>errors.push("C5 "+width+": "+e.message));
 await c5.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await c5.locator('[data-tab="akademie"]').click();
 await c5.locator(".course").filter({has:c5.locator("b",{hasText:/^Digitale Profi-Werkzeuge$/})}).click();
 await c5.locator(".lesson-btn").first().waitFor();
 assert.equal(await c5.locator(".lesson-btn").count(),8);
 for(let i=0;i<8;i++){
  await c5.locator(".lesson-btn").nth(i).click();
  assert.equal(await c5.locator(".ak-practice-step").count(),4,"C5 Schritte "+i);
  assert.equal(await c5.locator(".ak-lesson-quiz .answers button").count(),3,"C5 Quiz "+i);
  assert.equal(await c5.locator(".code-editor").count(),0,"C5 ohne Code-Editor");
 }
 const overflow=await c5.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=3,"C5 "+width+"px Überlauf: "+overflow);
 await c5.close();
}
/* C4: Büro-Programme auf drei Viewports ohne Code-Editor prüfen. */
for(const width of [320,390,1300]){
 const c4=await browser.newPage({viewport:{width,height:820}});
 c4.on("pageerror",e=>errors.push("C4 "+width+": "+e.message));
 await c4.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await c4.locator('[data-tab="akademie"]').click();
 await c4.locator(".course").filter({has:c4.locator("b",{hasText:/^Büro-Programme$/})}).click();
 await c4.locator(".lesson-btn").first().waitFor();
 assert.equal(await c4.locator(".lesson-btn").count(),8);
 for(let i=0;i<8;i++){
  await c4.locator(".lesson-btn").nth(i).click();
  assert.equal(await c4.locator(".ak-practice-step").count(),4,"C4 Schritte "+i);
  assert.equal(await c4.locator(".ak-lesson-quiz .answers button").count(),3,"C4 Quiz "+i);
  assert.equal(await c4.locator(".code-editor").count(),0,"C4 ohne Code-Editor");
 }
 const overflow=await c4.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=3,"C4 "+width+"px Überlauf: "+overflow);
 await c4.close();
}
/* C3: alle Sicherheitslektionen im Browser laden, ohne Code-Editor. */
for(const width of [320,390,1300]){
 const c3=await browser.newPage({viewport:{width,height:820}});
 c3.on("pageerror",e=>errors.push("C3 "+width+": "+e.message));
 await c3.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await c3.locator('[data-tab="akademie"]').click();
 await c3.locator(".course").filter({has:c3.locator("b",{hasText:/^Sicher im Netz$/})}).click();
 await c3.locator(".lesson-btn").first().waitFor();
 assert.equal(await c3.locator(".lesson-btn").count(),8);
 for(let i=0;i<8;i++){
  await c3.locator(".lesson-btn").nth(i).click();
  assert.equal(await c3.locator(".ak-practice-step").count(),4,"C3 Schrittzahl "+i);
  assert.equal(await c3.locator(".ak-lesson-quiz .answers button").count(),3,"C3 Quiz "+i);
  assert.equal(await c3.locator(".code-editor").count(),0,"C3 darf keinen Code-Editor zeigen");
 }
 const overflow=await c3.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=3,"C3 "+width+"px Überlauf: "+overflow);
 await c3.close();
}
/* P5: alle Lektionen im Browser laden und Praxisprüfungen durchführen. */
for(const width of [320,390,1300]){
 const p5page=await browser.newPage({viewport:{width,height:820}});
 p5page.on("pageerror",e=>errors.push("P5 "+width+": "+e.message));
 await p5page.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await p5page.locator('[data-tab="akademie"]').click();
 await p5page.locator(".course").filter({hasText:"Fortgeschritten: saubere Web-Apps"}).click();
 await p5page.locator(".lesson-btn").first().waitFor();
 assert.equal(await p5page.locator(".lesson-btn").count(),8);
 for(let i=0;i<8;i++){
  await p5page.locator(".lesson-btn").nth(i).click();
  const title=await p5page.locator(".lesson-btn").nth(i).innerText();
  assert.ok(title.length>5,"P5 Lektion "+i+" ohne Titel");
 }
 const overflow=await p5page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=3,"P5 "+width+"px Überlauf: "+overflow);
 await p5page.close();
}

/* P4: Browser lädt echte Module aus zwei Dateien. */
const modulePage=await browser.newPage({viewport:{width:390,height:800}});
modulePage.on("pageerror",e=>errors.push("P4 Modul: "+e.message));
await modulePage.goto(base+"/mein-sd-hub/p4-module/index.html",{waitUntil:"load"});
await modulePage.getByText("Doppelt von 5 ist 10").waitFor();
await modulePage.close();

/* P4: eigenständige Quiz-App lädt lokale JSON-Daten und bleibt mobil bedienbar. */
for(const width of [320,390,1300]){
 const quizPage=await browser.newPage({viewport:{width,height:800}});
 quizPage.on("pageerror",e=>errors.push("P4 Quiz "+width+": "+e.message));
 await quizPage.goto(base+"/mein-sd-hub/p4-quiz.html",{waitUntil:"load"});
 await quizPage.getByRole("button",{name:"Quiz starten"}).click();
 await quizPage.getByRole("heading",{name:/Welche Methode erzeugt/}).waitFor();
 for(const answer of ["map","JSON.parse","antwort.ok"]){
  await quizPage.getByRole("button",{name:answer,exact:true}).click();
 }
 assert.match(await quizPage.locator("#meldung").innerText(),/3 von 3/);
 const overflow=await quizPage.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(overflow<=3,"P4 Quiz bei "+width+" px horizontaler Überlauf: "+overflow);
 await quizPage.close();
}

assert.deepEqual(errors,[],"Browser page errors: "+errors.join(", "));
console.log("PASS: Desktop + mobile interactive journey, data persistence, privacy and homepage link");
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
 const {execFileSync}=require("node:child_process");
 for(const testFile of ["tests/hub-homepage.browser.cjs","tests/hub/dashboard.browser.cjs"]){
  execFileSync(process.execPath,[path.join(root,testFile)],{cwd:root,stdio:"inherit",timeout:180000});
 }
})().catch(err=>{console.error(err);process.exitCode=1});