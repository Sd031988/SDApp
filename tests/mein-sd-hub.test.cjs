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
test("four courses, twenty-four lessons and valid correct answers",()=>{assert.equal(data.academy.length,13);const lessons=data.academy.flatMap(x=>require(path.join(root,"mein-sd-hub/kurse",x.id+".js")));assert.equal(lessons.length,101);assert.equal(new Set(lessons.map(x=>x.id)).size,101);for(const l of lessons.filter(x=>!x.schritte)){assert.ok(l.quiz?.length===3||(l.choices?.length>=3&&l.answer>=0&&l.answer<l.choices.length&&l.question.length>12));assert.ok(l.explanation.length>20);assert.ok(l.tip.length>8)}});
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

test("Kurskatalog bleibt klein und Fortschritts-IDs sind stabil",()=>{assert.ok(load("mein-sd-hub/data.js").length<26000);for(const course of data.academy){assert.equal(course.anzahl,data.academyLessonIds[course.id].length);assert.ok(course.bereich&&course.stufe&&Array.isArray(course.voraussetzungen));assert.deepEqual(require(path.join(root,"mein-sd-hub/kurse",course.id+".js")).map(l=>l.id),data.academyLessonIds[course.id]);}assert.deepEqual(data.sanitizeState({completedLessons:["g-1","p-12"]}).completedLessons,["g-1","p-12"])});

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
 for(const id of ["webdesign","javascript","javascript-aufbau","saubere-webapps"]){
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

test("JavaScript Aufbau P4: acht Lektionen, Lösungen, Fehlbeispiele und verteilte Quizantworten",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/javascript-aufbau.js"));
 assert.equal(lessons.length,8);
 for(const lesson of lessons){
  assert.equal(lesson.schritte.length,4,lesson.id);
  assert.equal(lesson.quiz.length,3,lesson.id);
  assert.equal(lesson.quiz.length,3,lesson.id);
  assert.ok(lesson.fehler.length>=2,lesson.id);
  assert.ok(lesson.merke.length>=2,lesson.id);
  for(const error of lesson.fehler){
   assert.match(error.text,/Falsch:/,lesson.id);
   assert.match(error.text,/Richtig:/,lesson.id);
  }
  assert.ok(lesson.aufgabe.loesung.js,lesson.id);
  for(const step of lesson.schritte)assert.ok(step.code&&step.erklaerung,lesson.id);
 }
 const fragen=JSON.parse(load("mein-sd-hub/daten/fragen.json"));
 assert.ok(fragen.length>=3);
 for(const q of fragen){assert.equal(q.antworten.length,3);assert.ok(q.richtig>=0&&q.richtig<3);}
});

test("P4 Quiz-App lädt lokale JSON-Datei und behandelt Fehler sicher",()=>{
 const html=load("mein-sd-hub/p4-quiz.html");
 assert.match(html,/fetch\("\.\/daten\/fragen\.json"\)/);
 assert.match(html,/antwort\.ok/);
 assert.match(html,/catch\(fehler\)/);
 assert.match(html,/\.textContent=/);
 assert.doesNotMatch(html,/\.innerHTML\s*=/);
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/type="button"/);
});

test("P4: Jede Musterlösung besteht beide Codeprüfungen, falscher Code nicht",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/javascript-aufbau.js"));
 for(const lesson of lessons){
  const good=lesson.aufgabe.loesung;
  const goodDoc={querySelector:selector=>selector==="h1"?{}:null};
  const badDoc={querySelector:()=>null};
  for(const pruefung of lesson.aufgabe.pruefungen){
   assert.equal(data.pruefeCode(pruefung.test,good,goodDoc),true,lesson.id+" Musterlösung "+pruefung.test);
   assert.equal(data.pruefeCode(pruefung.test,{html:"",css:"",js:""},badDoc),false,lesson.id+" falsche Lösung "+pruefung.test);
  }
 }
});

test("P5: acht eigene Lektionen mit verteilten Quizantworten und Fehlerkorrekturen",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/saubere-webapps.js"));
 assert.equal(lessons.length,8);
 for(const lesson of lessons){
  assert.equal(lesson.schritte.length,4,lesson.id);
  assert.equal(lesson.quiz.length,3,lesson.id);
  assert.equal(lesson.quiz.length,3,lesson.id);
  assert.ok(lesson.fehler.length>=2,lesson.id);
  assert.ok(lesson.merke.length>=2,lesson.id);
  for(const fehler of lesson.fehler){assert.match(fehler.text,/Falsch:/);assert.match(fehler.text,/Richtig:/);}
  for(const step of lesson.schritte){assert.ok(step.code&&step.erklaerung,lesson.id);}
  assert.ok(lesson.aufgabe.loesung.js.length>20,lesson.id);
 }
});
test("P5: alle acht Praxislösungen bestehen und leere Lösungen scheitern",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/saubere-webapps.js"));
 for(const lesson of lessons){
  const doc={querySelector:selector=>selector==="h1"?{}:null};
  const badDoc={querySelector:()=>null};
  for(const check of lesson.aufgabe.pruefungen){
   assert.equal(data.pruefeCode(check.test,lesson.aufgabe.loesung,doc),true,lesson.id+" Musterlösung "+check.test);
   assert.equal(data.pruefeCode(check.test,{html:"",css:"",js:""},badDoc),false,lesson.id+" leere Antwort "+check.test);
  }
 }
});

test("C1 Computer-Start: alte Fortschritts-IDs, acht Lektionen und vertiefte Schritte",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/digital.js"));
 assert.deepEqual(lessons.map(l=>l.id),["d-1","d-2","d-3","d-4","d-5","d-6","d-7","d-8"]);
 assert.equal(data.academy.find(c=>c.id==="digital").anzahl,8);
 for(const lesson of lessons){
  assert.equal(lesson.schrittePraxis.length,4,lesson.id);
  assert.ok(lesson.schrittePraxis.reduce((n,s)=>n+s.text.length,0)>=800,lesson.id);
  assert.ok(lesson.fehler.length>=2,lesson.id);
  assert.ok(lesson.merke.length>=2,lesson.id);
  for(const fehler of lesson.fehler){assert.match(fehler.text,/Falsch:/);assert.match(fehler.text,/Richtig:/)}
  assert.equal(lesson.quiz.length,3,lesson.id);
 }
 assert.ok(lessons[1].uebungen.some(u=>u.typ==="auswahl"));
 assert.ok(lessons[2].uebungen.some(u=>u.typ==="reihenfolge"));
});
test("C1: alle Übungslösungen bestehen, falsche und leere Antworten nicht",()=>{
 const engine=require(path.join(root,"mein-sd-hub/akademie-uebungen.js"));
 const lessons=require(path.join(root,"mein-sd-hub/kurse/digital.js"));
 for(const lesson of lessons)for(const u of lesson.uebungen||[]){
  const richtig=u.typ==="auswahl"?u.richtig:u.typ==="reihenfolge"?u.loesung:u.typ==="zuordnen"?u.paare.map(p=>p[1]):u.typ==="luecke"?u.loesung:null;
  assert.notEqual(richtig,null,lesson.id);
  assert.equal(engine.pruefen(u,richtig).ok,true,lesson.id+" Musterlösung");
  const falsch=u.typ==="auswahl"?[]:u.typ==="reihenfolge"?[...u.loesung].reverse():u.typ==="zuordnen"?u.paare.map(()=>"?"):u.loesung.map(()=>"");
  assert.equal(engine.pruefen(u,falsch).ok,false,lesson.id+" falsche Antwort");
 }
});

/* Gemeinsamer Qualitätsvertrag für alle ab jetzt neu erstellten oder überarbeiteten Kurse.
 * Neue Kursdateien müssen in der Liste ergänzt werden, unabhängig vom Fachgebiet. */
const legacyAcademyIds=new Set(["german","career","code","webdesign","javascript"]);
const qualityCourses=data.academy.filter(course=>!legacyAcademyIds.has(course.id)).map(course=>[course.id+".js",course.id]);
function checkAcademyQuality(courseName,lessons){
 const sequences=new Map(),tips=new Map();
 for(const lesson of lessons){
  const steps=lesson.schrittePraxis||lesson.schritte||[];
  const intro=String(lesson.explanation||"").trim();
  assert.match(intro,/[.!?]$/,courseName+" "+lesson.id+" Einleitung vollständig");
  assert.ok(intro.length>=45,courseName+" "+lesson.id+" Einleitung ausreichend");
  for(const step of steps){
   const first=String(step.text||"").trim();
   assert.ok(!first.startsWith(intro)&&!intro.startsWith(first.slice(0,Math.min(60,first.length))),courseName+" "+lesson.id+" Einleitung wiederholt Schritt");
  }
  const total=steps.reduce((n,step)=>n+String(step.text||"").length,0);
  assert.ok(total>=800,courseName+" "+lesson.id+" Erklärung mindestens 800 Zeichen: "+total);
  assert.equal(lesson.quiz?.length,3,courseName+" "+lesson.id+" Quizumfang");
  const sequence=lesson.quiz.map(q=>{
   assert.ok(q.frage?.length>12,lesson.id+" Quizfrage");
   assert.equal(q.antworten?.length,3,lesson.id+" drei Antworten");
   assert.ok(Number.isInteger(q.richtig)&&q.richtig>=0&&q.richtig<3,lesson.id+" Antwortposition");
   assert.ok(q.erklaerung?.length>=25,lesson.id+" Erklärung zur Antwort");
   return q.richtig;
  }).join(",");
  sequences.set(sequence,(sequences.get(sequence)||0)+1);
  const tip=String(lesson.aufgabe?.tipp||lesson.tip||"").trim();
  assert.ok(tip.length>=25,courseName+" "+lesson.id+" konkreter Tipp");
  tips.set(tip,(tips.get(tip)||0)+1);
 }
 for(const [sequence,count] of sequences)assert.ok(count<=2,courseName+" wiederholte Quizfolge "+sequence+" in "+count+" Lektionen");
 for(const [tip,count] of tips)assert.ok(count<=2,courseName+" wiederholter Tipp "+tip+" in "+count+" Lektionen");
}
test("Qualitätsvertrag: Einleitungen, Quizfragen, Tipps, Antwortfolgen und 800 Zeichen für alle neuen und ausgebauten Kurse",()=>{
 for(const [file,name] of qualityCourses){
  const lessons=require(path.join(root,"mein-sd-hub/kurse",file));
  checkAcademyQuality(name,lessons);
 }
});

test("C2 Internet & E-Mail: acht Lektionen und 24 begründete Quizfragen",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/internet-email.js"));
 assert.deepEqual(lessons.map(l=>l.id),Array.from({length:8},(_,i)=>"c2-"+(i+1)));
 assert.equal(data.academy.find(c=>c.id==="internet-email").anzahl,8);
 for(const l of lessons){assert.equal(l.schrittePraxis.length,4);assert.equal(l.quiz.length,3);assert.ok(l.fehler.length>=2);assert.ok(l.merke.length>=2)}
});

test("Alle Kurse: ein Fehler-Titel kommt in höchstens zwei Lektionen vor",()=>{
 const titles=new Map();
 for(const course of data.academy){
  const lessons=require(path.join(root,"mein-sd-hub/kurse",course.id+".js"));
  for(const lesson of lessons)for(const error of lesson.fehler||[]){
   const title=String(error.titel||error.title||"").trim();
   assert.ok(title.length>8,lesson.id+" braucht einen aussagekräftigen Fehler-Titel");
   const ids=titles.get(title)||new Set();ids.add(lesson.id);titles.set(title,ids);
  }
 }
 for(const [title,ids] of titles)assert.ok(ids.size<=2,"Fehler-Titel mehrfach: "+title+" in "+[...ids].join(", "));
});

test("Alle Kurse: keine zwei Kurse teilen dieselbe vollständige Quiz-Antwortfolge",()=>{
 const seen=new Map();
 for(const course of data.academy){
  const lessons=require(path.join(root,"mein-sd-hub/kurse",course.id+".js"));
  const quizLessons=lessons.filter(lesson=>Array.isArray(lesson.quiz)&&lesson.quiz.length>0);
  if(!quizLessons.length)continue; // Alt-Kurse ohne Quiz besitzen keine Antwortfolge.
  const sequence=quizLessons.map(lesson=>lesson.quiz.map(q=>{
   assert.ok(Number.isInteger(q.richtig)&&q.richtig>=0&&q.richtig<q.antworten.length,lesson.id+" gültige Antwort");
   return q.richtig;
  }).join("")).join("|");
  assert.ok(!seen.has(sequence),course.id+" hat dieselbe Antwortfolge wie "+seen.get(sequence));
  seen.set(sequence,course.id);
 }
});

test("C3 Sicher im Netz: acht Lektionen, eindeutige Fehlerkorrekturen und Quiz",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/sicher-im-netz.js"));
 assert.deepEqual(lessons.map(l=>l.id),Array.from({length:8},(_,i)=>"c3-"+(i+1)));
 checkAcademyQuality("C3",lessons);
 for(const l of lessons){assert.equal(l.schrittePraxis.length,4);assert.equal(l.quiz.length,3);assert.equal(l.fehler.length,2);for(const e of l.fehler){assert.match(e.text,/Falsch:.*Richtig:/);assert.ok(e.titel.length>12)}}
});

test("C4 Büro-Programme: acht Lektionen, 24 Quizfragen und Fehlerkorrekturen",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/buero-programme.js"));
 assert.deepEqual(lessons.map(l=>l.id),Array.from({length:8},(_,i)=>"c4-"+(i+1)));
 checkAcademyQuality("C4",lessons);
 for(const l of lessons){assert.equal(l.schrittePraxis.length,4);assert.equal(l.quiz.length,3);assert.equal(l.fehler.length,2);for(const e of l.fehler){assert.match(e.text,/Falsch:.*Richtig:/);assert.ok(e.titel.length>12)}}
});

test("C5 Digitale Profi-Werkzeuge: acht Lektionen, 24 Quizfragen und Fehlerkorrekturen",()=>{
 const lessons=require(path.join(root,"mein-sd-hub/kurse/digitale-profiwerkzeuge.js"));
 assert.deepEqual(lessons.map(l=>l.id),Array.from({length:8},(_,i)=>"c5-"+(i+1)));
 checkAcademyQuality("C5",lessons);
 for(const l of lessons){assert.equal(l.schrittePraxis.length,4);assert.equal(l.quiz.length,3);assert.equal(l.fehler.length,2);for(const e of l.fehler){assert.match(e.text,/Falsch:.*Richtig:/);assert.ok(e.titel.length>12)}}
});

test("Alle Kurse: keine sechswörtige Textfolge in mehr als zwei Lektionen",()=>{
 const phrases=new Map();
 const words=text=>String(text||"").toLocaleLowerCase("de-DE").match(/[a-zäöüß]+(?:[-'][a-zäöüß]+)*/gu)||[];
 for(const course of data.academy){
  const lessons=require(path.join(root,"mein-sd-hub/kurse",course.id+".js"));
  for(const lesson of lessons){
   const parts=[lesson.explanation,lesson.tip,...(lesson.schrittePraxis||[]).map(s=>s.text),...(lesson.fehler||[]).map(e=>e.text)];
   const found=new Set();
   for(const part of parts){const w=words(part);for(let i=0;i<=w.length-6;i++)found.add(w.slice(i,i+6).join(" "))}
   for(const phrase of found){const ids=phrases.get(phrase)||new Set();ids.add(lesson.id);phrases.set(phrase,ids)}
  }
 }
 for(const [phrase,ids] of phrases)assert.ok(ids.size<=2,"Wiederholte Wortfolge: "+JSON.stringify(phrase)+" in "+[...ids].join(", "));
});

test("Alle Kurse: keine generischen Quiz-Platzhalterantworten",()=>{
 const forbidden=/andere\s+situation|unbekannte\s+information|nicht\s+die\s+gesuchte|andere\s+information/iu;
 for(const course of data.academy){
  const lessons=require(path.join(root,"mein-sd-hub/kurse",course.id+".js"));
  for(const lesson of lessons)for(const q of lesson.quiz||[]){
   for(const answer of q.antworten||[])assert.doesNotMatch(String(answer),forbidden,lesson.id+" unbrauchbarer Ablenker");
  }
 }
});

test("Alle Kurse: Schrittüberschriften vollständig und nicht serienweise gleich",()=>{
 const patterns=new Map();
 for(const course of data.academy){
  const lessons=require(path.join(root,"mein-sd-hub/kurse",course.id+".js"));
  for(const lesson of lessons){
   const used=new Set();
   for(const step of lesson.schrittePraxis||[]){
    const title=String(step.titel||"").trim();
    assert.ok(title.length>=8,lesson.id+" zu kurze Schrittüberschrift");
    assert.doesNotMatch(title,/[-–,:;\/]\s*$/u,lesson.id+" abgebrochene Schrittüberschrift");
    assert.doesNotMatch(title,/\.{2,}$/u,lesson.id+" abgebrochene Schrittüberschrift");
    const shape=title.toLocaleLowerCase("de-DE").replace(/:.*$/u,"").replace(/\b\d+\b/gu,"#").trim();
    used.add(shape);
   }
   for(const shape of used){const ids=patterns.get(shape)||new Set();ids.add(lesson.id);patterns.set(shape,ids)}
  }
 }
 for(const [shape,ids] of patterns)assert.ok(ids.size<=2,"Wiederholter Überschriftenaufbau "+JSON.stringify(shape)+" in "+[...ids].join(", "));
});

test("D1 und D2: Lehrinhalte mit vier Übungsformen und stabilen IDs",()=>{
 const a1=require(path.join(root,"mein-sd-hub/kurse/german.js"));
 const a2=require(path.join(root,"mein-sd-hub/kurse/deutsch-a2.js"));
 assert.deepEqual(a1.map(l=>l.id),["g-1","g-2","g-3","g-4"]);
 assert.deepEqual(a2.map(l=>l.id),Array.from({length:8},(_,i)=>"d2-"+(i+1)));
 for(const [name,lessons] of [["D1",a1],["D2",a2]]){
  checkAcademyQuality(name,lessons);
  for(const l of lessons){assert.equal(l.schrittePraxis.length,4);assert.equal(l.fehler.length,2);assert.deepEqual(l.uebungen.map(u=>u.typ),["luecke","zuordnen","hoeren","schreiben"]);const writing=l.uebungen.find(u=>u.typ==="schreiben");assert.ok(Array.isArray(writing.checkliste),l.id+" Checkliste fehlt");assert.ok(writing.checkliste.length>=3&&writing.checkliste.length<=4,l.id+" Checkliste muss 3–4 Punkte haben");for(const point of writing.checkliste){assert.ok(point.length>=18,l.id+" Checklistenpunkt zu allgemein");assert.match(point,/[?.!]$/,l.id+" Checklistenpunkt unvollständig")}assert.ok(l.schrittePraxis.some(s=>/der |die |das /u.test(s.text)));}
 }
});
