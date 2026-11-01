"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const path=require("node:path");
const core=require(path.resolve(__dirname,"../../studio/ki-werkstatt-core.js"));
const tick=String.fromCharCode(96).repeat(3);
const fence=(p,lang,code)=>"### Datei: "+p+"\n"+tick+lang+"\n"+code+"\n"+tick+"\n";
test("AI coding parses HTML, CSS and nested JS into their own paths",()=>{
 const r=core.parse(fence("index.html","html","<h1>Hallo</h1>")+"\n"+fence("css/style.css","css","body{color:red}")+"\n"+fence("js/app.js","js","console.log(1)"));
 assert.equal(r.errors.length,0);
 assert.deepEqual(r.files.map(f=>f.path),["index.html","css/style.css","js/app.js"]);
 assert.equal(r.files[1].content,"body{color:red}\n");
});
test("AI coding identifies intended active file if language matches",()=>{
 assert.equal(core.parse(tick+"js\nconst n=1;\n"+tick,"src/features/main.js").files[0].path,"src/features/main.js");
 assert.equal(core.parse(tick+"css\nbody{color:red}\n"+tick,"src/page.html").files[0].path,"style.css");
});
test("AI coding rejects paths that escape the project and sensitive filenames",()=>{
 for(const p of ["../server.js","/etc/password.json","C:/temp/main.py","src/../out.js",".env","src/.ssh/key.js","node_modules/pkg/index.js","src//index.html","src/file.exe","src/a|b.js","src\\..\\x.js"]){
  assert.equal(core.safePath(p),null,p);
 }
 assert.equal(core.safePath("pages/home/index.html"),"pages/home/index.html");
});
test("AI coding rejects duplicate case-insensitive filenames",()=>{
 const r=core.parse(fence("App.js","js","let x=1")+"\n"+fence("app.js","js","let x=2"));
 assert.ok(r.errors.some(e=>/mehrfach/.test(e)));
});
test("AI coding rejects malformed responses and mismatched languages",()=>{
 assert.ok(core.parse("Hello world").errors.length);
 assert.ok(core.parse(fence("index.css","html","<h1/>")).errors.some(e=>/passt nicht/.test(e)));
 assert.ok(core.parse(fence("../bad.js","js","bad()")).errors.length);
});
test("AI coding imposes limits on reply size, per-file size and file count",()=>{
 assert.ok(core.parse("x".repeat(320001)).errors.length);
 assert.ok(core.parse(fence("index.html","html","x".repeat(180001))).errors.length);
 const many=Array.from({length:41},(_,i)=>fence("p"+i+".js","js","x=1")).join("\n");
 assert.ok(core.parse(many).errors.length);
});
test("AI plan identifies changed, new and unchanged files without mutating input",()=>{
 const original={"index.html":"OLD","js/ok.js":"same\n"};
 const files=[{path:"index.html",content:"NEW"},{path:"js/ok.js",content:"same\n"},{path:"style.css",content:"body{}"}];
 const before=JSON.stringify(original),changes=core.buildPlan({files},original);
 assert.deepEqual(changes.map(x=>x.status),["ersetzt in Kopie","unverändert","neu"]);
 assert.equal(JSON.stringify(original),before);
});
test("AI prompt only includes file paths by default; contents need opt-in",()=>{
 const p={name:"project",dateien:{"config.json":"SUPER_PRIVATE_SECRET","src/app.js":"CODE_SECRET"}};
 const normal=core.buildPrompt("Baue eine Galerie",p,"src/app.js");
 assert.ok(normal.includes("src/app.js"));
 assert.ok(!normal.includes("CODE_SECRET"));
 const included=core.buildPrompt("Galerie",p,"src/app.js","explicit code");
 assert.ok(included.includes("explicit code"));
 assert.equal(core.buildPrompt("   ",p,"src/app.js"),"");
});
test("AI module avoids network calls and requires confirmation for copy creation",()=>{
 const fs=require("node:fs"),source=fs.readFileSync(path.resolve(__dirname,"../../studio/ki-werkstatt-ui.js"),"utf8");
 assert.ok(source.includes("https://chatgpt.com/"));
 assert.ok(source.includes("https://gemini.google.com/"));
 assert.ok(source.includes("await projSchreiben(project)"));
 assert.ok(source.includes("window.confirm("));
 assert.ok(!source.includes("fetch("));
});


test("full AI answer imports HTML CSS JavaScript Python Java and ignores explanation text",()=>{
 const answer=[
  "Hier findest du eine vollständige Lösung.",
  "### Datei: index.html",tick+"html","<html><head><link rel='stylesheet' href='style.css'></head><body><script src='app.js'></script></body></html>",tick,
  "Wichtig: Die Erklärung gehört NICHT in die Dateien.",
  "### Datei: style.css",tick+"css","body { color: blue; }",tick,
  "### Datei: js/app.js",tick+"javascript","console.log('ok')",tick,
  "Java-Teil:",tick+"java","public class Main { public static void main(String[] args) {} }",tick,
  "Python-Teil:",tick+"python","print('Hallo')",tick,
  "Abschließende Erklärung mit Installationstipps."
 ].join("\n");
 const result=core.parse(answer,null,{});
 assert.deepEqual(result.errors,[]);
 assert.deepEqual(result.files.map(x=>x.path),["index.html","style.css","js/app.js","Main.java","main.py"]);
 for(const f of result.files){
  assert.ok(!f.content.includes("Wichtig: Die Erklärung"));
  assert.ok(!f.content.includes("Abschließende Erklärung"));
 }
 assert.equal(result.files[4].content,"print('Hallo')\n");
});
test("supports Kotlin C++ C# Rust Go TypeScript PHP Ruby PowerShell and SQL as separate files",()=>{
 const languages=["kotlin","cpp","csharp","rust","go","typescript","php","ruby","powershell","sql"];
 const source=languages.map((lang,i)=>tick+lang+"\n"+(lang==="cpp"?"#include <iostream>":"code_"+i+"();")+"\n"+tick).join("\nErklärende Zeile.\n");
 const result=core.parse(source);
 assert.deepEqual(result.errors,[]);
 assert.equal(result.files.length,languages.length);
 assert.deepEqual(result.files.map(f=>f.path),["Main.kt","main.cpp","Program.cs","src/main.rs","main.go","app.ts","index.php","main.rb","script.ps1","query.sql"]);
});
test("implicit multiple JavaScript blocks get distinct files, never silently overwrite",()=>{
 const result=core.parse(tick+"js\nconst a=1\n"+tick+"\nErklärung\n"+tick+"javascript\nconst b=2\n"+tick);
 assert.deepEqual(result.errors,[]);
 assert.deepEqual(result.files.map(x=>x.path),["app.js","app-2.js"]);
 assert.ok(result.warnings.length);
});
test("plain prose and shell installation commands are skipped, not copied into files",()=>{
 const source="Please run this command:\n"+tick+"bash\nnpm install react\n"+tick+"\nAnleitung\n"+tick+"text\nThis is a paragraph\n"+tick+"\n"+tick+"python\nprint(5)\n"+tick;
 const result=core.parse(source);
 assert.deepEqual(result.files.map(x=>x.path),["main.py"]);
 assert.equal(result.files.length,1);
 assert.ok(result.skipped>=2);
});
test("explicit unsafe file headings fail instead of silently being renamed",()=>{
 const result=core.parse("### Datei: ../private.js\n"+tick+"javascript\nconsole.log(1)\n"+tick);
 assert.equal(result.files.length,0);
 assert.ok(result.errors.some(x=>/Unsicherer/.test(x)));
});
test("missing file heading can map uniquely to an existing project file by extension",()=>{
 const result=core.parse(tick+"python\nprint('hello')\n"+tick,"index.html",{"src/services/main.py":"old","index.html":"<h1/>"});
 assert.deepEqual(result.files.map(x=>x.path),["src/services/main.py"]);
});
test("code-only raw content works but ordinary ChatGPT prose is not taken as code",()=>{
 assert.deepEqual(core.parse("const x=1;").files.map(x=>x.path),["app.js"]);
 assert.ok(core.parse("This is an explanation, not code.").errors.length);
});
test("prompt asks for all required code languages in one copyable package",()=>{
 const prompt=core.buildPrompt("Website mit Java",null,null);
 assert.ok(prompt.includes("KOMPLETTER CODE"));
 assert.ok(prompt.includes("Python"));
 assert.ok(prompt.includes("Java"));
 assert.ok(prompt.includes("genau EINMAL"));
});

test("change assistant recommends active HTML and linked CSS JS but not unrelated files",()=>{
 const project={dateien:{
  "index.html":'<link href="css/style.css" rel="stylesheet"><script src="js/app.js"></script>',
  "css/style.css":"body {color:#333}",
  "js/app.js":"console.log(1)",
  "main.py":"print('irrelevant')"
 }};
 assert.deepEqual(core.suggestChangeFiles(project,"index.html"),["index.html","css/style.css","js/app.js"]);
});
test("change prompts include only user-approved complete file contents",()=>{
 const project={name:"Rechnungen",dateien:{"index.html":"<h1>Meine Rechnung</h1>","style.css":"body{color:orange}","private.py":"print('never share')"}};
 const request=core.buildChangePrompt("Knopf zum Drucken hinzufügen",project,["index.html","style.css"]);
 assert(request.includes("<h1>Meine Rechnung</h1>"));
 assert(request.includes("body{color:orange}"));
 assert(!request.includes("print('never share')"));
 assert(request.includes("Unveränderte Dateien NICHT erneut ausgeben"));
 assert(request.includes("Knopf zum Drucken hinzufügen"));
 assert(request.includes("### Datei:"));
 assert.equal(project.dateien["index.html"],"<h1>Meine Rechnung</h1>");
});
test("change prompts reject secrets, missing paths, oversized and empty selection",()=>{
 const project={name:"safe",dateien:{
  "app.js":"console.log('hello')",
  "password.js":'const password = "super-secret-value";',
  "too-big.js":"x".repeat(55001)
 }};
 assert.equal(core.changeFileAllowed("password.js",project.dateien["password.js"]),false);
 assert.equal(core.changeFileAllowed(".env","A=B"),false);
 assert.equal(core.changeFileAllowed("main.js","-----BEGIN PRIVATE KEY-----"),false);
 assert.throws(()=>core.buildChangePrompt("Test",project,["password.js"]),/Zugangsdaten|ungeeignet/);
 assert.throws(()=>core.buildChangePrompt("Test",project,["missing.js"]),/nicht mehr vorhanden/);
 assert.throws(()=>core.buildChangePrompt("Test",project,["too-big.js"]),/zu groß/);
 assert.throws(()=>core.buildChangePrompt("Test",project,[]),/mindestens eine/);
 assert.throws(()=>core.buildChangePrompt(" ",project,["app.js"]),/Änderung beschreiben/);
});
