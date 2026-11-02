'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {analyze}=require('../../studio/agent-review.js');
const quality=require('../../studio/studio-qualitaet.js');
const diag=require('../../studio/studio-diagnose.js');
const engines={preflight:quality.preflight,diagnose:diag.inspect};
test('static review summarizes real web project without executing code',()=>{
 const files={'index.html':'<link rel="stylesheet" href="style.css"><script src="app.js"></script>',
  'style.css':'body{color:red}','app.js':'console.log(1)'};
 const before=JSON.stringify(files);
 const r=analyze(files,engines);
 assert.equal(r.status,'manual');
 assert.equal(r.errors,0);
 assert.equal(r.fileCount,3);
 assert.equal(r.stages.length,5);
 assert.equal(r.testsExecuted,false);
 assert.equal(r.filesModified,false);
 assert.equal(JSON.stringify(files),before);
});
test('missing referenced asset blocks review',()=>{
 const r=analyze({'index.html':'<script src="missing.js"></script>'},engines);
 assert.equal(r.status,'blocked');
 assert(r.findings.some(f=>f.severity==='error'&&f.kind==='asset'));
});
test('Python projects do not require HTML, but need real runtime tests',()=>{
 const r=analyze({'main.py':'print(123)','tests/test_main.py':'def test_sample(): assert True'},engines);
 assert.equal(r.errors,0);
 assert.equal(r.web,false);
 assert.equal(r.testCount,1);
 assert.match(r.stages[2].detail,/Statische Analyse ersetzt keinen Testlauf/);
});
test('secret names or private keys trigger blocked status',()=>{
 const r=analyze({'main.py':'print(1)','.env':'API=secret'},engines);
 assert.equal(r.status,'blocked');
 assert(r.findings.some(f=>f.kind==='secret'));
});
test('review prompt contains only aggregate metadata and never private file content or secret names',()=>{
 const privateText='DO_NOT_LEAK_A_PRIVATE_VALUE_1257';
 const r=analyze({'main.py':privateText,'.env':'API_TOKEN='+privateText},engines);
 assert(!r.prompt.includes(privateText));
 assert(!r.prompt.includes('.env'));
 assert(!r.prompt.includes('main.py'));
 assert.match(r.prompt,/Planen, minimale Änderungen, Tests, Sicherheit, Review/);
});
test('invalid package JSON and build requirements surface via existing quality engine',()=>{
 const x=analyze({'package.json':'{','src/main.ts':'export const a=1'},engines);
 assert(x.findings.some(f=>f.kind==='json'&&f.severity==='error'));
 const y=analyze({'package.json':'{"scripts":{"test":"node --test","build":"vite build"}}',
  'index.html':'<h1>Demo</h1>'},engines);
 assert(y.scripts.includes('test'));
 assert(y.findings.some(f=>f.kind==='build'));
});
test('browser UI is wired and does not auto-run or save projects',()=>{
 const html=fs.readFileSync(path.resolve(__dirname,'../../studio/index.html'),'utf8');
 const ui=fs.readFileSync(path.resolve(__dirname,'../../studio/agent-review-ui.js'),'utf8');
 assert(html.includes('id="agentReviewBtn"'));
 assert(html.includes('agent-review.js'));
 assert(html.includes('agent-review-ui.js'));
 assert(ui.includes('SDKICodingUI.currentFiles'));
 assert(!ui.includes('projSchreiben('));
 assert(!ui.includes('speichernJetzt('));
 assert(!ui.includes('fetch('));
});
