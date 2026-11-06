'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {create}=require('./nordhafen-draw-memory.js');
const streamer=require('./nordhafen-cell-streamer.js');
test('missing instrumentation and performance.memory are unavailable, never guessed',()=>{
 const probe=create({scene:{},performanceAPI:{}});
 assert.deepEqual(probe.read(),{drawCalls:null,heapBytes:null});
 probe.dispose();assert.throws(()=>probe.read(),/disposed/);
});
test('heap reading uses only genuine exposed usedJSHeapSize',()=>{
 const probe=create({performanceAPI:{memory:{usedJSHeapSize:123456}}});
 assert.equal(probe.read().heapBytes,123456);
 assert.equal(probe.read().drawCalls,null);
 probe.dispose();
});
test('LOD without needsLODUpdate consumes budget only when level changes',()=>{
 const fixture={chunkSize:10,chunks:Array.from({length:3},(_,x)=>({id:'c'+x,x,z:0}))};
 const levels=new Map();
 const stream=streamer.create({scene:{},fixture,loadRadius:1000,unloadRadius:2000,budget:3,lodBudget:2,
  buildCell:c=>{
   levels.set(c.id,'full');
   return {meshes:[],materials:[],lodLevel:()=>levels.get(c.id),
    updateLOD:d=>{if(d>100)levels.set(c.id,'placeholder');return levels.get(c.id);}};
  }});
 stream.update(5,5);
 const start=stream.report().lodSwitchesTotal;
 stream.update(5,5);
 assert.equal(stream.report().lodSwitchesTotal,start);
 stream.update(500,5);
 assert.equal(stream.report().lodSwitchesTotal-start,2);
 stream.update(500,5);
 assert.equal(stream.report().lodSwitchesTotal-start,3);
 stream.dispose();
});
test('lab uses same deterministic camera route for streaming and baseline and shows unavailable',()=>{
 const html=fs.readFileSync(path.join(__dirname,'nordhafen-live-webgl-lab.html'),'utf8');
 assert.match(html,/function moveRoute\(\)/);
 assert.match(html,/if\(streamer\)streamer\.update\(x,z\)/);
 assert.match(html,/routeTimer=setInterval\(moveRoute,500\)/);
 assert.match(html,/Ohne Streaming/);
 assert.match(html,/Streaming \+ LOD/);
 assert.match(html,/nicht verfügbar/);
});
