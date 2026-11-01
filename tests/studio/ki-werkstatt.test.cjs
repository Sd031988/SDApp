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
