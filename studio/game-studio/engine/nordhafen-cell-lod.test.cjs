'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./nordhafen-cell-lod.js');
const streamerAPI=require('./nordhafen-cell-streamer.js');
const fixture=require('./nordhafen-benchmark.js').create('small',1337);
function setup(){
 const counts=new Map();
 const lod=create({near:35,far:70,hysteresis:8,buildLevel:level=>{
  const resource=kind=>({dispose(){const id=level+':'+kind;counts.set(id,(counts.get(id)||0)+1);}});
  return {meshes:[resource('mesh')],materials:[resource('material')]};
 }});
 return {lod,counts};
}
test('LOD selects full, simplified and placeholder by distance',()=>{
 const {lod}=setup();
 assert.equal(lod.update(10),'full');
 assert.equal(lod.update(55),'simplified');
 assert.equal(lod.update(95),'placeholder');
 lod.dispose();
});
test('LOD hysteresis prevents boundary oscillation',()=>{
 const {lod,counts}=setup();
 lod.update(10);
 for(let i=0;i<20;i++)assert.equal(lod.update(i%2?38:42),'full');
 assert.equal(counts.size,0);
 lod.dispose();
});
test('LOD transition disposes previous meshes and materials exactly once',()=>{
 const {lod,counts}=setup();
 lod.update(0);lod.update(55);lod.update(95);
 assert.equal(counts.get('full:mesh'),1);
 assert.equal(counts.get('full:material'),1);
 assert.equal(counts.get('simplified:mesh'),1);
 assert.equal(counts.get('simplified:material'),1);
 lod.dispose();lod.dispose();
 assert.equal(counts.get('placeholder:mesh'),1);
 assert.equal(counts.get('placeholder:material'),1);
 assert.throws(()=>lod.update(5),/disposed/);
});
test('streaming eviction during LOD transition releases every tier once',()=>{
 const counts=new Map();
 let stream,trigger=false;
 const buildCell=()=>{
  const lod=create({near:35,far:70,hysteresis:8,buildLevel:level=>{
   const mk=kind=>({dispose(){const key=level+':'+kind;counts.set(key,(counts.get(key)||0)+1);}});
   if(level==='simplified'&&trigger)stream.update(10000,10000);
   return {meshes:[mk('mesh')],materials:[mk('material')]};
  }});
  return {meshes:[],materials:[],updateLOD:d=>lod.update(d),dispose:()=>lod.dispose()};
 };
 stream=streamerAPI.create({scene:{},fixture,buildCell,loadRadius:100,unloadRadius:110,budget:1});
 stream.update(32,32);
 trigger=true;
 stream.update(90,32);
 assert.equal(stream.report().loadedCells,0);
 for(const level of ['full','simplified'])for(const kind of ['mesh','material'])
  assert.equal(counts.get(level+':'+kind),1,level+':'+kind);
 stream.dispose();stream.dispose();
 for(const count of counts.values())assert.equal(count,1);
});
