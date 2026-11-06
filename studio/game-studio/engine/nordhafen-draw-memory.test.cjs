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
 assert.match(html,/streamer\.update\(camera\.position\.x,camera\.position\.z\)/);
 assert.match(html,/routeTimer=setInterval\(moveRoute,500\)/);
 assert.match(html,/Ohne Streaming/);
 assert.match(html,/Streaming \+ LOD/);
 assert.match(html,/nicht verfügbar/);
});

test('lab does not emit literal backslash-n in comparison display',()=>{
 const html=fs.readFileSync(path.join(__dirname,'nordhafen-live-webgl-lab.html'),'utf8');
 assert.equal(html.includes(String.raw`\\n`),false);
});
test('summarize computes p50 p95 max and ignores null observations',()=>{
 const {summarize}=require('./nordhafen-draw-memory.js');
 const data=[{drawCalls:1,heapBytes:10},{drawCalls:null,heapBytes:null},
  {drawCalls:3,heapBytes:30},{drawCalls:5,heapBytes:50},
  {drawCalls:7,heapBytes:70},{drawCalls:9,heapBytes:90}];
 const s=summarize(data,{complete:true});
 assert.equal(s.drawCallsP50,5);
 assert.equal(s.drawCallsP95,8.6);
 assert.equal(s.drawCallsMax,9);
 assert.equal(s.heapP50,50);
 assert.equal(s.heapMax,90);
 assert.equal(s.samples,5);
 assert.equal(s.complete,true);
});
test('summarize without valid values returns null metrics, never zero',()=>{
 const {summarize}=require('./nordhafen-draw-memory.js');
 const s=summarize([{drawCalls:null,heapBytes:null},{drawCalls:NaN,heapBytes:undefined}],{complete:true});
 for(const key of ['drawCallsP50','drawCallsP95','drawCallsMax','heapP50','heapMax'])
  assert.equal(s[key],null,key);
 assert.equal(s.samples,0);
});
test('incomplete route never produces a completed comparison',()=>{
 const {summarize}=require('./nordhafen-draw-memory.js');
 const s=summarize([{drawCalls:7,heapBytes:200}],{complete:false});
 assert.equal(s.complete,false);
 const html=fs.readFileSync(path.join(__dirname,'nordhafen-live-webgl-lab.html'),'utf8');
 assert.match(html,/runRouteLength=route\.length/);
 assert.match(html,/routeIndex===runRouteLength/);
 assert.match(html,/Lauf ungültig:/);
 assert.match(html,/summary:window\.SDNordhafenDrawMemory\.summarize\(runSamples,\{complete:true\}\)/);
 assert.match(html,/if\(!verdict\.valid\)runFailure/);
});
