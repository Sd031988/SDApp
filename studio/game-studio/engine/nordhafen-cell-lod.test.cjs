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
 const buildCell=chunk=>{
  if(chunk.id!=='chunk-0-0')return {meshes:[],materials:[]};
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
 assert.ok(stream.report().loadedCells<=1); // another nearby cell may load after eviction
 for(const level of ['full','simplified'])for(const kind of ['mesh','material'])
  assert.equal(counts.get(level+':'+kind),1,level+':'+kind);
 stream.dispose();stream.dispose();
 for(const count of counts.values())assert.equal(count,1);
});

test('lab streaming radius exceeds far LOD threshold',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const html=fs.readFileSync(path.join(__dirname,'nordhafen-live-webgl-lab.html'),'utf8');
 const lod=html.match(/SDNordhafenCellLOD\.create\(\{near:(\d+),far:(\d+),hysteresis:(\d+)/);
 const stream=html.match(/buildCell:cellBuilder,loadRadius:(\d+),unloadRadius:(\d+),budget:(\d+),lodBudget:(\d+)/);
 assert.ok(lod&&stream,'LOD and streaming config must be explicit');
 assert.ok(Number(stream[1])>Number(lod[2]),'distant placeholder cells must be loadable');
 assert.ok(Number(stream[2])>Number(stream[1]));
 assert.equal(Number(stream[4]),2);
});
test('failed LOD switch keeps old level visible while other cells update',()=>{
 const f={chunkSize:10,chunks:[{id:'a',x:0,z:0},{id:'b',x:1,z:0}]};
 const lods=new Map(),disposed=[];
 const stream=streamerAPI.create({scene:{},fixture:f,loadRadius:1000,unloadRadius:2000,
  buildCell:c=>{
   const lod=create({near:100,far:200,hysteresis:8,buildLevel:level=>{
    if(c.id==='a'&&level==='placeholder')throw Error('broken LOD');
    return {meshes:[{dispose(){disposed.push(c.id+':'+level);}}],materials:[]};
   }});
   lods.set(c.id,lod);
   return {meshes:[],materials:[],updateLOD:d=>lod.update(d),
    needsLODUpdate:d=>lod.needsUpdate(d),lodLevel:()=>lod.level,dispose:()=>lod.dispose()};
  }});
 stream.update(5,5);
 stream.update(300,5);
 assert.equal(lods.get('a').level,'full');
 assert.equal(lods.get('b').level,'placeholder');
 assert.equal(stream.report().lodFailures,1);
 assert.ok(!disposed.includes('a:full'));
 stream.dispose();
 assert.equal(disposed.filter(x=>x==='a:full').length,1);
});
test('ten simultaneous LOD transitions respect nearest-first budget two',()=>{
 const f={chunkSize:10,chunks:Array.from({length:10},(_,x)=>({id:'cell-'+x,x,z:0}))};
 const lods=new Map();
 const stream=streamerAPI.create({scene:{},fixture:f,loadRadius:2000,unloadRadius:2100,budget:2,lodBudget:2,
  buildCell:c=>{
   const lod=create({near:150,far:300,hysteresis:8,
    buildLevel:()=>({meshes:[],materials:[]})});
   lods.set(c.id,lod);
   return {meshes:[],materials:[],updateLOD:d=>lod.update(d),
    needsLODUpdate:d=>lod.needsUpdate(d),lodLevel:()=>lod.level,dispose:()=>lod.dispose()};
  }});
 for(let i=0;i<5;i++)stream.update(5,5);
 assert.equal(stream.report().loadedCells,10);
 const before=stream.report().lodSwitchesTotal;
 for(let i=1;i<=5;i++){
  stream.update(1000,5);
  assert.equal(stream.report().lodSwitchesTotal-before,i*2);
 }
 assert.equal([...lods.values()].filter(l=>l.level==='placeholder').length,10);
 stream.dispose();
});
