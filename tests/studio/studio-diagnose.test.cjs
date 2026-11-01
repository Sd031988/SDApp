'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('../../studio/studio-diagnose.js');

test('healthy HTML CSS JS imports do not create false errors',()=>{
 const files={
  'index.html':'<link rel="stylesheet" href="css/style.css"><script defer src="js/app.js"></script>',
  'css/style.css':'body { background: url("../images/bg.png"); }',
  'js/app.js':'window.ready = true;',
  'images/bg.png':'data:image/png;base64,iVBOR'
 };
 assert.deepEqual(api.inspect(files),[]);
});
test('detect missing HTML stylesheet and script, with exact path and line',()=>{
 const r=api.inspect({'index.html':'<h1>Hallo</h1>\n<link rel="stylesheet" href="css/missing.css">\n<script src="app.js"></script>'});
 assert.equal(r.length,2);
 assert.equal(r[0].line,2);
 assert.match(r[0].text,/css\/missing.css/);
 assert.equal(r[1].line,3);
 assert.equal(r[1].severity,'error');
});
test('detect syntax errors without ever executing user code',()=>{
 globalThis.__sdShouldNeverRun = 0;
 const r=api.inspect({'app.js':'globalThis.__sdShouldNeverRun = 1; function x( {'});
 assert(r.some(x=>x.kind==='javascript'));
 assert.equal(globalThis.__sdShouldNeverRun,0);
 delete globalThis.__sdShouldNeverRun;
});
test('ignore legitimate external services and absolute assets correctly',()=>{
 const files={'index.html':'<script src="https://cdn.example.com/a.js"></script><link rel="stylesheet" href="/style.css"><img src="data:image/png;base64,AAA">','style.css':'body{}'};
 assert.deepEqual(api.inspect(files),[]);
});
test('detect JSON mistakes, missing CSS asset and module imports',()=>{
 const r=api.inspect({
  'data.json':'{"a": }',
  'style.css':'body { background-image: url("img/missing.png"); }',
  'src/main.js':'import foo from "./utils.js";\nconsole.log(foo);'
 });
 assert(r.some(x=>x.kind==='json'));
 assert(r.some(x=>x.kind==='asset'&&x.file==='style.css'));
 assert(r.some(x=>x.kind==='import'&&x.file==='src/main.js'));
});
test('warn about dangerous root base, accept relative paths and never leak source into AI prompt',()=>{
 const issues=api.inspect({'index.html':'<base href="/"><script src="./ok.js"></script>','ok.js':'const MY_PRIVATE_PASSWORD="secret";'});
 assert.equal(issues.length,1);
 assert.equal(issues[0].severity,'warning');
 const prompt=api.fixPrompt(issues,'my-project');
 assert(prompt.includes('index.html:1'));
 assert(!prompt.includes('MY_PRIVATE_PASSWORD'));
});
test('reject path traversal and never fetch network resources',()=>{
 assert.equal(api.resolvePath('index.html','../../outside.js'),null);
 assert.equal(api.resolvePath('src/index.html','../style.css'),'style.css');
 assert.equal(api.resolvePath('src/index.html','https://evil.example/x'),null);
});
