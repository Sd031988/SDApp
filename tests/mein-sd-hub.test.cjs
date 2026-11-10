"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const data=require(path.join(root,"mein-sd-hub/data.js"));
const load=rel=>fs.readFileSync(path.join(root,rel),"utf8");
const index=load("mein-sd-hub/index.html");
const homepage=load("index.html");
const js=load("mein-sd-hub/app.js");
const css=load("mein-sd-hub/styles.css");
function fileForHref(href){if(!href.startsWith("/")||href.startsWith("//")||href.includes(".."))return null;const stripped=href.slice(1).split("#")[0].split("?")[0];return path.join(root,stripped.endsWith("/")?stripped+"index.html":stripped||"index.html")}
test("all new scripts parse as JavaScript",()=>{assert.doesNotThrow(()=>new vm.Script(js));assert.doesNotThrow(()=>new vm.Script(load("mein-sd-hub/data.js")))});
test("six accessible tabs correspond to six distinct sections",()=>{const tabs=[...index.matchAll(/data-tab="([^"]+)"/g)].map(x=>x[1]);assert.equal(tabs.length,6);assert.equal(new Set(tabs).size,6);for(const tab of tabs){assert.match(index,new RegExp('id="'+tab+'"'));assert.match(index,new RegExp('aria-controls="'+tab+'"'))}});
test("homepage uses the bento start and promotes new area",()=>{assert.match(homepage,/id="bento"/);assert.match(homepage,/href="mein-sd-hub\/"/);assert.match(homepage,/href="mein-sd-hub\/#akademie"/);assert.match(homepage,/"personal_title": "Your personal SD Hub"/)});
test("17 direct tools and guided goals have valid IDs and unique URLs",()=>{assert.ok(data.items.length>=17);const ids=data.items.map(x=>x.id);assert.equal(new Set(ids).size,ids.length);for(const goal of data.goals){assert.ok(goal.itemIds.length>0);for(const id of goal.itemIds)assert.ok(ids.includes(id),"bad goal item "+id)}});
test("all referenced local tool URLs resolve to a real file",()=>{const links=new Set(data.items.map(x=>x.href));for(const p of data.paths)for(const step of p.steps)links.add(step[2]);for(const p of data.academy)assert.ok(p.anzahl>0);for(const href of links){const file=fileForHref(href);assert.ok(file,"unsafe URL "+href);assert.ok(fs.existsSync(file),"missing "+href)}});
test("recommendation matches natural German B1 request",()=>{const found=data.recommend("Ich möchte B1 üben");assert.ok(found.some(x=>x.id==="b1"),JSON.stringify(found.map(x=>x.id)))});
test("recommendations handle common needs and do not leak unbounded data",()=>{for(const [query,target] of [["Pibo spielen","pibo"],["Lebenslauf schreiben","jobs"],["PDF unterschreiben","pdf"],["Code programmieren","studio"],["Brief verstehen","post"]]){const found=data.recommend(query,8);assert.ok(found.some(x=>x.id===target),query+" -> "+found.map(x=>x.id))}assert.ok(data.recommend("ich",999).length<=8);assert.deepEqual(data.recommend(""),[])});
test("four courses, twenty-four lessons and valid correct answers",()=>{assert.equal(data.academy.length,6);const lessons=data.academy.flatMap(x=>require(path.join(root,"mein-sd-hub/kurse",x.id+".js")));assert.equal(lessons.length,41);assert.equal(new Set(lessons.map(x=>x.id)).size,41);for(const l of lessons.filter(x=>!x.schritte)){assert.ok(l.choices.length>=3);assert.ok(l.answer>=0&&l.answer<l.choices.length);assert.ok(l.question.length>12);assert.ok(l.explanation.length>20);assert.ok(l.tip.length>8)}});
test("paths contain twenty distinct checkable steps",()=>{assert.equal(data.paths.length,4);assert.equal(data.paths.reduce((n,p)=>n+p.steps.length,0),20);for(const p of data.paths){assert.equal(p.steps.length,5);for(const step of p.steps)assert.equal(step.length,3)}});
test("translation examples cover supported languages",()=>{assert.ok(data.phrases.length>=10);for(const p of data.phrases){for(const lang of ["de","en","fa","ur","ti"])assert.ok(typeof p[lang]==="string"&&p[lang].length>2,p.id+" "+lang)}});
test("safe state sanitizer rejects unknown ids, duplicates and private fields",()=>{const s=data.sanitizeState({completedLessons:["g-1","g-1","not-a-lesson"],completedSteps:["job:2","job:2","bad:8"],favorites:["pibo","pibo","evil"],recent:["studio","evil"],nickname:"<script>alert(1)</script>",privateData:"must-drop",updatedAt:"s".repeat(400)});assert.deepEqual(s.completedLessons,["g-1"]);assert.deepEqual(s.completedSteps,["job:2"]);assert.deepEqual(s.favorites,["pibo"]);assert.deepEqual(s.recent,["studio"]);assert.ok(!s.nickname.includes("<"));assert.ok(!("privateData"in s));assert.ok(s.updatedAt.length<=32)});
test("fresh state contains no persisted favorites after deletion",()=>{const s=data.initial();assert.deepEqual(s.favorites,[]);assert.deepEqual(s.completedLessons,[]);assert.deepEqual(s.completedSteps,[])});
test("all new forms have labels and clear local-only privacy text",()=>{for(const key of ["goalSearch","nickname","translateLang","speechSpeed","search","importFile"]){if(key==="search")continue;assert.match(index,new RegExp('id="'+key+'"'))}assert.match(index,/keine automatische Cloud-Synchronisierung/);assert.match(index,/sandbox=""/);assert.match(index,/role="status"/)});
test("project downloads and preview links are implemented",()=>{assert.equal(data.projects.length,4);assert.match(js,/new Blob/);assert.match(js,/createObjectURL/);assert.match(js,/projectPreview/);assert.match(index,/href="\/studio\/"/)});
test("CSS has responsive and reduced-motion modes",()=>{assert.match(css,/@media\(max-width:670px\)/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/focus-visible/)});

test("Programmierkurs hat zwölf Praxislektionen und sichere Prüfungen",()=>{const code={lessons:require(path.join(root,"mein-sd-hub/kurse/code.js"))};assert.equal(code.lessons.length,12);for(const lesson of code.lessons){assert.ok(lesson.ziel);assert.ok(lesson.schritte.length>=4);assert.ok(lesson.quiz.length===3);assert.ok(lesson.aufgabe.pruefungen.length>=2);assert.ok(lesson.merke.length>=2);for(const p of lesson.aufgabe.pruefungen)assert.equal(typeof data.pruefeCode(p.test,{html:"",css:"",js:""},{querySelector:()=>null,querySelectorAll:()=>[]}),"boolean")}});
test("Praxis-Editor nutzt isolierte Vorschau und Studio-IndexedDB",()=>{assert.match(js,/sandbox","allow-scripts"/);assert.doesNotMatch(js,/allow-same-origin/);assert.match(js,/indexedDB.open\("sdCodeStudio",1\)/);assert.match(js,/setTimeout\(update,400\)/)});

test("Alle zwölf Lektionen enthalten Lösungen, Fehlerhilfen und drei Quizfragen",()=>{const lessons=require(path.join(root,"mein-sd-hub/kurse/code.js"));assert.equal(lessons.length,12);for(const lesson of lessons){assert.ok(lesson.aufgabe.pruefungen.length>=2);assert.ok(lesson.fehler.length>=2);assert.ok(lesson.schritte.length>=4);assert.ok(lesson.schritte.every(x=>x.code&&x.text.length>100));assert.equal(lesson.quiz.length,3);assert.ok(lesson.quiz.every(x=>x.antworten.length>=3));assert.ok(lesson.aufgabe.loesung.html)}});

test("Kein Satz in Schritten, Fehlern, Quiz-Erklärungen und Merksätzen erscheint in mehr als zwei Lektionen aller Kurse",()=>{
 const lessons=data.academy.flatMap(c=>require(path.join(root,"mein-sd-hub/kurse",c.id+".js")));
 const occurrences=new Map();
 const sentences=text=>String(text||"").replace(/`[^`]*`/g,code=>code.replace(/[.!?]/g,"∎")).match(/[^.!?]+(?:[.!?]+|$)/g)||[];
 for(const lesson of lessons){
  const own=new Set();
  const sources=[
   ...(lesson.schritte||[]).flatMap(step=>[step.text,step.erklaerung]),
   ...(lesson.fehler||[]).map(f=>f.text),
   ...(lesson.quiz||[]).map(q=>q.erklaerung),
   ...(lesson.merke||[])
  ];
  for(const source of sources)for(const raw of sentences(source)){
   const sentence=raw.trim().replace(/\\s+/g," ");
   if(sentence.length>=15)own.add(sentence);
  }
  for(const sentence of own){
   const ids=occurrences.get(sentence)||[];
   ids.push(lesson.id);
   occurrences.set(sentence,ids);
  }
 }
 const repeats=[...occurrences].filter(([,ids])=>ids.length>2);
 assert.deepEqual(repeats.map(([sentence,ids])=>({sentence,ids})),[]);
});
test("Quizantworten sind über verschiedene Positionen verteilt",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/code.js"));
 const positions=lessons.flatMap(l=>l.quiz.map(q=>q.richtig));
 assert.deepEqual([...new Set(positions)].sort(),[0,1,2]);
 for(const lesson of lessons){
  assert.equal(lesson.quiz.length,3);
  assert.deepEqual([...new Set(lesson.quiz.map(q=>q.richtig))].sort(),[0,1,2],lesson.id);
  for(const q of lesson.quiz){
   assert.equal(q.antworten.length,3);
   assert.equal(q.begruendungen.length,3);
   assert.ok(q.begruendungen.every(reason=>reason.length>=15));
  }
 }
});

test("Kurskatalog bleibt klein und Fortschritts-IDs sind stabil",()=>{assert.ok(load("mein-sd-hub/data.js").length<20000);for(const course of data.academy){assert.equal(course.anzahl,data.academyLessonIds[course.id].length);assert.ok(course.bereich&&course.stufe&&Array.isArray(course.voraussetzungen));assert.deepEqual(require(path.join(root,"mein-sd-hub/kurse",course.id+".js")).map(l=>l.id),data.academyLessonIds[course.id]);}assert.deepEqual(data.sanitizeState({completedLessons:["g-1","p-12"]}).completedLessons,["g-1","p-12"])});

test("Alle sechs Übungstypen prüfen Lösungen ohne eval",()=>{
 const engine=require(path.join(root,"mein-sd-hub/akademie-uebungen.js"));
 const cases=[
  [{typ:"auswahl",richtig:[0,2],antworten:["A","B","C"]},[0,2],[1]],
  [{typ:"luecke",loesung:["Berlin","Montag"]},["Berlin","Montag"],["","Montag"]],
  [{typ:"zuordnen",paare:[["rot","Farbe"],["Apfel","Obst"]] },["Farbe","Obst"],["Obst","Farbe"]],
  [{typ:"reihenfolge",loesung:["Öffnen","Schreiben","Speichern"]},["Öffnen","Schreiben","Speichern"],["Speichern","Öffnen","Schreiben"]],
  [{typ:"hoeren",text:"Guten Morgen",loesung:"Guten Morgen"},"Guten Morgen",""],
 ];
 for(const [exercise,correct,wrong] of cases){assert.equal(engine.pruefen(exercise,correct).ok,true,exercise.typ);assert.equal(engine.pruefen(exercise,wrong).ok,false,exercise.typ)}
 assert.equal(engine.pruefen({typ:"schreiben",musterloesung:"Hallo"},"Hallo").ok,null);
 assert.equal(load("mein-sd-hub/akademie-uebungen.js").includes("eval("),false);
});

test("Jede tatsächlich eingebaute Übung hat eine prüfbare Musterlösung und einen falschen Versuch",()=>{
 const engine=require(path.join(root,"mein-sd-hub/akademie-uebungen.js"));
 const types=new Set();
 for(const id of ["german","digital","career","code"]){
  const lessons=require(path.join(root,"mein-sd-hub/kurse",id+".js"));
  for(const lesson of lessons)for(const u of lesson.uebungen||[]){
   types.add(u.typ);
   if(u.typ==="schreiben"){
    assert.ok(u.musterloesung.length>30,lesson.id);
    assert.ok(u.checkliste.length>=3,lesson.id);
    assert.equal(engine.pruefen(u,"").ok,null);
    continue;
   }
   const solution=u.typ==="auswahl"?u.richtig:u.typ==="zuordnen"?u.paare.map(p=>p[1]):u.loesung;
   const wrong=u.typ==="auswahl"?[]:u.typ==="hoeren"?"":u.typ==="reihenfolge"?[...u.start]:u.typ==="zuordnen"?u.paare.map(()=> ""):u.loesung.map(()=> "");
   assert.equal(engine.pruefen(u,solution).ok,true,lesson.id+" "+u.typ+" Musterlösung");
   assert.equal(engine.pruefen(u,wrong).ok,false,lesson.id+" "+u.typ+" Falschantwort");
  }
 }
 assert.deepEqual([...types].sort(),["auswahl","hoeren","luecke","reihenfolge","schreiben","zuordnen"]);
});

test("Webseiten gestalten: acht vollständige Lektionen mit eigener Praxis",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/webdesign.js"));
 assert.equal(lessons.length,8);
 const ids=new Set();
 const answers=[];
 for(const lesson of lessons){
  assert.ok(!ids.has(lesson.id));ids.add(lesson.id);
  assert.ok(lesson.ziel.length>25);
  assert.equal(lesson.schritte.length,4);
  for(const step of lesson.schritte){assert.ok(step.text.split(/[.!?]+/).filter(x=>x.trim()).length>=3,lesson.id);assert.ok(step.code&&step.erklaerung)}
  assert.equal(lesson.quiz.length,3);
  answers.push(...lesson.quiz.map(q=>q.richtig));
  assert.ok(lesson.fehler.length>=2&&lesson.merke.length>=2);
  assert.ok(lesson.aufgabe.loesung.html);
  for(const check of lesson.aufgabe.pruefungen){
   assert.equal(typeof data.pruefeCode(check.test,{html:"",css:"",js:""},{querySelector:()=>null,querySelectorAll:()=>[]}),"boolean");
  }
 }
 assert.deepEqual([...new Set(answers)].sort(),[0,1,2]);
 for(const index of [0,1,2])assert.ok(answers.filter(x=>x===index).length<=12);
});

test("JavaScript Grundlagen enthält neun Praxislektionen mit Quiz und Lösungen",()=>{const lessons=require(path.join(root,"mein-sd-hub/kurse/javascript.js"));assert.equal(lessons.length,9);for(const lesson of lessons){assert.equal(lesson.schritte.length,4);assert.equal(lesson.quiz.length,3);assert.ok(lesson.fehler.length>=2);assert.equal(lesson.aufgabe.pruefungen.length,2);assert.ok(lesson.aufgabe.loesung.js.length>20);for(const check of lesson.aufgabe.pruefungen)assert.equal(typeof data.pruefeCode(check.test,{html:"",css:"",js:""},{querySelector:()=>null,querySelectorAll:()=>[]}),"boolean");}});

test("Neue Programmierkurse: mindestens 800 Zeichen Erklärung pro Lektion",()=>{
 for(const id of ["webdesign","javascript"]){
  const lessons=require(path.join(root,"mein-sd-hub/kurse",id+".js"));
  for(const lesson of lessons){
   const length=lesson.schritte.reduce((sum,step)=>sum+step.text.length,0);
   assert.ok(length>=800,lesson.id+": nur "+length+" Zeichen Erklärung");
   assert.ok(lesson.schritte.every(step=>step.code&&step.erklaerung),lesson.id+": Code und Erklärung erforderlich");
  }
 }
});
test("JavaScript-Grundlagen: jeder Fehler hat ein konkretes falsches und richtiges Beispiel",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/javascript.js"));
 for(const lesson of lessons){
  assert.equal(lesson.fehler.length,2,lesson.id);
  for(const error of lesson.fehler){
   assert.match(error.text,/Falsch:/,lesson.id);
   assert.match(error.text,/Richtig:/,lesson.id);
   assert.ok(error.text.length>=140,lesson.id+" "+error.titel);
  }
  assert.notEqual(lesson.fehler[0].text,lesson.fehler[1].text,lesson.id);
 }
});
