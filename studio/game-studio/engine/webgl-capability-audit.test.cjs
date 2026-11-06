const test=require('node:test');
const assert=require('node:assert/strict');
const {inspect}=require('./webgl-capability-audit.js');
function context({v2=false,extensions=[],fail=false}={}){
 const gl={
  MAX_TEXTURE_SIZE:1,MAX_RENDERBUFFER_SIZE:2,MAX_VERTEX_ATTRIBS:3,
  getParameter(k){if(fail)throw Error('context lost');return ({1:4096,2:2048,3:16})[k];},
  getExtension(k){if(fail)throw Error('context lost');return extensions.includes(k)?{}:null;}
 };
 if(v2){gl.texStorage3D=()=>{};gl.drawBuffers=()=>{};}
 return gl;
}
test('WebGL1 reports actual queried limits and optional extensions',()=>{
 const r=inspect(context({extensions:['ANGLE_instanced_arrays','OES_element_index_uint']}));
 assert.equal(r.context,'webgl1');assert.equal(r.maxTextureSize,4096);
 assert.equal(r.instancing,true);assert.equal(r.uintIndices,true);
 assert.equal(r.gpuTimerExtension,false);
});
test('WebGL2 capabilities do not imply a measured GPU time',()=>{
 const r=inspect(context({v2:true,extensions:['EXT_disjoint_timer_query_webgl2']}));
 assert.equal(r.context,'webgl2');assert.equal(r.instancing,true);
 assert.equal(r.gpuTimerExtension,true);assert.equal(r.gpuTimeMeasured,false);
 assert.equal(r.fpsMeasured,false);
});
test('lost context is reported conservatively',()=>{
 const r=inspect(context({fail:true}));
 assert.equal(r.maxTextureSize,null);assert.equal(r.instancing,false);
 assert.equal(r.gpuTimerExtension,false);
});
test('invalid context is rejected without mutating renderer',()=>{
 assert.throws(()=>inspect(null),TypeError);
 assert.throws(()=>inspect({getParameter(){}}),TypeError);
 const gl=context();const before=Object.keys(gl);
 inspect(gl);assert.deepEqual(Object.keys(gl),before);
});
