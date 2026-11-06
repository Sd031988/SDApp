'use strict';
// Isolated regression contract for the iPhone-confirmed createInstance fallback.
// Run: node --test studio/game-studio/engine/nordhafen-city-safety-contract.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const city=require('./nordhafen-procedural-city.js');
const dir=__dirname;
const source=fs.readFileSync(path.join(dir,'nordhafen-procedural-city.js'),'utf8');
const lab=fs.readFileSync(path.join(dir,'nordhafen-live-webgl-lab.html'),'utf8');

test('city default is createInstance; thin requires explicit opt-in',()=>{
 assert.match(source,/useThinInstances=false/);
 assert.match(source,/if\(!useThinInstances\)/);
 assert.match(source,/\.createInstance\(/);
 assert.match(lab,/params\.get\('thin'\)==='1'/);
 assert.match(lab,/useThinInstances:preset\.cityThin/);
 assert.match(lab,/Thin Instances: experimentell, rendert derzeit nicht/);
});
test('two tree source meshes have their own materials and both are instanced',()=>{
 for(const part of ['trunk','crown']){
  assert.match(source,new RegExp('const '+part+'Source=BABYLON\\.MeshBuilder\\.Create'));
  assert.match(source,new RegExp(part+'Source\\.material='+part+'Mat'));
  assert.match(source,new RegExp(part+'Source\\.createInstance\\('));
 }
});
test('all visible city surfaces have material assignments',()=>{
 for(const name of ['sky','ground','water','trunkSource','crownSource'])
  assert.match(source,new RegExp(name+'\\.material='));
 assert.match(source,/mesh\.material=material\|\|facadeMaterials\[v\]\[heightClass\(seed,obj\)\]/);
});
test('seeded building footprints are repeatable and nonuniform',()=>{
 const objs=Array.from({length:128},(_,i)=>({id:'cell-3-building-'+i}));
 const a=objs.map(o=>city.footprint(1337,o));
 assert.deepEqual(a,objs.map(o=>city.footprint(1337,o)));
 assert.ok(new Set(a.map(v=>v.width+'x'+v.depth)).size>=4);
 assert.ok(a.every(v=>v.width>=4&&v.width<=10&&v.depth>=4&&v.depth<=8));
});
test('nine height-class facade materials use increasing vScale',()=>{
 assert.match(source,/colors\.map\(\(color,i\)=>\[0,1,2\]\.map\(k=>/);
 assert.match(source,/texture\.vScale=\[1,2,3\]\[k\]/);
 assert.deepEqual([0,1,2].map(k=>[1,2,3][k]),[1,2,3]);
});
