'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateManifest,selectVariant}=require('../world-v3-texture-policy.js');
const hash='a'.repeat(64),a=(name,mime,size=100)=>({name,sha256:hash,size,mime});
const m={version:1,variants:[a('tex.jxl','image/jxl'),a('tex.png','image/png')]};
test('JXL requires explicit support; PNG fallback',()=>{
 assert.equal(selectVariant(m,['image/png']).name,'tex.png');
 assert.equal(selectVariant(m,['image/jxl','image/png']).name,'tex.jxl');
 assert.equal(selectVariant(m,[]),null);
});
test('immutable validated result and unchanged input',()=>{
 const before=JSON.stringify(m),v=validateManifest(m);
 assert.ok(Object.isFrozen(v.variants[0]));assert.equal(JSON.stringify(m),before);
});
test('rejects URLs, traversal and invalid records',()=>{
 for(const name of ['https://x/a.png','../a.png','a/b.png','data:image/png;base64,a']){
  assert.throws(()=>validateManifest({version:1,variants:[a(name,'image/png')]}));
 }
 assert.throws(()=>validateManifest({version:1,variants:[Object.assign(Object.create({x:1}),a('x.png','image/png'))]}));
});
test('rejects no fallback, wrong MIME, duplicate MIME and invalid hash',()=>{
 assert.throws(()=>validateManifest({version:1,variants:[a('x.jxl','image/jxl')]}));
 assert.throws(()=>validateManifest({version:1,variants:[a('x.png','image/jxl')]}));
 assert.throws(()=>validateManifest({version:1,variants:[a('x.png','image/png'),a('y.png','image/png')]}));
 assert.throws(()=>validateManifest({version:1,variants:[{...a('x.png','image/png'),sha256:'bad'}]}));
});
test('rejects excessive total size and unknown supported formats',()=>{
 assert.throws(()=>validateManifest({version:1,variants:[a('x.png','image/png',100*1024*1024),a('x.jxl','image/jxl',100*1024*1024)]}));
 assert.throws(()=>selectVariant(m,['text/html']));
});
