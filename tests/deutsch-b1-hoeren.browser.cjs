"use strict";
// B1-Prüfung Hören: Hörtexte werden über die Server-Stimme (Audio-Element, auch im iPhone-Lautlos-Modus) abgespielt, Dialoge mit zwei Stimmen, lange Texte in Stücken.
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
  const page=await browser.newPage({locale:"de-DE",viewport:{width:390,height:844}});const errors=[];page.on("pageerror",e=>errors.push(e.message));page.on("dialog",d=>d.accept());
  // Audio-Element nachbilden: merkt sich die angefragten Adressen und meldet „spielt“ und „fertig“
  await page.addInitScript(()=>{window.__srcs=[];window.Audio=class{setAttribute(){}removeAttribute(){}load(){}pause(){}set src(v){this._s=v;window.__srcs.push(v)}get src(){return this._s}get duration(){return 0.05}
   play(){setTimeout(()=>{this.onplaying&&this.onplaying();setTimeout(()=>this.onended&&this.onended(),20)},10);return Promise.resolve()}}});
  await page.goto(base+"/deutsch/");await page.locator('input[placeholder="Name"]').fill("Test");await page.getByRole("button",{name:/Profil anlegen/}).click();
  // B1-Prüfung direkt von der ersten Niveauwahl aus erreichbar
  await page.locator("#lB1PruefCard").click();await page.locator("#lB1Muster").click();await page.locator("#b1x").waitFor();
  await page.locator("#b1x button",{hasText:/^Hören/}).first().click();
  await page.locator("#b1x-audio").click();
  await page.waitForFunction(()=>window.__srcs.some(s=>s.includes("/hub/tts?text=")));
  const erste=await page.evaluate(()=>window.__srcs.filter(s=>s.includes("/hub/tts")));
  assert.ok(erste.length>=1,"Hörtext wird über die Server-Stimme angefragt");
  assert.ok(erste.every(s=>decodeURIComponent(s.split("text=")[1].split("&")[0]).length<=360),"Hörtext in Stücke geteilt");
  // Dialog: zwei verschiedene Stimmen
  const ton=await page.evaluate(async()=>{window.__srcs=[];await window.SDB1Ton.dialog([["A","Guten Tag, ich habe eine Frage."],["B","Ja, gern. Worum geht es?"],["A","Um meinen Termin."]]);return window.__srcs.map(s=>new URL(s).searchParams.get("voice"))});
  assert.equal(ton.length,3);assert.notEqual(ton[0],ton[1]);assert.equal(ton[0],ton[2]);
  // Lange Texte werden geteilt
  const teile=await page.evaluate(()=>window.SDB1Ton._stuecke("Das ist ein Satz. ".repeat(60)));
  assert.ok(teile.length>=3&&teile.every(t=>t.length<=360));
  assert.deepEqual(errors,[]);
  console.log("B1 Hören: OK");
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
