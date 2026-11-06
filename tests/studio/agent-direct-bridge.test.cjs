const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../studio/ki-werkstatt-ui.js'),'utf8');
const code=source.slice(source.indexOf('function startDirectAgent(){'),source.indexOf('function exportAgentRequest(){'));
function setup(){
 const fields={kiAgentAddress:{value:'https://sd-maschinen-kenner.onrender.com'},kiGoal:{value:'Fix'},kiResult:{value:''}};
 const project={},posts=[],notes=[];let receive;
 const popup={postMessage:(...args)=>posts.push(args)};
 const ctx={URL,URLSearchParams,crypto:{randomUUID:()=> 'test-session'},location:{origin:'https://thesdhub.com'},
  changeMode:true,agentRequest:{project,files:{'app.js':'old'}},S:{p:project},parsed:{errors:[]},
  $:id=>fields[id],promptText:()=> 'prompt',status:msg=>notes.push(msg),analyse:()=>ctx.analyzed=true,
  setTimeout:()=>1,clearTimeout:()=>{},window:{open:()=>popup,addEventListener:(_type,cb)=>receive=cb,removeEventListener:()=>{}}};
 vm.runInNewContext(code+';startDirectAgent();',ctx);
 const send=(type,overrides={})=>receive({source:popup,origin:'https://sd-maschinen-kenner.onrender.com',data:{type,session:'test-session'},...overrides});
 return {ctx,fields,posts,notes,send,popup};
}
const a=setup();assert.equal(a.posts.length,0);
a.send('SD_CODING_READY',{origin:'https://evil.invalid'});assert.equal(a.posts.length,0);
a.send('SD_CODING_READY',{source:{}});assert.equal(a.posts.length,0);
a.send('SD_CODING_READY',{data:{type:'SD_CODING_READY',session:'wrong'}});assert.equal(a.posts.length,0);
a.send('SD_CODING_READY');assert.equal(a.posts.length,1);
assert.equal(a.posts[0][0].request.files[0].content,'old');
a.send('SD_CODING_READY');assert.equal(a.posts.length,1);
a.send('SD_CODING_RESULT',{data:{type:'SD_CODING_RESULT',session:'test-session',result:{studioOutput:'proposal'}}});
assert.equal(a.fields.kiResult.value,'proposal');assert.equal(a.ctx.analyzed,true);
const b=setup();b.send('SD_CODING_READY');b.fields.kiGoal.value='Changed';
b.send('SD_CODING_RESULT',{data:{type:'SD_CODING_RESULT',session:'test-session',result:{studioOutput:'stale'}}});
assert.equal(b.ctx.analyzed,undefined);assert.equal(b.fields.kiResult.value,'');
console.log('Agent bridge: handshake, origin, window, nonce, duplicate, result and stale-task checks passed.');
