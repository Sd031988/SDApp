'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {projectGraph,resolve,eligible,suggestedFiles,makePlan}=require('../../studio/agent-task.js');

test('relative paths are safe, allow index.js and reject traversal/external links',()=>{
 assert.equal(resolve('pages/page.html','../js/index.js'),'js/index.js');
 assert.equal(resolve('pages/page.html','../../../../secrets.js'),null);
 assert.equal(resolve('index.html','https://example.com/evil.js'),null);
 assert.equal(resolve('index.html','data:application/javascript,abc'),null);
 assert.equal(resolve('index.html','mailto:abc@example.com'),null);
 assert.equal(resolve('index.html','#section'),null);
});
test('graph links HTML, CSS and module imports without executing code',()=>{
 const files={
  'index.html':'<script src="js/index.js"></script><link rel="stylesheet" href="css/site.css">',
  'js/index.js':"import { login } from './auth.js';",
  'js/auth.js':'export const login=()=>true;',
  'css/site.css':"@import 'layout.css';body{background:url('../images/logo.svg')}",
  'css/layout.css':'body{display:block}',
  'images/logo.svg':'<svg></svg>'
 };
 const before=JSON.stringify(files), graph=projectGraph(files);
 assert.equal(graph.edges.length,5);
 assert.equal(graph.missing.length,0);
 assert(graph.edges.some(e=>e.from==='js/index.js'&&e.to==='js/auth.js'));
 assert(graph.edges.some(e=>e.from==='css/site.css'&&e.to==='images/logo.svg'));
 assert.equal(JSON.stringify(files),before);
});
test('graph preserves unresolved path evidence without loading remote urls',()=>{
 const graph=projectGraph({'index.html':'<script src="missing.js"></script><script src="https://cdn.example/app.js"></script>'});
 assert.equal(graph.edges.length,1);
 assert.equal(graph.missing[0].to,'missing.js');
});
test('task chooses related code files rather than unrelated assets',()=>{
 const files={'index.html':'<script src="js/login.js"></script>',
 'js/login.js':"import {check} from './auth.js';",
 'js/auth.js':'export const check=true;',
 'css/style.css':'body{}','secret.key':'DO_NOT_COPY'};
 const graph=projectGraph(files);
 const suggested=suggestedFiles('Repariere Login und Authentifizierung',files,graph,null);
 assert(suggested.includes('js/login.js'));
 assert(suggested.includes('js/auth.js'));
 assert(!suggested.includes('secret.key'));
 assert(!eligible('.env','TOKEN=x'));
});
test('task prompt copies no file content, paths, findings or credentials',()=>{
 const secret='VERY_SECRET_VALUE_8135';
 const files={'main.py':'print("'+secret+'")','credentials.json':'{"access_token":"'+secret+'"}'};
 const report={errors:2,warnings:1,findings:[{text:secret}]};
 const plan=makePlan('Verbessere Python-Tests',files,report,null);
 assert(plan.prompt.includes('Verbessere Python-Tests'));
 assert(!plan.prompt.includes(secret));
 assert(!plan.prompt.includes('main.py'));
 assert(!plan.prompt.includes('credentials.json'));
 assert.equal(plan.filesModified,false);
 assert.equal(plan.testsExecuted,false);
});
test('empty task is rejected and no write/execute/network capability exists',()=>{
 const plan=makePlan('  ',{'index.html':'<h1>ok</h1>'},{},null);
 assert(plan.error);
 assert.equal(plan.paths.length,0);
 const src=fs.readFileSync(path.resolve(__dirname,'../../studio/agent-task.js'),'utf8');
 assert(!src.includes('fetch('));
 assert(!src.includes('projSchreiben('));
 assert(!src.includes('eval('));
});
test('review UI delegates to existing workshop but never grants content consent itself',()=>{
 const ui=fs.readFileSync(path.resolve(__dirname,'../../studio/agent-review-ui.js'),'utf8');
 const bridge=fs.readFileSync(path.resolve(__dirname,'../../studio/ki-werkstatt-ui.js'),'utf8');
 const html=fs.readFileSync(path.resolve(__dirname,'../../studio/index.html'),'utf8');
 assert(ui.includes('openChangeDialogWithGoal'));
 assert(bridge.includes("openChangeDialogWithGoal(goal,paths)"));
 assert(bridge.includes("$('kiChangeConsent').checked=false"));
 assert(html.includes('id="agentReviewPlan"'));
 assert(html.includes('id="agentReviewGoal"'));
 assert(html.includes('agent-task.js'));
});
