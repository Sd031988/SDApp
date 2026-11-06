'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('./nordhafen-thin-instances.js');
function fixture(thin=true){
 const made=[],buffers=[];
 function source(type){
  return {thinInstanceSetBuffer:thin?()=>{}:undefined,
   clone(name){const mesh={name,isVisible:false,disposeCount:0,
    thinInstanceSetBuffer(key,buffer,stride){buffers.push({key,buffer,stride,type});},
    dispose(){this.disposeCount++;}};made.push(mesh);return mesh;},
   createInstance(id){const mesh={id,position:{set(...v){this.value=v;}},scaling:{set(...v){this.value=v;}},disposeCount:0,dispose(){this.disposeCount++;}};made.push(mesh);return mesh;}};
 }
 const BABYLON={Vector3:class{constructor(x,y,z){this.values=[x,y,z];}},Quaternion:{Identity(){return {};}},
  Matrix:{Compose(scale,rotation,pos){return {copyToArray(target,index){
   const [x,y,z]=scale.values,[px,py,pz]=pos.values;
   target.set([x,0,0,0,0,y,0,0,0,0,z,0,px,py,pz,1],index);
  }};}}};
 const chunk={id:'c',x:2,z:3,objects:[
  {id:'b1',type:'building',x:1,z:2},{id:'b2',type:'building',x:5,z:7},
  {id:'t1',type:'vegetation',x:8,z:9}]};
 return {made,buffers,BABYLON,chunk,sourceByType:{building:source('building'),vegetation:source('vegetation')}};
}
test('q: thin matrices preserve original fixture positions and scales',()=>{
 const f=fixture(),r=create({...f});assert.equal(r.mode,'thin');
 assert.deepEqual(Array.from(f.buffers[0].buffer.slice(0,16)),[4,0,0,0,0,6,0,0,0,0,4,0,129,3,194,1]);
 assert.deepEqual(Array.from(f.buffers[1].buffer.slice(0,16)),[1,0,0,0,0,3,0,0,0,0,1,0,136,1.5,201,1]);
 r.dispose();
});
test('r: thin mesh count equals object types, not object count',()=>{
 const f=fixture(),r=create({...f});
 assert.equal(r.meshCount,2);assert.equal(r.instanceCount,3);assert.equal(f.buffers.length,2);r.dispose();
});
test('s: mesh and owned matrix buffer released once by Babylon mesh.dispose',()=>{
 const f=fixture(),r=create({...f});r.dispose();r.dispose();
 assert.deepEqual(f.made.map(m=>m.disposeCount),[1,1]);
});
test('t: absent thin-instance API uses createInstance fallback',()=>{
 const f=fixture(false),r=create({...f});assert.equal(r.mode,'fallback');
 assert.equal(r.meshCount,3);assert.equal(f.buffers.length,0);r.dispose();
 assert.deepEqual(f.made.map(m=>m.disposeCount),[1,1,1]);
});

test('v: refresh thin-instance bounding info once per mesh after matrix upload',()=>{
 const f=fixture(),calls=[];
 for(const source of Object.values(f.sourceByType)){
  const original=source.clone;
  source.clone=function(name){
   const mesh=original.call(this,name);
   const setBuffer=mesh.thinInstanceSetBuffer;
   mesh.thinInstanceSetBuffer=function(...args){
    calls.push([name,'buffer']);
    return setBuffer.apply(this,args);
   };
   mesh.thinInstanceRefreshBoundingInfo=function(force){
    calls.push([name,'refresh',force]);
   };
   return mesh;
  };
 }
 const r=create({...f});
 assert.equal(r.meshCount,2);
 for(const mesh of f.made){
  assert.deepEqual(calls.filter(entry=>entry[0]===mesh.name),[
   [mesh.name,'buffer'],[mesh.name,'refresh',false]
  ]);
 }
 r.dispose();
});
