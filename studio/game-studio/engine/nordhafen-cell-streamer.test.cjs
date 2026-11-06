'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./nordhafen-cell-streamer.js');
const fixture=require('./nordhafen-benchmark.js').create('small',1337);
function harness(options={}){
 const counts=new Map();
 let time=0;
 const buildCell=options.buildCell||(c=>{
  const mk=id=>({dispose(){counts.set(id,(counts.get(id)||0)+1);}});
  return {meshes:[mk(c.id+':mesh')],materials:[mk(c.id+':material')]};
 });
 const stream=create({scene:{},fixture,buildCell,loadRadius:45,unloadRadius:95,
  now:()=>++time,...options});
 return {stream,counts};
}
test('16 cells: deterministic route eventually loads every cell',()=>{
 const seen=new Set();
 const {stream}=harness({buildCell:c=>{seen.add(c.id);return {meshes:[],materials:[]};}});
 for(const c of fixture.chunks)stream.update((c.x+.5)*64,(c.z+.5)*64);
 assert.equal(seen.size,16);
 assert.equal(stream.report().loadsTotal,16);
 stream.dispose();
});
test('hysteresis prevents load/unload flapping at boundary',()=>{
 const {stream}=harness();
 stream.update(32,32);
 stream.update(32+50,32); // erste Annäherung, Nachbar darf laden
 const loadsAfter=stream.report().loadsTotal;
 for(let i=0;i<12;i++)stream.update(i%2?32+55:32+50,32);
 assert.equal(stream.report().loadsTotal,loadsAfter); // kein erneutes Laden
 assert.equal(stream.report().unloadsTotal,0); // kein Entladen = kein Flackern
 stream.dispose();
});
test('budget never loads more than N per update',()=>{
 const {stream}=harness({loadRadius:300,unloadRadius:350,budget:2});
 for(let i=0;i<8;i++)assert.ok(stream.update(128,128).newLoads<=2);
 assert.equal(stream.report().loadsTotal,16);
 stream.dispose();
});
test('unload releases meshes and cell-owned materials exactly once',()=>{
 const {stream,counts}=harness();
 stream.update(32,32);stream.update(10000,10000);stream.update(10000,10000);
 assert.equal(counts.get('chunk-0-0:mesh'),1);
 assert.equal(counts.get('chunk-0-0:material'),1);
 stream.dispose();
 assert.equal(counts.get('chunk-0-0:mesh'),1);
});
test('failed build is not counted; unrelated cell stays loaded',()=>{
 const {stream}=harness({loadRadius:110,unloadRadius:130,
  buildCell:c=>{if(c.id==='chunk-1-0')throw Error('fixture failure');return {meshes:[],materials:[]};}});
 stream.update(32,32);
 assert.ok(stream.report().loadedCells>=1);
 assert.ok(stream.report().loadsTotal>=1);
 assert.ok(stream.report().loadsTotal<4);
 stream.dispose();
});
test('dispose frees resources and is idempotent; update rejects after dispose',()=>{
 const {stream,counts}=harness();
 stream.update(32,32);stream.dispose();stream.dispose();
 assert.equal(counts.get('chunk-0-0:mesh'),1);
 assert.equal(stream.report().loadedCells,0);
 assert.throws(()=>stream.update(32,32),/disposed/);
});
test('invalid hysteresis is rejected',()=>{
 assert.throws(()=>create({scene:{},fixture,buildCell:()=>({meshes:[],materials:[]}),loadRadius:40,unloadRadius:40}),TypeError);
});

test('persistent build failure is retried at most once during ten rapid updates',()=>{
 let time=0,attempts=0;
 const {stream}=harness({now:()=>time,buildCell:()=>{attempts++;throw Error('unavailable');}});
 for(let i=0;i<10;i++)stream.update(32,32);
 assert.equal(attempts,1);
 assert.equal(stream.report().failedCells,1);
 stream.dispose();
});
test('failed cell retries exactly once after backoff expires',()=>{
 let time=0,attempts=0;
 const {stream}=harness({now:()=>time,buildCell:()=>{attempts++;throw Error('unavailable');}});
 stream.update(32,32);
 time=999;stream.update(32,32);assert.equal(attempts,1);
 time=1000;stream.update(32,32);assert.equal(attempts,2);
 stream.update(32,32);assert.equal(attempts,2);
 stream.dispose();
});
test('report exposes unloadedCells and failedCells but no pendingCells',()=>{
 const {stream}=harness();
 const r=stream.report();
 assert.equal(r.unloadedCells,16);
 assert.equal(r.failedCells,0);
 assert.equal(Object.hasOwn(r,'pendingCells'),false);
 stream.dispose();
});

function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('async Promise cell resolves and records actual load duration',async()=>{
 let now=10;const d=deferred(),{stream}=harness({now:()=>now,buildCell:()=>d.promise});
 stream.update(32,32);assert.equal(stream.report().inFlightLoads,1);
 now=42;d.resolve({meshes:[],materials:[]});await tick();
 assert.equal(stream.report().loadedCells,1);
 assert.equal(stream.report().loadMsP50,32);stream.dispose();
});
test('camera departure aborts pending load and disposes late result without visibility',async()=>{
 const d=deferred();let freed=0,signal;
 const {stream}=harness({buildCell:(chunk,opts)=>{signal=opts.signal;return d.promise;}});
 stream.update(32,32);stream.update(10000,10000);
 assert.equal(signal.aborted,true);
 d.resolve({meshes:[{dispose(){freed++;}}],materials:[]});await tick();
 assert.equal(freed,1);assert.equal(stream.report().loadedCells,0);stream.dispose();
});
test('no more than two asynchronous builds in flight',async()=>{
 const ds=[];const {stream}=harness({loadRadius:300,unloadRadius:350,buildCell:()=>{
  const d=deferred();ds.push(d);return d.promise;
 }});
 for(let i=0;i<5;i++)stream.update(128,128);
 assert.equal(ds.length,2);assert.equal(stream.report().inFlightLoads,2);
 for(const d of ds)d.resolve({meshes:[],materials:[]});await tick();stream.dispose();
});
test('failed async cell leaves independent successful cells loaded',async()=>{
 const ds=new Map();const {stream}=harness({loadRadius:110,unloadRadius:130,buildCell:chunk=>{
  const d=deferred();ds.set(chunk.id,d);return d.promise;
 }});
 stream.update(32,32);
 assert.ok(ds.size>=1);
 const entries=[...ds.entries()];
 entries[0][1].reject(new Error('network'));
 for(const [,d] of entries.slice(1))d.resolve({meshes:[],materials:[]});
 await tick();
 assert.equal(stream.report().failedCells,1);
 if(entries.length>1)assert.ok(stream.report().loadedCells>=1);
 stream.dispose();
});
test('dispose aborts pending loads and frees late result once',async()=>{
 const d=deferred();let freed=0,signal;
 const {stream}=harness({buildCell:(chunk,opts)=>{signal=opts.signal;return d.promise;}});
 stream.update(32,32);stream.dispose();stream.dispose();
 assert.equal(signal.aborted,true);
 d.resolve({meshes:[{dispose(){freed++;}}],materials:[]});await tick();
 assert.equal(freed,1);assert.equal(stream.report().loadedCells,0);
});

test('streamer reports maximum measured build slice from cooperative builder',async()=>{
 const {stream}=harness({buildCell:(chunk,{recordBuildSlice})=>{
  recordBuildSlice(3.5);recordBuildSlice(2.25);
  return Promise.resolve({meshes:[],materials:[]});
 }});
 stream.update(32,32);await tick();
 assert.equal(stream.report().maxBuildSliceMs,3.5);
 stream.dispose();
});
