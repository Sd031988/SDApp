'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const refs=require('../glb-asset-references.js');
const hash='a'.repeat(64);
test('valid local content-addressed reference is normalized and immutable',()=>{
 const ref=refs.create('hero.glb',hash,1200);
 assert.deepEqual(ref,{version:1,kind:'local-glb',name:'hero.glb',sha256:hash,bytes:1200});
 assert.equal(Object.isFrozen(ref),true);
});
test('rejects URLs, traversal, extra keys and malformed hashes',()=>{
 for(const name of ['https://evil.test/a.glb','../a.glb','a/../../b.glb','a\\b.glb','..evil.glb','asset.gltf','', 'a'.repeat(121)+'.glb'])
  assert.throws(()=>refs.create(name,hash,1200));
 assert.throws(()=>refs.create('ok.glb','x'.repeat(64),1200));
 assert.throws(()=>refs.validate({version:1,kind:'local-glb',name:'ok.glb',sha256:hash,bytes:1200,url:'https://evil.test'}));
});
test('rejects invalid byte sizes and never resolves by filename alone',()=>{
 for(const bytes of [0,11,Infinity,1.5,-1,refs.MAX_BYTES+1])
  assert.throws(()=>refs.create('ok.glb',hash,bytes));
 const ref=refs.create('ok.glb',hash,1200);
 const file={};
 assert.equal(refs.resolve(ref,[{sha256:'b'.repeat(64),bytes:1200,file}]),null);
 assert.equal(refs.resolve(ref,[{sha256:hash,bytes:1201,file}]),null);
 assert.equal(refs.resolve(ref,[{sha256:hash,bytes:1200,file}]),file);
});
