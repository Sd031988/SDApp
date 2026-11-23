"use strict";
// Akademie: Lerninhalte folgen der gewählten Sprache. Die Browser-KI (Translator API) wird hier durch eine Attrappe ersetzt;
// geprüft wird, dass Texte übersetzt, Code und Bedienung nicht angefasst, Arabisch rechts-nach-links gesetzt und
// beim Zurückschalten auf Deutsch das Original wiederhergestellt wird. Ohne Translator API erscheint der Hinweis zur Seitenübersetzung.
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
  // 2) Ohne Translator API: Hinweis zur Seitenübersetzung
  const ctx2=await browser.newContext({locale:"fa",viewport:{width:1200,height:900}});
  await ctx2.addInitScript(()=>{try{localStorage.setItem("sdSprache","fa")}catch(e){}try{delete window.Translator;delete self.Translator}catch(e){}Object.defineProperty(window,"Translator",{value:undefined,configurable:true});});
  const p2=await ctx2.newPage();await kursOeffnen(p2,base);
  await p2.locator("#akUeHinweis").waitFor({timeout:15000});
  assert.match(await p2.locator("#akUeHinweis").textContent(),/Edge|Chrome/);
  assert.equal(await p2.locator(".code-step p").first().getAttribute("data-ak-ue"),null);
  await ctx2.close();
  console.log("Akademie-Übersetzung: OK");
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
