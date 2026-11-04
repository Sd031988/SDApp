const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
const {createCache,validRef,checkGLB}=require('../world-v3-local-glb-cache.js');
function glb(){
const json=Buffer.from('{"asset":{"version":"2.0"}}   ');
const data=Buffer.alloc(20+json.length);
data.write('glTF',0);data.writeUInt32LE(2,4);data.writeUInt32LE(data.length,8);
data.writeUInt32LE(json.length,12);data.write('JSON',16);json.copy(data,20);
return data;
}
function fixture(name='model.glb'){
const b=glb(),ref={name,size:b.length,sha256:createHash('sha256').update(b).digest('hex')};
let calls=0;const file={name,size:b.length,arrayBuffer:async()=>{calls++;return Uint8Array.from(b).buffer;}};
return {b,ref,file,get calls(){return calls;}};
}
test('validates and caches local GLB by SHA-256, copies returned data',async()=>{
const f=fixture(),cache=createCache({cryptoProvider:webcrypto});
const a=await cache.load(f.ref,f.file);new Uint8Array(a)[0]=0;
const b=await cache.load(f.ref,f.file);
assert.equal(new Uint8Array(b)[0],103);assert.equal(f.calls,1);
assert.equal(cache.stats().entries,1);cache.clear();assert.equal(cache.stats().bytes,0);
});
test('rejects URL/path traversal and corrupted digest',async()=>{
const f=fixture(),cache=createCache({cryptoProvider:webcrypto});
for(const name of ['../model.glb','https://x/model.glb','folder/model.glb','model.gltf']){
assert.throws(()=>validRef({...f.ref,name}));
}
await assert.rejects(cache.load({...f.ref,sha256:'0'.repeat(64)},f.file));
assert.equal(cache.stats().entries,0);
});
test('rejects invalid GLB structure and size mismatch',async()=>{
const f=fixture();const bad=Uint8Array.from(f.b);bad[0]=0;
assert.throws(()=>checkGLB(bad.buffer));
await assert.rejects(createCache({cryptoProvider:webcrypto}).load({...f.ref,size:f.ref.size+1},f.file));
});
test('deduplicates simultaneous reads and bounds cache with LRU',async()=>{
const f=fixture(),cache=createCache({cryptoProvider:webcrypto,maxBytes:f.b.length});
await Promise.all([cache.load(f.ref,f.file),cache.load(f.ref,f.file)]);
assert.equal(f.calls,1);assert.equal(cache.stats().bytes,f.b.length);
});
test('clear during pending read does not repopulate cache',async()=>{
const f=fixture();let release;const gate=new Promise(r=>release=r);
const file={...f.file,arrayBuffer:async()=>{await gate;return Uint8Array.from(f.b).buffer;}};
const cache=createCache({cryptoProvider:webcrypto});
const p=cache.load(f.ref,file);cache.clear();release();await p;
assert.equal(cache.stats().entries,0);
});