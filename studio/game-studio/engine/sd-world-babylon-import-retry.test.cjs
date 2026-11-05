'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./sd-world-babylon-cells.js');

test('failed GLB import clears pending ownership and permits retry without touching another cell',async()=>{
 const calls=[],disposed=[];let attempts=0;
 const Babylon={SceneLoader:{async ImportMeshAsync(_meshes,root,name){
  calls.push(root+name);
  if(name==='broken.glb'&&++attempts===1)throw new Error('decoder failed');
  return {meshes:[{dispose(){disposed.push(name);}}],transformNodes:[],skeletons:[],animationGroups:[]};
 }}};
 const adapter=create({scene:{},Babylon,resolveCell:id=>({url:'./cells/'+id+'.glb'})});
 const stable=await adapter.load('stable');
 await assert.rejects(adapter.load('broken'),/decoder failed/);
 assert.equal(adapter.pendingCount(),0,'failed import must release pending slot');
 assert.equal(adapter.activeCount(),1,'failed import must not evict unrelated cells');
 const recovered=await adapter.load('broken');
 assert.equal(adapter.activeCount(),2);
 assert.deepEqual(calls,['./cells/stable.glb','./cells/broken.glb','./cells/broken.glb']);
 await adapter.dispose(recovered,'broken');
 await adapter.dispose(stable,'stable');
 assert.deepEqual(disposed,['broken.glb','stable.glb']);
 assert.equal(adapter.activeCount(),0);
});

test('a failed import does not block a later import of the same cell',async()=>{
 let rejectImport,started=0;
 const Babylon={SceneLoader:{ImportMeshAsync(){
  started++;
  if(started===1)return new Promise((_resolve,reject)=>{rejectImport=reject;});
  return Promise.resolve({meshes:[],transformNodes:[],skeletons:[],animationGroups:[]});
 }}};
 const adapter=create({scene:{},Babylon,resolveCell:()=>({url:'./cells/retry.glb'})});
 const first=adapter.load('retry');
 assert.equal(adapter.pendingCount(),1);
 await assert.rejects(adapter.load('retry'),/duplicate/);
 rejectImport(new Error('network interrupted'));
 await assert.rejects(first,/network interrupted/);
 assert.equal(adapter.pendingCount(),0);
 const resource=await adapter.load('retry');
 assert.equal(started,2);
 await adapter.dispose(resource,'retry');
 assert.equal(adapter.activeCount(),0);
});
