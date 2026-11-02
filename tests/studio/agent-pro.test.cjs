'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const agent=require('../../studio/agent-pro.js');
const NOW='2026-11-02T07:00:00.000Z';
const files={'index.html':'<!doctype html><h1>Hallo</h1>','src/app.js':'console.log("ok")',
 '.env':'SECRET','private-key.pem':'SECRET'};
function make(){
 return agent.create('Login reparieren', {paths:['index.html','src/app.js','.env','private-key.pem','missing.js','index.html']},
  files,'task-12345678',NOW);
}
test('new agent task keeps only eligible project paths, no sources',()=>{
 const task=make();
 assert.equal(task.status,'open');
 assert.deepEqual(task.paths,['index.html','src/app.js']);
 assert(!JSON.stringify(task).includes('SECRET'));
 assert(!JSON.stringify(task).includes('console.log'));
 assert.equal(agent.eligible('../outside.js'),false);
 assert.equal(agent.eligible('credentials.json'),false);
 assert.equal(agent.eligible('src/test.js'),true);
});
test('cannot create empty tasks or mutate original files',()=>{
 const original=JSON.stringify(files);
 assert.throws(()=>agent.create(' ',{paths:['index.html']},files,'task-12345678',NOW));
 assert.throws(()=>agent.create('abc',{paths:['.env']},files,'task-12345678',NOW));
 assert.equal(JSON.stringify(files),original);
});
test('status transitions require ordered workflow and real static evidence',()=>{
 let t=make();
 assert.throws(()=>agent.transition(t,'done',files,NOW,true));
 t=agent.transition(t,'working',files,NOW);
 t=agent.transition(t,'testing',files,NOW);
 assert.throws(()=>agent.transition(t,'approval',files,NOW));
 t=agent.recordStaticTest(t,{staticOnly:true,codeExecuted:false,filesModified:false,fail:0,warnings:0,passes:3},files,NOW);
 assert.equal(t.lastTest.staticOnly,true);
 t=agent.transition(t,'approval',files,NOW);
 assert.throws(()=>agent.transition(t,'done',files,NOW,false));
 t=agent.transition(t,'done',files,NOW,true);
 assert.equal(t.status,'done');
 assert.equal(t.history.length,5);
});
test('warnings and failed checks block approval',()=>{
 let t=agent.transition(agent.transition(make(),'working',files,NOW),'testing',files,NOW);
 t=agent.recordStaticTest(t,{staticOnly:true,codeExecuted:false,filesModified:false,fail:0,warnings:1,passes:0},files,NOW);
 assert.throws(()=>agent.transition(t,'approval',files,NOW));
 assert.throws(()=>agent.recordStaticTest(t,{staticOnly:false,codeExecuted:false,filesModified:false,fail:0,warnings:0},files,NOW));
 assert.throws(()=>agent.recordStaticTest(t,{staticOnly:true,codeExecuted:true,filesModified:false,fail:0,warnings:0},files,NOW));
});
test('changed file invalidates static verification',()=>{
 let t=agent.transition(agent.transition(make(),'working',files,NOW),'testing',files,NOW);
 t=agent.recordStaticTest(t,{staticOnly:true,codeExecuted:false,filesModified:false,fail:0,warnings:0,passes:1},files,NOW);
 assert.throws(()=>agent.transition(t,'approval',{...files,'src/app.js':'changed'},NOW));
});
test('bounded task queue and safe hydration',()=>{
 const one=make(),many=Array.from({length:agent.MAX_TASKS},(_,i)=>({...one,id:'task-'+String(i).padStart(8,'0')}));
 assert.throws(()=>agent.add(many,one));
 assert.throws(()=>agent.add([one],one));
 const hydrated=agent.hydrate([one,one,{...one,id:'task-22222222',paths:['.env']}]);
 assert.equal(hydrated.length,1);
 assert.equal(hydrated[0].history.length,0);
});
test('browser integration is additive and cannot self-authorize external actions',()=>{
 const base=path.resolve(__dirname,'../../studio');
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 const ui=fs.readFileSync(path.join(base,'agent-pro-ui.js'),'utf8');
 assert(html.includes('agent-pro.js'));
 assert(html.includes('agent-pro-ui.js'));
 assert(html.includes('agent-pro.css'));
 assert(ui.includes('SDKICodingUI'));
 assert(ui.includes('openChangeDialogWithGoal'));
 assert(ui.includes('recordStaticTest'));
 assert(ui.includes('SDKITestLoop.run'));
 assert(ui.includes('localStorage'));
 for(const bad of ['fetch(', 'XMLHttpRequest', 'innerHTML', 'projSchreiben(', 'eval(', 'new Function(', 'window.open('])
  assert(!ui.includes(bad),bad);
});
