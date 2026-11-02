'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {run,compare,compareRepair}=require('../../studio/ki-test-loop.js');
const {review}=require('../../studio/ki-code-review.js');
const {createPlan}=require('../../studio/ki-repair-assistant.js');
const {projectGraph}=require('../../studio/agent-task.js');
const original={};
function plan(files,base=original){return createPlan(files,base,review(files,base));}
test('one HTML security issue disappears after safe candidate repair',()=>{
 const files=[{path:'index.html',content:'<a href="/help" target="_blank">Hilfe</a>\n'}];
 const before=JSON.stringify(files);
 const result=compareRepair(files,original,plan(files),review,projectGraph);
 assert.equal(result.status,'improved');
 assert.equal(result.canStage,true);
 assert(result.fixed.some(x=>x.rule==='external-tab'));
 assert.equal(result.introduced.length,0);
 assert.equal(result.before.codeExecuted,false);
 assert.equal(result.after.filesModified,false);
 assert.equal(JSON.stringify(files),before);
});
test('changes that introduce a failing assertion cannot be staged',()=>{
 const a=run([{path:'index.html',content:'<a target="_blank">Hilfe</a>'}],{},review,projectGraph);
 const b=run([{path:'index.html',content:'<a target="_blank">Hilfe</a><img src="missing.png">'}],{},review,projectGraph);
 const result=compare(a,b);
 assert.equal(result.canStage,false);
 assert(result.introduced.some(x=>x.rule==='asset'));
});
test('JSON syntax is actually parsed as data without executing user code',()=>{
 const ok=run([{path:'package.json',content:'{"scripts":{"test":"echo test"}}'}],{},review,projectGraph);
 const bad=run([{path:'package.json',content:'{"scripts":'}],{},review,projectGraph);
 assert(ok.tests.some(x=>x.rule==='json'&&x.status==='pass'));
 assert(bad.tests.some(x=>x.rule==='json'&&x.status==='fail'));
});
test('missing local assets count as failed static tests, not runtime tests',()=>{
 const result=run([{path:'index.html',content:'<script src="missing.js"></script>'}],{},review,projectGraph);
 assert.equal(result.codeExecuted,false);
 assert(result.tests.some(x=>x.rule==='asset'&&x.status==='fail'));
});
test('secret review blocks both repaired and unrepaired candidates, with no secret exposure',()=>{
 const secret='ghp_AABBCCDDEEFF001122334455';
 const files=[{path:'index.html',content:'<a target="_blank">Hilfe</a>\n'},{path:'app.js',content:'const token="'+secret+'";'}];
 const outcome=compareRepair(files,{},plan(files),review,projectGraph);
 assert.equal(outcome.canStage,false);
 const check=run(files,{},review,projectGraph);
 assert.equal(check.blocked,true);
 assert(!JSON.stringify(check).includes(secret));
});
test('no repair or missing validation engine cannot report successful tests',()=>{
 const data=[{path:'index.html',content:'<a target="_blank">Click</a>'}];
 assert.equal(compareRepair(data,{},null,review,projectGraph).canStage,false);
 const result=run(data,{},null,projectGraph);
 assert.equal(result.blocked,true);
});
test('transient code data are not mutated or sent anywhere by test module',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../../studio/ki-test-loop.js'),'utf8');
 for(const unsafe of ['fetch(','XMLHttpRequest','projSchreiben(','eval(','new Function(','localStorage','document.write('])
  assert(!source.includes(unsafe),unsafe);
 const ui=fs.readFileSync(path.resolve(__dirname,'../../studio/ki-werkstatt-ui.js'),'utf8');
 const html=fs.readFileSync(path.resolve(__dirname,'../../studio/index.html'),'utf8');
 assert(ui.includes('function testRepairDraft()'));
 assert(ui.includes('compareRepair('));
 assert(ui.includes('testResult.canStage'));
 assert(html.includes('id="kiTestResults"'));
 assert(html.includes('ki-test-loop.js'));
});
