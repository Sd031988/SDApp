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
