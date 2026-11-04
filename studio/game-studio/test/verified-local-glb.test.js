'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
globalThis.crypto??=webcrypto;
const glb=require('../verified-local-glb.js');
function fixture(){
 const json=Buffer.from('{"asset":{"version":"2.0"}}  ','utf8');
 const buf=new ArrayBuffer(12+8+json.length),view=new DataView(buf);
 view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,buf.byteLength,true);
 view.setUint32(12,json.length,true);view.setUint32(16,0x4e4f534a,true);
 new Uint8Array(buf,20).set(json);return buf;
}
async function digest(buffer){return Buffer.from(await webcrypto.subtle.digest('SHA-256',buffer)).toString('hex');}
test('accepts valid local GLB only with exact digest and size',async()=>{
 const buffer=fixture(),sha256=await digest(buffer);
 const result=await glb.verify({size:buffer.byteLength,arrayBuffer:async()=>buffer},{bytes:buffer.byteLength,sha256});
 assert.equal(result.sha256,sha256);assert.equal(result.bytes,buffer.byteLength);
 assert.equal(glb.inspect(buffer).chunks,1);
});
test('rejects hash mismatch and truncated or forged lengths',async()=>{
 const buffer=fixture();
 await assert.rejects(glb.verify({size:buffer.byteLength,arrayBuffer:async()=>buffer},{bytes:buffer.byteLength,sha256:'0'.repeat(64)}));
 const bad=buffer.slice(0);new DataView(bad).setUint32(8,999,true);
 assert.throws(()=>glb.inspect(bad));
 await assert.rejects(glb.verify({size:buffer.byteLength+4,arrayBuffer:async()=>buffer},{bytes:buffer.byteLength+4,sha256:'0'.repeat(64)}));
});
test('rejects malformed chunk boundaries, wrong version and untrusted input',async()=>{
 const original=fixture();
 for(const mutate of [
  v=>v.setUint32(4,1,true),v=>v.setUint32(12,0xffffffff,true),
  v=>v.setUint32(16,0x004e4942,true)
 ]){
  const copy=original.slice(0);mutate(new DataView(copy));assert.throws(()=>glb.inspect(copy));
 }
 await assert.rejects(glb.verify({size:20,arrayBuffer:async()=>new ArrayBuffer(20)},{bytes:20,sha256:'0'.repeat(64)}));
 await assert.rejects(glb.verify({size:glb.MAX_BYTES+1,arrayBuffer:async()=>{throw Error('must not read');}},{bytes:glb.MAX_BYTES+1,sha256:'0'.repeat(64)}));
});
