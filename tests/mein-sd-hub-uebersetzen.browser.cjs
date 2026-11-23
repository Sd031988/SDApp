"use strict";
// Akademie: Lerninhalte folgen der gewählten Sprache. Die Browser-KI (Translator API) wird hier durch eine Attrappe ersetzt;
// geprüft wird, dass Texte übersetzt, Code und Bedienung nicht angefasst, Arabisch rechts-nach-links gesetzt und
// beim Zurückschalten auf Deutsch das Original wiederhergestellt wird. Feste Übersetzungen (Dari) gelten auch ohne Translator API; sonst erscheint der Hinweis zur Seitenübersetzung.
const assert=require("node:assert/strict"),http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html;charset=utf-8",".js":"application/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{const url=new URL(req.url,"http://localhost");let rel=decodeURIComponent(url.pathname).replace(/^\/+/,"");if(!rel||rel.endsWith("/"))rel+="index.html";
 const p=path.resolve(root,rel);if(!p.startsWith(root)){res.writeHead(403);return res.end()}
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{"Content-Type":mime[path.extname(p)]||"application/octet-stream"});res.end(b)})});
async function kursOeffnen(page,base){
 await page.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
 await page.locator('[data-tab="akademie"]').click();
 await page.evaluate(()=>{const b=[...document.querySelectorAll("button.course")].find(x=>x.querySelector(".ak-icon")?.textContent==="🐍");b.click()});
 await page.locator(".code-lesson").waitFor();
}
async function zuSeite(page,name){for(let i=0;i<40;i++){if(await page.evaluate(n=>document.querySelector('.ak-step-balken button[aria-current="step"]')?.dataset.akTitle===n,name))return;await page.locator(".ak-step-nav .ak-weiter").click()}throw new Error("Seite nicht erreicht: "+name)}
(async()=>{
 await new Promise(r=>server.listen(0,"127.0.0.1",r));const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  // 1) Mit Browser-KI (Attrappe): Arabisch
  const ctx=await browser.newContext({locale:"ar",viewport:{width:1200,height:900}});
  await ctx.addInitScript(()=>{
   try{localStorage.setItem("sdSprache","ar")}catch(e){}
   window.__uebersetzt=0;
   window.Translator={availability:async()=>"available",create:async o=>({translate:async t=>{window.__uebersetzt++;return "ع:"+t}})};
  });
  const page=await ctx.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await kursOeffnen(page,base);
  await page.locator("#akUeHinweis button").waitFor({timeout:15000});
  const schritt=await page.locator(".code-step p").first().textContent();
  assert.match(schritt,/^ع:/,"Schritttext nicht übersetzt: "+schritt);
  assert.doesNotMatch(await page.locator(".code-step pre").first().textContent(),/ع:/,"Code darf nicht übersetzt werden");
  assert.equal(await page.locator(".code-step p").first().getAttribute("data-ak-ue"),"rtl");
  assert.ok(await page.evaluate(()=>window.__uebersetzt)>10);
  const lektion=await page.locator("#lessonList .lesson-btn b").first().textContent();assert.match(lektion,/^ع:/);
  // Zurück auf Deutsch: Original
  await page.evaluate(()=>window.sdApplyLang("de"));
  await page.waitForFunction(()=>!/ع:/.test(document.querySelector(".code-step p").textContent));
  assert.equal(await page.locator("#akUeHinweis").count(),0);
  // Wieder Arabisch: aus dem Zwischenspeicher, ohne neue Übersetzungsaufrufe für dieselben Texte
  const vorher=await page.evaluate(()=>window.__uebersetzt);
  await page.evaluate(()=>window.sdApplyLang("ar"));
  await page.waitForFunction(()=>/^ع:/.test(document.querySelector(".code-step p").textContent));
  assert.equal(await page.evaluate(()=>window.__uebersetzt),vorher,"Zwischenspeicher wird nicht genutzt");
  assert.deepEqual(errors,[]);
  await ctx.close();
  // 2) Feste Übersetzung (Dari) ohne Translator API, wie auf dem iPhone: Texte auf Dari, Code unverändert
  const ohneKI=()=>{try{delete window.Translator;delete self.Translator}catch(e){}Object.defineProperty(window,"Translator",{value:undefined,configurable:true})};
  const ctx2=await browser.newContext({locale:"fa",viewport:{width:390,height:844}});
  await ctx2.addInitScript(ohneKI);await ctx2.addInitScript(()=>{try{localStorage.setItem("sdSprache","fa");localStorage.setItem("sdhub.personal.v1",JSON.stringify({completedLessons:["ps-1"]}))}catch(e){}});
  const p2=await ctx2.newPage();const err2=[];p2.on("pageerror",e=>err2.push(e.message));await kursOeffnen(p2,base);await p2.locator("#lessonList .lesson-btn").first().click();await p2.locator(".code-lesson").waitFor();
  await p2.waitForFunction(()=>/ترجمهٔ ثابت/.test(document.getElementById("akUeHinweis")?.textContent||""),null,{timeout:15000});
  const st=await p2.evaluate(()=>{const ps=[...document.querySelectorAll(".code-lesson p, .code-lesson h4, .code-lesson h5, .code-lesson li, .code-lesson button")].filter(e=>!e.closest("pre,#akUeHinweis,.kv-start"));
   const deutsch=ps.map(e=>{const c=e.cloneNode(true);c.querySelectorAll("code").forEach(x=>x.remove());return c.textContent}).filter(t=>/[äöüß]|\b(und|der|die|das|ist|nicht|mit|eine?)\b/.test(t));
   return {deutsch,code:document.querySelector(".code-step pre").textContent,inline:[...document.querySelectorAll(".code-step p code")].map(c=>c.textContent),
    titel:document.querySelector("#lessonList .lesson-btn b").textContent,dir:document.querySelector(".code-step p").getAttribute("data-ak-ue")}});
  assert.deepEqual(st.deutsch,[],"Noch deutsche Lerntexte: "+st.deutsch.join(" | "));
  assert.equal(st.code,'print("Hallo!")');assert.ok(st.inline.includes("print"),"Inline-Code fehlt");
  assert.equal(st.titel,"اولین برنامهٔ پایتون شما");assert.equal(st.dir,"rtl");
  // Quiz-Rückmeldung ebenfalls auf Dari
  await zuSeite(p2,"Wissen prüfen");
  await p2.locator(".code-quiz").first().locator(".answers button").nth(1).click();
  await p2.waitForFunction(()=>/کاغذ/.test(document.querySelector(".code-quiz .feedback").textContent));
  // Zurück auf Deutsch: Original, Code unverändert
  await p2.evaluate(()=>window.sdApplyLang("de"));
  await p2.waitForFunction(()=>/Python ist eine Programmiersprache/.test(document.querySelector(".code-step p").textContent));
  assert.equal(await p2.locator(".code-step pre").first().textContent(),'print("Hallo!")');
  assert.equal(await p2.locator(".code-step p code").first().textContent(),"print");
  assert.deepEqual(err2,[]);
  await ctx2.close();
  // 3) Ohne Translator API und ohne feste Übersetzung (Urdu): Hinweis zur Seitenübersetzung
  const ctx3=await browser.newContext({locale:"ur",viewport:{width:1200,height:900}});
  await ctx3.addInitScript(ohneKI);await ctx3.addInitScript(()=>{try{localStorage.setItem("sdSprache","ur")}catch(e){}});
  const p3=await ctx3.newPage();await kursOeffnen(p3,base);
  await p3.locator("#akUeHinweis").waitFor({timeout:15000});
  assert.match(await p3.locator("#akUeHinweis").textContent(),/Edge|Chrome/);
  assert.equal(await p3.locator(".code-step p").first().getAttribute("data-ak-ue"),null);
  await ctx3.close();
  console.log("Akademie-Übersetzung: OK");
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
