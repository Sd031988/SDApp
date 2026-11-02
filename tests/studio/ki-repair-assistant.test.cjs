'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {repairBlankLink,createPlan,repairPrompt}=require('../../studio/ki-repair-assistant.js');
const {review}=require('../../studio/ki-code-review.js');
function plan(files,original={}){return createPlan(files,original,review(files,original));}
test('safe blank-tab fix creates visible before/after without mutating originals',()=>{
 const files=[{path:'pages/index.html',content:'<a href="/help" target="_blank">Hilfe</a>\n'}],before=JSON.stringify(files);
 const r=plan(files);
 assert.equal(r.blocked,false);
 assert.equal(r.proposals.length,1);
 assert.match(r.updatedFiles[0].content,/rel="noopener noreferrer"/);
 assert.equal(r.proposals[0].line,1);
 assert.equal(JSON.stringify(files),before);
 assert.match(r.proposals[0].before,/target="_blank"/);
 assert.match(r.proposals[0].after,/noopener/);
});
test('preserves existing rel values and does not duplicate noreferrer',()=>{
 const line="<a href='/' target='_blank' rel='nofollow noreferrer'>Visit</a>";
 const r=repairBlankLink(line);
 assert(r);
 assert.match(r.after,/rel='nofollow noreferrer noopener'/);
 assert.equal(repairBlankLink(r.after),null);
});
test('ambiguous same-line tags or multiline tags do not get guessed fixes',()=>{
 assert.equal(repairBlankLink('<a target="_blank">One</a> <a target="_blank">Two</a>'),null);
 assert.equal(repairBlankLink('<a target="_blank"\nrel="nofollow">One</a>'),null);
});
test('nontrivial JavaScript dynamic execution stays manual, with no unsafe automatic change',()=>{
 const files=[{path:'app.js',content:'eval(userCode);\n'}],r=plan(files);
 assert.equal(r.proposals.length,0);
 assert.equal(r.manual.length,1);
 assert.equal(r.manual[0].rule,'dynamic-code');
 assert.equal(r.updatedFiles.length,0);
});
test('prompt includes only finding metadata and no source code or secrets',()=>{
 const marker='CUSTOM_SENSITIVE_STRING_XYZ_5566';
 const files=[{path:'src/app.js',content:'eval(userInput);\nconst marker="'+marker+'";'}];
 const r=plan(files),text=repairPrompt(r);
 assert.match(text,/src\/app.js/);
 assert.match(text,/dynamic-code/);
 assert(!text.includes(marker));
 assert(!text.includes('eval(userInput)'));
 assert.equal(repairPrompt({blocked:true,manual:r.manual}),'');
});
test('critical secret completely blocks repair; never exposes secret',()=>{
 const key='ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
 const files=[{path:'src/app.js',content:'eval(userCode);\nconst secret="'+key+'";'}];
 const result=plan(files);
 assert.equal(result.blocked,true);
 assert.equal(result.proposals.length,0);
 assert.equal(result.manual.length,0);
 assert(!JSON.stringify(result).includes(key));
});
test('truncated or incomplete review cannot create repair proposals',()=>{
 const files=[{path:'index.html',content:'<a target="_blank">Link</a>'}];
 const basic=review(files,{});
 assert.equal(createPlan(files,{}, {...basic,skipped:1}).blocked,true);
 assert.equal(createPlan(files,{}, {...basic,truncated:true}).blocked,true);
});
test('only selected files can be repaired; no code execution or persistence',()=>{
 const files=[{path:'one.html',content:'<a target="_blank">One</a>'}];
 const findings=[{file:'another.html',line:1,rule:'external-tab',severity:'info',title:'Link',advice:'Fix'}];
 const p=createPlan(files,{}, {blocked:false,skipped:0,truncated:false,findings});
 assert.equal(p.updatedFiles.length,0);
 assert.equal(p.manual.length,0);
 const code=fs.readFileSync(path.resolve(__dirname,'../../studio/ki-repair-assistant.js'),'utf8');
 for(const pattern of ['fetch(','projSchreiben(','eval(','new Function(','localStorage','window.open('])
  assert(!code.includes(pattern),pattern);
});
test('UI wires a distinct repair draft and preserves the existing import confirmation',()=>{
 const html=fs.readFileSync(path.resolve(__dirname,'../../studio/index.html'),'utf8');
 const ui=fs.readFileSync(path.resolve(__dirname,'../../studio/ki-werkstatt-ui.js'),'utf8');
 assert(html.includes('ki-repair-assistant.js'));
 assert(html.includes('id="kiRepairPrepare"'));
 assert(html.includes('id="kiRepairStage"'));
 assert(ui.includes('function createRepairDraft()'));
 assert(ui.includes('function stageRepair()'));
 assert(ui.includes("if(!checkSelectedCodeReview())return;"));
 assert(ui.includes('window.confirm('));
});
