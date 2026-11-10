"use strict";
const assert=require("node:assert/strict");
const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html;charset=utf-8",".js":"application/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".svg":"image/svg+xml",".woff2":"font/woff2",".png":"image/png"};
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
assert.equal(await page.locator("#courses .course").count(),4);
await page.locator(".course").filter({hasText:"Programmieren anfangen"}).click();
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
await page.locator(".answers button").first().click();
assert.equal(await page.locator('[data-tab="uebersicht"]').count(),1);
await page.locator('[data-tab="uebersicht"]').click();
assert.equal(await page.locator("#statLessons").innerText(),"1");
await page.locator('[data-tab="akademie"]').click();
await page.locator(".course").filter({hasText:"Programmieren anfangen"}).click();
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
 await checkPage.locator(".course").filter({hasText:"Programmieren anfangen"}).click();
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

assert.deepEqual(errors,[],"Browser page errors: "+errors.join(", "));
console.log("PASS: Desktop + mobile interactive journey, data persistence, privacy and homepage link");
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(err=>{console.error(err);process.exitCode=1});