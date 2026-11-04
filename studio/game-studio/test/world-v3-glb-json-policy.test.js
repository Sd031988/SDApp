'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateGLBJSON}=require('../world-v3-glb-json-policy.js');
function glb(obj,bin=0){
 const bytes=Buffer.from(JSON.stringify(obj),'utf8');
 const padded=Math.ceil(bytes.length/4)*4;
 const total=20+padded+(bin?8+bin:0);
 const b=Buffer.alloc(total);
 b.write('glTF',0);b.writeUInt32LE(2,4);b.writeUInt32LE(total,8);
 b.writeUInt32LE(padded,12);b.write('JSON',16);bytes.copy(b,20);
 b.fill(0x20,20+bytes.length,20+padded);
 if(bin){b.writeUInt32LE(bin,20+padded);b.write('BIN\\0',24+padded);}
 return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
}
test('accepts embedded glTF 2.0 JSON and BIN only',()=>{
 const result=validateGLBJSON(glb({asset:{version:'2.0'},buffers:[{byteLength:4}]},4));
 assert.equal(result.binByteLength,4);
 assert.ok(Object.isFrozen(result));
});
test('rejects external and data URI references',()=>{
 for(const uri of ['https://evil.example/model.bin','../secret.bin','data:application/octet-stream;base64,AAAA']){
  assert.throws(()=>validateGLBJSON(glb({asset:{version:'2.0'},buffers:[{byteLength:0,uri}]})));
  assert.throws(()=>validateGLBJSON(glb({asset:{version:'2.0'},images:[{uri}]})));
 }
});
test('rejects unsupported extensions, invalid asset and missing BIN',()=>{
 assert.throws(()=>validateGLBJSON(glb({asset:{version:'1.0'}})));
 assert.throws(()=>validateGLBJSON(glb({asset:{version:'2.0'},extensionsRequired:['KHR_draco_mesh_compression']})));
 assert.throws(()=>validateGLBJSON(glb({asset:{version:'2.0'},buffers:[{byteLength:8}]})));
});
test('rejects prototype keys and excessive nesting without mutating inputs',()=>{
 assert.throws(()=>validateGLBJSON(glb(JSON.parse('{"asset":{"version":"2.0"},"__proto__":{}}'))));
 const nested={asset:{version:'2.0'}};let n=nested;
 for(let i=0;i<45;i++){n.child={};n=n.child;}
 assert.throws(()=>validateGLBJSON(glb(nested)));
});
test('rejects damaged GLB headers and leaves byte arrays intact',()=>{
 const valid=glb({asset:{version:'2.0'}});
 const bytes=new Uint8Array(valid);const snapshot=Uint8Array.from(bytes);
 assert.equal(validateGLBJSON(valid).bufferCount,0);
 assert.deepEqual(bytes,snapshot);
 bytes[0]=0;
 assert.throws(()=>validateGLBJSON(valid));
});
