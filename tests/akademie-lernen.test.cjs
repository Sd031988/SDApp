"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),path=require("path");
const mem={};global.localStorage={getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=String(v)}};
global.window=globalThis;require(path.join(__dirname,"..","mein-sd-hub","akademie-lernen.js"));
const L=window.SDAkLernen,T=L._test,heute=T.tag();
const lek={id:"ps-1",quiz:[{frage:"a",antworten:["x","y"],richtig:0},{frage:"b",antworten:["x","y"],richtig:1}]};
test("Lektion geschafft: Fragen kommen morgen, XP nur beim ersten Mal",()=>{T.setzen({});
 assert.deepEqual(L.geschafft("python-start",lek),{neu:true,xp:100});
 assert.equal(L.anzahlFaellig(),0);assert.equal(L.naechste(),heute+1);assert.equal(L.heuteXp(),100);
 assert.deepEqual(L.geschafft("python-start",lek),{neu:false,xp:0});assert.equal(L.stufe("ps-1",true),1);assert.equal(L.stufe("ps-1",false),0)});
test("Abstände wachsen 1 → 3 → 7 → 21 Tage, falsch setzt zurück; Stufen sicher und gemeistert",()=>{
 const r=T.roh();for(const c of Object.values(r.k))c.d=heute;
 assert.equal(L.antwort("ps-1:0",true),10);assert.equal(r.k["ps-1:0"].d,heute+3);
 r.k["ps-1:0"].d=heute;L.antwort("ps-1:0",true);assert.equal(r.k["ps-1:0"].d,heute+7);
 L.antwort("ps-1:1",true);r.k["ps-1:1"].d=heute;L.antwort("ps-1:1",true);assert.equal(L.stufe("ps-1",true),2);
 r.k["ps-1:0"].d=heute;L.antwort("ps-1:0",true);assert.equal(r.k["ps-1:0"].d,heute+21);
 r.k["ps-1:1"].d=heute;L.antwort("ps-1:1",true);assert.equal(L.stufe("ps-1",true),3);
 r.k["ps-1:1"].d=heute;assert.equal(L.antwort("ps-1:1",false),0);assert.equal(r.k["ps-1:1"].b,0);assert.equal(r.k["ps-1:1"].d,heute+1);assert.equal(L.stufe("ps-1",true),1)});
test("Auswahl mischt höchstens fünf fällige Fragen",()=>{const k={};for(let i=0;i<9;i++)k["l"+i+":0"]={k:"code",b:0,d:heute};T.setzen({k});const w=L.auswahl(5);assert.equal(w.length,5);assert.equal(new Set(w.map(x=>x.lektion)).size,5)});
test("Lernserie: heute zählt noch nicht als verpasst, ein Schutztag pro Woche",()=>{
 const t={};t[heute-1]=10;t[heute-2]=10;T.setzen({t});assert.deepEqual(L.serie(),{tage:2,heute:false,schutz:false});
 t[heute]=10;delete t[heute-1];t[heute-3]=10;T.setzen({t});const s=L.serie();assert.equal(s.tage,3);assert.equal(s.schutz,true);
 const u={};u[heute]=10;u[heute-3]=10;T.setzen({t:u});assert.equal(L.serie().tage,1)});
test("Lösung angesehen: nur halbe XP; alte Lektionen werden nachgetragen; kaputte Daten werden verworfen",()=>{
 T.setzen({});L.hilfe("ps-2",3);assert.equal(L.geschafft("python-start",{id:"ps-2",quiz:[]}).xp,50);
 T.setzen({});L.abgleichen(["ps-1"],()=>"python-start");assert.equal(L.wartet("python-start"),true);
 L.ausklappen("python-start",[lek]);assert.equal(L.anzahlFaellig(),2);assert.equal(L.wartet("python-start"),false);
 T.setzen({k:{"<x>:1":{k:"a",b:1,d:1},"ok:1":{k:"python-start",b:99,d:1}},t:{"abc":5},z:{kurs:"<b>",lektion:"x"}});assert.deepEqual(T.roh().k,{});assert.equal(T.roh().z,null)});
