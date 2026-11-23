"use strict";
// Akademie-Eingang und Lernplatz: Lernausweis, Serie, Tagesziel, Wiederholen mit Abständen, Stufen und Hilfe in drei Stufen.
const assert=require("node:assert/strict"),http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html;charset=utf-8",".js":"application/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{const url=new URL(req.url,"http://localhost");let rel=decodeURIComponent(url.pathname).replace(/^\/+/,"");if(!rel||rel.endsWith("/"))rel+="index.html";
 const p=path.resolve(root,rel);if(!p.startsWith(root)){res.writeHead(403);return res.end()}
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{"Content-Type":mime[path.extname(p)]||"application/octet-stream"});res.end(b)})});
async function zuSeite(page,name){for(let i=0;i<40;i++){if(await page.evaluate(n=>document.querySelector('.ak-step-balken button[aria-current="step"]')?.dataset.akTitle===n,name))return;await page.locator(".ak-step-nav .ak-weiter").click()}throw new Error("Seite nicht erreicht: "+name)}
(async()=>{
 await new Promise(r=>server.listen(0,"127.0.0.1",r));const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const ctx=await browser.newContext({locale:"de-DE",viewport:{width:1250,height:900}});
  await ctx.addInitScript(()=>{if(window.top!==window)return;if(sessionStorage.getItem("seed"))return;sessionStorage.setItem("seed","1");
   const t=Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/86400000),tt={};tt[t-1]=100;tt[t-2]=100;
   localStorage.setItem("sdhub.personal.v1",JSON.stringify({version:1,completedLessons:["ps-1","p-1"],completedSteps:[],favorites:[],recent:[],nickname:"Testperson",updatedAt:""}));
   localStorage.setItem("sdhub.akademie.lernen.v1",JSON.stringify({v:1,k:{"ps-1:0":{k:"python-start",b:0,d:t},"ps-1:1":{k:"python-start",b:0,d:t},"ps-1:2":{k:"python-start",b:0,d:t+2}},p:{},l:{"ps-1":{h:0,g:1}},t:tt,z:{kurs:"python-start",lektion:"ps-2"}}))});
  const page=await ctx.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base+"/mein-sd-hub/#akademie",{waitUntil:"load"});
  await page.locator(".ak-tor h2").waitFor();
  assert.equal(await page.locator(".ak-tor h2").innerText(),"Willkommen in der SD Akademie");
  assert.equal(await page.locator(".ak-tor .ak-wappen").count(),1);
  // Lernplatz: Name, Rang, Serie (gestern und vorgestern gelernt), Tagesziel, fällige Fragen inkl. nachgetragener Lektion p-1
  const lp=page.locator("#akLernplatz");
  assert.match(await lp.locator(".ak-lp-ausweis").innerText(),/Testperson[\s\S]*Rang: Neuling[\s\S]*200 XP/);
  assert.equal(await lp.locator(".ak-lp-serie .ak-lp-gross").innerText(),"2");
  assert.match(await lp.locator(".ak-lp-ziel").innerText(),/0 von 50 XP/);
  await page.waitForFunction(()=>Number(document.querySelector(".ak-lp-wdh .ak-lp-gross")?.textContent)>2);
  const p1=await page.evaluate(()=>window.SDAkademieKurse.code.find(l=>l.id==="p-1").quiz.length);
  assert.equal(Number(await lp.locator(".ak-lp-wdh .ak-lp-gross").innerText()),2+p1,"fällig = 2 alte Karten + Fragen von p-1");
  assert.match(await lp.locator(".ak-lp-weiter").innerText(),/Python für Einsteiger[\s\S]*1 von 8 Lektionen/);
  // Wiederholen: alle richtig beantworten → XP, Tagesziel, Serie heute
  await page.locator("#akWdhStart").click();await page.locator(".ak-wdh .answers button").first().waitFor();
  assert.match(await page.locator(".ak-wdh-zahl").innerText(),/^Frage 1 von 5$/);
  for(let i=0;i<5;i++){
   const frage=await page.locator(".ak-wdh-feld h4").innerText();
   const richtig=await page.evaluate(f=>{for(const ls of Object.values(window.SDAkademieKurse))for(const l of ls)for(const q of l.quiz||[]){const t=String(q.frage).replace(/`/g,"");if(t===f)return String(q.antworten[q.richtig]).replace(/`/g,"")}return null},frage);
   assert.ok(richtig,"Frage gefunden: "+frage);
   await page.locator(".ak-wdh .answers button").filter({hasText:richtig}).first().click();
   assert.match(await page.locator(".ak-wdh .feedback").innerText(),/^✓ Richtig\./);
   await page.locator(".ak-wdh-feld>button").click();
  }
  assert.match(await page.locator(".ak-wdh-ende").innerText(),/5 von 5 richtig · \+50 XP/);
  await page.locator(".ak-wdh-ende button").click();assert.equal(await page.locator(".ak-wdh").count(),0);
  assert.match(await lp.locator(".ak-lp-ziel").innerText(),/Tagesziel erreicht!/);
  assert.equal(await lp.locator(".ak-lp-serie .ak-lp-gross").innerText(),"3");
  assert.match(await lp.locator(".ak-lp-wdh").innerText(),/Heute ist nichts fällig\.[\s\S]*Nächste Wiederholung/);
  const box=await page.evaluate(()=>JSON.parse(localStorage.getItem("sdhub.akademie.lernen.v1")).k["ps-1:0"].b);assert.equal(box,1,"Karte eine Box weiter");
  // Hilfe in drei Stufen in einer Web-Lektion (p-2)
  await page.locator(".course").filter({has:page.locator("b",{hasText:/^Programmieren anfangen$/})}).click();
  await page.locator(".lesson-btn").nth(1).click();
  assert.match(await page.locator(".lesson-btn").first().innerText(),/✓ Geschafft/);
  await zuSeite(page,"Jetzt selbst schreiben");
  const hilfe=page.locator(".ak-seite:not([hidden]) .ak-hilfe");
  await hilfe.click();assert.match(await page.locator(".ak-seite:not([hidden]) .ak-denk").innerText(),/^Denkanstoß: (Achte noch auf: .+|Alle Prüfungen)/);
  assert.equal(await page.locator(".ak-seite:not([hidden]) .hint").filter({hasText:/^Tipp:/}).isVisible(),false);
  await hilfe.click();assert.equal(await page.locator(".ak-seite:not([hidden]) .hint").filter({hasText:/^Tipp:/}).isVisible(),true);
  await hilfe.click();await page.locator(".ak-seite:not([hidden]) button",{hasText:"Lösung zeigen"}).click();
  assert.match(await page.locator(".ak-seite:not([hidden])").innerText(),/nur 50 XP/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("sdhub.akademie.lernen.v1")).l["p-2"].h),3);
  assert.deepEqual(errors,[]);
  console.log("Akademie-Lernplatz: OK");
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
