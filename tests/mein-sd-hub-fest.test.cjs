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
  (l.schritte||[]).forEach(s=>{add(s.titel);add(s.text);add(s.erklaerung)});(l.fehler||[]).forEach(f=>{add(f.titel);add(f.text)});
  if(l.aufgabe){add(l.aufgabe.text);add(l.aufgabe.tipp);(l.aufgabe.muster||[]).forEach(m=>add(m.beschreibung))}
  (l.quiz||[]).forEach(q=>{add(q.frage);(q.antworten||[]).forEach(add);add(q.erklaerung);(q.begruendungen||[]).forEach(add)});
  (l.merke||[]).forEach(add);(l.quellen||[]).forEach(q=>{add(q.titel);add(q.info)})}
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
 let fehlend=0;for(const de of alle)if(/[A-Za-zÄÖÜäöüß]{3}/.test(de.replace(/`[^`]*`/g,""))&&!(de in d))fehlend++;
 assert.ok(fehlend<=alle.size*0.05,fehlend+" Texte ohne Übersetzung");
 for(const [de,tr] of eintraege){assert.ok(alle.has(de),"veralteter Eintrag: "+de);assert.equal(code(tr),code(de),"Code-Stelle verändert: "+de);
  assert.ok(tr.trim().length>0)}
});
