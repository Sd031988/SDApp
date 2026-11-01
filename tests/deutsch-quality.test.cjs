"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const load=p=>fs.readFileSync(path.join(root,p),"utf8");
test("four learning levels cover literacy through B1 with aligned units",()=>{
 const plan=JSON.parse(load("deutsch/daten/lehrplan.json"));
 assert.deepEqual(plan.levels.map(l=>l.id),["alpha","A1","A2","B1"]);
 for(const level of plan.levels){assert.ok(level.units.length>=8,level.id);assert.equal(level.units.length,level.goals.length,level.id);assert.equal(new Set(level.units).size,level.units.length,level.id)}
 assert.ok(plan.levels.find(x=>x.id==="B1").units.length>=15);
});
test("translated lesson books are valid, non-empty JSON",()=>{
 for(const lang of ["en","fa","ti","ur"]){const source=load("deutsch/daten/buch-"+lang+".json");assert.ok(source.length>1000,lang+" missing book");const obj=JSON.parse(source);assert.ok(obj&&typeof obj==="object"&&Object.keys(obj).length>0,lang)}
});
test("German course scripts and independent exam examples are syntactically valid",()=>{
 for(const file of ["deutsch/lernen.js","deutsch/lern-api.js","deutsch/umzug.js","deutsch/b1-musterpruefungen.js"])
   assert.doesNotThrow(()=>new vm.Script(load(file)),file);
});
test("full exam generator defines Goethe, telc and DTZ models with skill sections",()=>{
 const source=load("deutsch/b1-musterpruefungen.js");
 const start=source.indexOf("const E={"),end=source.indexOf("const themes=",start);
 assert.ok(start>=0&&end>start,"Exam templates missing");
 const code=source.slice(start,end);
 const result=vm.runInNewContext(code+";E",{});
 assert.deepEqual(Object.keys(result).sort(),["dtz","goethe","telc"]);
 for(const [id,exam] of Object.entries(result)){
  assert.ok(exam.parts.length>=4,id);
  const partIds=exam.parts.map(p=>p[0]);
  for(const skill of ["lesen","hoeren","schreiben","sprechen"])assert.ok(partIds.includes(skill),id+": "+skill);
  for(const part of exam.parts){assert.ok(part[2]>0,id+" duration");assert.ok(Array.isArray(part[3])&&part[3].every(n=>Number.isInteger(n)&&n>0),id+" groups");assert.equal(part[3].length,part[4].length,id+" types")}
 }
 assert.match(source,/set<=5/);
});
test("exam pages disclose independent practice and are linked from the homepage",()=>{
 const home=load("index.html"),exam=load("deutsch/b1-pruefung.html"),course=load("deutsch/index.html");
 for(const path of ["deutsch/b1-pruefung.html","deutsch/b1-papierpruefung.html","deutsch/b1-pruefungsablauf.html"])assert.ok(home.includes('href="'+path+'"'),path);
 assert.match(exam,/keine offizielle/);
 assert.match(course,/href="\.\.\/mein-sd-hub\/#akademie"/);
});
