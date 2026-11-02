'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {review,changedLines}=require('../../studio/ki-code-review.js');
test('reports line-level warnings and suggestions without executing imported code',()=>{
 const s='const html = input;\nelement.innerHTML = html;\nconst ok = true;';
 const r=review([{path:'js/app.js',content:s}],{});
 assert.equal(r.blocked,false);
 assert(r.findings.some(x=>x.rule==='html-injection'&&x.line===2));
 assert.equal(r.checksExecuted,false);
 assert.equal(r.localOnly,true);
});
test('only changed lines are inspected for advisory risks',()=>{
 const previous={'app.js':'eval(other);\nconsole.log("old");'};
 const r=review([{path:'app.js',content:'eval(other);\nconsole.log("new");'}],previous);
 assert.equal(r.findings.some(x=>x.rule==='dynamic-code'),false);
 assert.deepEqual(changedLines(previous['app.js'],'eval(other);\nconsole.log("new");'),{start:2,end:2});
});
test('even unchanged high-confidence private credentials block an import',()=>{
 const secret='ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
 const r=review([{path:'js/app.js',content:'const token="'+secret+'";\nconsole.log("new");'}],
  {'js/app.js':'const token="'+secret+'";\nconsole.log("old");'});
 assert(r.blocked);
 assert.equal(r.critical,1);
 assert(!JSON.stringify(r.findings).includes(secret));
});
test('sensitive credential filename and private PEM are blocked',()=>{
 const r=review([{path:'credentials.json',content:'{}'},
  {path:'private.txt',content:'-----BEGIN PRIVATE KEY-----'}],{});
 assert.equal(r.critical,2);
 assert.equal(r.blocked,true);
});
test('safe code produces no suggestions and no mutation',()=>{
 const files=[{path:'index.html',content:'<img src="logo.svg" alt="Logo">'}];
 const json=JSON.stringify(files);
 const r=review(files,{});
 assert.equal(r.findings.length,0);
 assert.equal(JSON.stringify(files),json);
});
test('Python shell, deserialization and HTML alt checks produce suggestions',()=>{
 const r=review([{path:'script.py',content:'subprocess.run(command, shell=True)\nyaml.load(blob)\n'},
  {path:'index.html',content:'<img src="photo.png">'}],{});
 assert(r.findings.some(x=>x.rule==='shell'));
 assert(r.findings.some(x=>x.rule==='unsafe-deserialization'));
 assert(r.findings.some(x=>x.rule==='image-alt'));
});
test('review bounds findings and treats oversized files as unreviewed',()=>{
 const big=review([{path:'app.js',content:'a'.repeat(180001)}],{});
 assert.equal(big.scanned,0);
 assert.equal(big.skipped,1);
 assert(big.findings.some(x=>x.rule==='size'));
 const many=review([{path:'app.js',content:('eval("x");\n').repeat(130)}],{});
 assert.equal(many.truncated,true);
 assert(many.findings.length<=75);
});
test('AI workbench mounts review in preview and blocks high confidence secrets before both apply paths',()=>{
 const html=fs.readFileSync(path.resolve(__dirname,'../../studio/index.html'),'utf8');
 const ui=fs.readFileSync(path.resolve(__dirname,'../../studio/ki-werkstatt-ui.js'),'utf8');
 assert(html.includes('id="kiReviewSummary"'));
 assert(html.includes('ki-code-review.js'));
 assert(ui.includes('renderCodeReview'));
 assert(ui.includes('checkSelectedCodeReview('));
 assert(ui.includes('kiReviewFindings'));
 assert(ui.includes('review.blocked'));
});
