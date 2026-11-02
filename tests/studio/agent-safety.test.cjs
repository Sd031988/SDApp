'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {projectGraph}=require('../../studio/agent-task.js');
const {impactAnalysis,capabilityPreview,safePath}=require('../../studio/agent-safety.js');
test('reverse dependency impact includes HTML transitively through a JS import',()=>{
 const files={
  'index.html':'<script src="js/app.js"></script>',
  'js/app.js':"import {login} from './auth.js'",
  'js/auth.js':'export const login=true;',
  'tests/auth.test.js':'test("login",()=>{})',
  'css/unrelated.css':'body{}'
 };
 const snapshot=JSON.stringify(files);
 const result=impactAnalysis(projectGraph(files),['js/auth.js'],files);
 assert.deepEqual(result.selected,['js/auth.js']);
 assert.deepEqual(result.affected.map(x=>x.path),['js/app.js','index.html']);
 assert(result.associatedTests.includes('tests/auth.test.js'));
 assert(!result.affected.some(x=>x.path==='css/unrelated.css'));
 assert.equal(JSON.stringify(files),snapshot);
});
test('excludes sensitive paths and ignores non-existent selections',()=>{
 const files={
  '.env':'SECRET',
  'credentials.json':'{}',
  'js/safe.js':"import x from '../credentials.json';",
  'index.html':'<script src="js/safe.js"></script>'
 };
 const result=impactAnalysis(projectGraph(files),['.env','credentials.json','js/safe.js','missing.js'],files);
 assert.deepEqual(result.selected,['js/safe.js']);
 assert.deepEqual(result.affected.map(x=>x.path),['index.html']);
 assert(!safePath('credentials.json'));
 assert(!safePath('.env'));
 assert(!safePath('id_rsa'));
});
test('cyclic dependencies terminate and duplicate seeds are deduplicated',()=>{
 const g={edges:[{from:'a.js',to:'b.js',exists:true},{from:'b.js',to:'a.js',exists:true}]};
 const r=impactAnalysis(g,['a.js','a.js'],{'a.js':'a','b.js':'b'});
 assert.deepEqual(r.selected,['a.js']);
 assert.deepEqual(r.affected.map(x=>x.path),['b.js']);
});
test('capability preview never claims autonomous execution or deployment access',()=>{
 const rules=capabilityPreview();
 assert.equal(rules.length,5);
 assert(rules.some(x=>x.name.includes('ausführen')&&x.status==='nicht_verfuegbar'));
 assert(rules.some(x=>x.name.includes('veröffentlichen')&&x.status==='nicht_verfuegbar'));
 assert(rules.filter(x=>x.status==='freigabe').length>=2);
 assert(!rules.some(x=>x.status==='allow_write'));
});
test('new module has no automatic writes, network calls, code execution or local storage',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../../studio/agent-safety.js'),'utf8');
 for(const phrase of ['fetch(','projSchreiben(','eval(','localStorage','window.open(','new Function('])
  assert(!source.includes(phrase),phrase);
 const ui=fs.readFileSync(path.resolve(__dirname,'../../studio/agent-review-ui.js'),'utf8');
 const html=fs.readFileSync(path.resolve(__dirname,'../../studio/index.html'),'utf8');
 assert(ui.includes('impactAnalysis('));
 assert(html.includes('id="agentReviewImpact"'));
 assert(html.includes('agent-safety.js'));
});
