"use strict";
// Cybersecurity SEC 101: Rechtshinweis, Übungs-Terminal mit allen Aufgaben lösbar, Sperre bis gelöst, Fehlermeldungen.
const assert=require("node:assert/strict"),http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html;charset=utf-8",".js":"application/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".json":"application/json",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{const url=new URL(req.url,"http://localhost");let rel=decodeURIComponent(url.pathname).replace(/^\/+/,"");if(!rel||rel.endsWith("/"))rel+="index.html";
 const p=path.resolve(root,rel);if(!p.startsWith(root)){res.writeHead(403);return res.end()}
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{"Content-Type":mime[path.extname(p)]||"application/octet-stream"});res.end(b)})});
async function zuSeite(page,name){for(let i=0;i<40;i++){if(await page.evaluate(n=>document.querySelector('.ak-step-balken button[aria-current="step"]')?.dataset.akTitle===n,name))return;await page.locator(".ak-step-nav .ak-weiter").click()}throw new Error("Seite nicht erreicht: "+name)}
const LOESUNG={
 "sec1-1":["whoami","pwd","ls"],
 "sec1-2":["cd /var/log","cd","ls -la","cd lab"],
 "sec1-3":["tail -n 2 /var/log/auth.log","mkdir fall-01","cp /var/log/auth.log fall-01/auth-kopie.log","echo \"Kopie erstellt\" > fall-01/notizen.txt"],
 "sec1-4":["grep \"Failed password\" /var/log/auth.log","grep -in failed /var/log/auth.log","grep -i failed /var/log/auth.log | wc -l"],
 "sec1-5":["find /var/log -name \"*.log\"","find /var/log -name \"*.log\" | wc -l","find /tmp -type f"],
 "sec1-6":["ls -l","chmod 600 passwoerter.txt","chmod u+x backup.sh","chmod go-w bericht.txt"],
 "sec1-7":["id","cat /etc/shadow","sudo cat /etc/shadow","whoami"],
 "sec1-8":["grep -c \"Failed password\" /var/log/auth.log","grep -c \"from 203.0.113.7\" /var/log/auth.log","grep Accepted /var/log/auth.log | grep 203.0.113.7","echo \"203.0.113.7: 4 Fehlversuche, kein Erfolg\" > bericht.txt"]};
(async()=>{
 await new Promise(r=>server.listen(0,"127.0.0.1",r));const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const page=await browser.newPage({locale:"de-DE",viewport:{width:1250,height:900}});const errors=[];page.on("pageerror",e=>errors.push(e.message));page.on("dialog",d=>d.accept());
  await page.goto(base+"/mein-sd-hub/#kurs=cyber-linux",{waitUntil:"load"});
  await page.locator("#akKurskopf .ak-sec-hinweis").waitFor();
  assert.match(await page.locator("#akKurskopf .ak-sec-hinweis").innerText(),/Nur zur Verteidigung[\s\S]*202a[\s\S]*TryHackMe[\s\S]*PortSwigger[\s\S]*Juice Shop/);
  assert.equal(await page.locator(".lesson-btn").count(),8);
  for(let i=0;i<8;i++){
   const id="sec1-"+(i+1);
   await page.locator(".lesson-btn").nth(i).click();
   await page.locator(".ak-seite:not([hidden]) .ak-sec-hinweis").waitFor();
   await zuSeite(page,"Im Terminal üben");
   const seite=page.locator(".ak-seite:not([hidden])");
   assert.equal(await page.locator(".ak-step-nav .ak-weiter").isDisabled(),true,id+": gesperrt bis gelöst");
   const eingabe=seite.locator(".ak-term-zeile input");
   if(i===0){await eingabe.fill("hack");await eingabe.press("Enter");assert.match(await seite.locator(".ak-term-fehler").last().innerText(),/Befehl nicht gefunden/)}
   for(const cmd of LOESUNG[id]){await eingabe.fill(cmd);await eingabe.press("Enter")}
   const offen=await seite.locator(".ak-term-aufgaben li:not(.ok)").count();
   assert.equal(offen,0,id+": nicht alle Terminal-Aufgaben gelöst – "+(await seite.locator(".ak-term-fenster").innerText()).slice(-400));
   assert.equal(await page.locator(".ak-step-nav .ak-weiter").isDisabled(),false,id+": nach Lösung frei");
  }
  assert.deepEqual(errors,[]);
  console.log("Cybersecurity Terminal: OK");
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
