const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../studio/ki-werkstatt-ui.js'),'utf8');
const fn=source.slice(source.indexOf('function validateProposalPreview(){'),source.indexOf('\nfunction analyse(){'));
function check(originals, approved, proposed, switched=false){
 const project={};const ctx={S:{p:project},agentRequest:approved?{project:switched?{}:project,files:approved}:null,
 stagedSnapshot:originals,parsed:{files:proposed,errors:[]},
 window:{SDStudioAgentProposal:{hashText:()=> 'hash',validateProposal:()=>({ok:true})}}};
 vm.runInNewContext(fn+';validateProposalPreview();',ctx);return ctx.parsed.errors;
}
const proposal=[{path:'app.js',content:'new'}];
assert.equal(check({'app.js':'old'},{'app.js':'old'},proposal).length,0);
assert.match(check({'app.js':'edited'},{'app.js':'old'},proposal)[0],/seit der KI-Anfrage verändert/);
assert.match(check({'app.js':'old'},{'other.js':'old'},proposal)[0],/Nicht.*freigegebene/);
assert.match(check({}, {'app.js':'old'},proposal)[0],/verändert/);
assert.match(check({'app.js':'old'},{'app.js':'old'},proposal,true)[0],/Projekt/);
assert.equal(check({}, {'app.js':'old'},[{path:'new.js',content:'new'}]).length,0);
assert.equal(check({'app.js':'old'},null,proposal).length,0);
console.log('7 focused request-snapshot checks passed');
