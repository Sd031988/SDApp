'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),characters=require('./nordhafen-ops-characters.js');
test('six distinct CC0 roles are listed and distance LOD disables distant animation',()=>{
 assert.equal(characters.ROLES.length,6);assert.equal(new Set(characters.ASSETS).size,6);
 assert.equal(characters.animated(5),true);assert.equal(characters.animated(100),false);
});
test('container loaded once, clones released on death and on two restarts',async()=>{
 let loads=0,disposals=0,containerDisposals=0;
 const reg=characters.registry(async()=>{loads++;return {instantiateModelsToScene:()=>({dispose:()=>{disposals++;}}),dispose:()=>{containerDisposals++;}};});
 for(let run=0;run<3;run++){
  const a=await reg.spawn('ranger'),b=await reg.spawn('ranger');
  assert.equal(reg.count(),2);assert.equal(reg.release(a),true);assert.equal(reg.release(a),false);
  reg.reset();assert.equal(reg.count(),0);
 }
 assert.equal(loads,1);assert.equal(disposals,6);reg.dispose();await Promise.resolve();assert.equal(containerDisposals,1);
});
