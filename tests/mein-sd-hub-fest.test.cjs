"use strict";
// Feste Übersetzungen der Akademie: jede Übersetzung gehört zu einem echten Lektionstext,
// `Code`-Stellen bleiben exakt erhalten und die Liste in akademie-uebersetzen.js passt zu den Dateien.
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const hub=path.join(__dirname,"..","mein-sd-hub");
global.window=globalThis;
const quelle=fs.readFileSync(path.join(hub,"akademie-uebersetzen.js"),"utf8");
const FEST=Function("return "+quelle.match(/const FEST = (\{[^;]*\});/)[1])();
function texte(kurs){
 require(path.join(hub,"kurse",kurs+".js"));const L=window.SDAkademieKurse[kurs],out=new Set(),add=s=>{if(typeof s==="string"&&s.trim())out.add(s.trim())};
 for(const l of L){add(l.title);add(l.ziel);add(l.explanation);
  (l.schritte||[]).forEach(s=>{add(s.titel);add(s.text);add(s.erklaerung);const e=String(s.erklaerung||"").trim(),v=String(s.text||"").trim();if(e&&v.endsWith(e))add(v.slice(0,-e.length))});(l.fehler||[]).forEach(f=>{add(f.titel);add(f.text)});
  if(l.aufgabe){add(l.aufgabe.text);add(l.aufgabe.tipp);(l.aufgabe.muster||[]).forEach(m=>add(m.beschreibung));(l.aufgabe.pruefungen||[]).forEach(m=>add(m.beschreibung))}
  (l.quiz||[]).forEach(q=>{add(q.frage);(q.antworten||[]).forEach(add);add(q.erklaerung);(q.begruendungen||[]).forEach(add)});
  add(l.tip);(l.schrittePraxis||[]).forEach(s=>{add(s.titel);add(s.text)});(l.uebungen||[]).forEach(u=>{add(u.titel);add(u.aufgabe);add(u.tipp);add(u.erklaerung);(u.typ==="auswahl"?u.antworten:[]).forEach(add);(u.typ==="reihenfolge"?u.start:[]).forEach(add);(u.paare||[]).forEach(p=>add(p[0]));(u.luecken||[]).forEach(add);(u.checkliste||[]).forEach(add)});add(l.standHinweis);if(l.standQuelle)add(l.standQuelle.titel);
 (l.merke||[]).forEach(add);(l.quellen||[]).forEach(q=>{add(q.titel);add(q.info)})}
 for(const l of L)(l.schritte||[]).forEach(s=>(s.tiefer||[]).forEach(add)); // „Genauer erklärt“ (später ergänzt, deshalb am Ende)
 return out;
}
const code=s=>(s.match(/`[^`]*`/g)||[]).sort().join("|");
test("Liste der festen Übersetzungen passt zu den Dateien",()=>{
 for(const [l,kurse] of Object.entries(FEST))for(const k of kurse)assert.ok(fs.existsSync(path.join(hub,"kurse-uebersetzt",l,k+".js")),l+"/"+k+" fehlt");
 const dir=path.join(hub,"kurse-uebersetzt");
 for(const l of fs.readdirSync(dir))for(const f of fs.readdirSync(path.join(dir,l)))assert.ok((FEST[l]||[]).includes(f.replace(/\.js$/,"")),l+"/"+f+" nicht in FEST eingetragen");
});
for(const [l,kurse] of Object.entries(FEST))for(const k of kurse)test("Feste Übersetzung "+l+"/"+k,()=>{
 require(path.join(hub,"kurse-uebersetzt",l,k+".js"));const d=window.SDAkademieFest[l][k],alle=texte(k);
 const eintraege=Object.entries(d);assert.ok(eintraege.length>100,"zu wenige Einträge");
 const satz=/([A-Za-zÄÖÜäöüß]{2,} +){2,}[A-Za-zÄÖÜäöüß]{2,}/; // mindestens drei Wörter: echter Text, kein Code wie „display: flex“
 let fehlend=[];for(const de of alle)if(satz.test(de.replace(/`[^`]*`/g,""))&&!(de in d))fehlend.push(de);
 // Deutschkurse: deutsche Beispielsätze, Antworten und Lückensätze bleiben absichtlich deutsch (die Übersetzung steht nur als Hilfe darunter)
 const deutschKurs=/^(german|deutsch-)/.test(k);
 assert.ok(fehlend.length<=alle.size*(deutschKurs?0.2:0.02),fehlend.length+" Texte ohne Übersetzung: "+fehlend.slice(0,5).join(" | "));
 for(const [de,tr] of eintraege){assert.ok(alle.has(de),"veralteter Eintrag: "+de);assert.equal(code(tr),code(de),"Code-Stelle verändert: "+de);
  assert.ok(tr.trim().length>0)}
});
test("Feste Übersetzung der Hub-Seiten: jeder Eintrag kommt auf der Seite vor",()=>{
 const roh=["index.html","app.js","data.js"].map(f=>fs.readFileSync(path.join(hub,f),"utf8")).join("\n");
 const quellen=roh.replace(/<[^>]+>/g,"").replace(/\s+/g,"")+roh.replace(/\s+/g,""); // Text ohne Tags und Attribute wie placeholder
 for(const l of fs.readdirSync(path.join(hub,"seite-uebersetzt"))){
  require(path.join(hub,"seite-uebersetzt",l));const d=window.SDHubSeite[l.replace(/\.js$/,"")];
  for(const k of [...Object.keys(d.texte),...Object.keys(d.bloecke),...Object.keys(d.platzhalter)])assert.ok(quellen.includes(k.replace(/\s+/g,"")),l+": veralteter Eintrag „"+k+"“");
 }
});
