'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./sd-world-babylon-cells.js');
function fixture(){const disposed=[],calls=[];const mesh={dispose(){disposed.push('mesh');}};const result={meshes:[mesh],transformNodes:[],skeletons:[],animationGroups:[]};const Babylon={SceneLoader:{async ImportMeshAsync(...args){calls.push(args);return result;}}};const scene={};return {disposed,calls,result,Babylon,scene};}
test('imports local GLB and releases scene resources',async()=>{const f=fixture();const a=create({scene:f.scene,Babylon:f.Babylon,resolveCell:()=>({url:'./cells/0.glb'})});const r=await a.load('0:0');assert.equal(f.calls[0][1],'./cells/');assert.equal(f.calls[0][2],'0.glb');assert.equal(a.activeCount(),1);await a.dispose(r,'0:0');assert.deepEqual(f.disposed,['mesh']);assert.equal(a.activeCount(),0);});
test('aborted late import disposes resources',async()=>{const f=fixture();const signal=new AbortController();f.Babylon.SceneLoader.ImportMeshAsync=async()=>{signal.abort();return f.result;};const a=create({scene:f.scene,Babylon:f.Babylon,resolveCell:()=>({url:'./cells/0.glb'})});await assert.rejects(a.load('0:0',signal.signal),/aborted/);assert.deepEqual(f.disposed,['mesh']);assert.equal(a.activeCount(),0);});
test('rejects unsafe or non-GLB paths without importing',async()=>{for(const url of ['https://evil.test/a.glb','../bad.glb','./a/../bad.glb','\\bad.glb','./cells/a.glb?token=x','./cells/a%2e%2e.glb','./cells/a.gltf','./cells//a.glb','./cells/a.glb#fragment']){const f=fixture();const a=create({scene:f.scene,Babylon:f.Babylon,resolveCell:()=>({url})});await assert.rejects(a.load('0:0'),/invalid/);assert.equal(f.calls.length,0);}});
test('duplicate loaded cell is rejected before import or disposal',async()=>{const f=fixture();const a=create({scene:f.scene,Babylon:f.Babylon,resolveCell:()=>({url:'./cells/a.glb'})});const r=await a.load('0:0');await assert.rejects(a.load('0:0'),/duplicate/);assert.equal(a.activeCount(),1);assert.equal(f.calls.length,1);assert.deepEqual(f.disposed,[]);await a.dispose(r,'0:0');assert.deepEqual(f.disposed,['mesh']);});
test('concurrent duplicate cell request does not import twice',async()=>{const f=fixture();let finish;f.Babylon.SceneLoader.ImportMeshAsync=()=>new Promise(resolve=>{finish=resolve;f.calls.push('import');});const a=create({scene:f.scene,Babylon:f.Babylon,resolveCell:()=>({url:'./cells/a.glb'})});const first=a.load('0:0');assert.equal(a.pendingCount(),1);await assert.rejects(a.load('0:0'),/duplicate/);assert.equal(f.calls.length,1);finish(f.result);const r=await first;assert.equal(a.pendingCount(),0);await a.dispose(r,'0:0');assert.equal(a.activeCount(),0);});
test('stale dispose cannot release currently owned cell',async()=>{const f=fixture();const a=create({scene:f.scene,Babylon:f.Babylon,resolveCell:()=>({url:'./cells/a.glb'})});const r=await a.load('0:0');await a.dispose({meshes:[]},'0:0');assert.equal(a.activeCount(),1);assert.deepEqual(f.disposed,[]);await a.dispose(r,'0:0');assert.deepEqual(f.disposed,['mesh']);});

test('cell eviction never force-disposes a shared Babylon material',async()=>{
 const calls=[];
 const sharedMaterial={dispose(){calls.push('shared-material-disposed');}};
 const mesh={material:sharedMaterial,dispose(doNotRecurse,disposeMaterialAndTextures){calls.push(['mesh',doNotRecurse,disposeMaterialAndTextures]);if(disposeMaterialAndTextures)sharedMaterial.dispose();}};
 const result={meshes:[mesh],transformNodes:[],skeletons:[],animationGroups:[]};
 const scene={},Babylon={SceneLoader:{async ImportMeshAsync(){return result;}}};
 const adapter=create({scene,Babylon,resolveCell:()=>({url:'./cells/shared.glb'})});
 const loaded=await adapter.load('cell-a');
 await adapter.dispose(loaded,'cell-a');
 assert.deepEqual(calls,[['mesh',false,false]]);
 assert.equal(adapter.activeCount(),0);
});
test('aborted late cell import preserves shared Babylon material',async()=>{
 const calls=[],controller=new AbortController();
 const sharedMaterial={dispose(){calls.push('shared-material-disposed');}};
 const result={meshes:[{dispose(_recurse,force){calls.push('mesh');if(force)sharedMaterial.dispose();}}],transformNodes:[],skeletons:[],animationGroups:[]};
 const scene={},Babylon={SceneLoader:{async ImportMeshAsync(){controller.abort();return result;}}};
 const adapter=create({scene,Babylon,resolveCell:()=>({url:'./cells/shared.glb'})});
 await assert.rejects(adapter.load('cell-a',controller.signal),/aborted/);
 assert.deepEqual(calls,['mesh']);
 assert.equal(adapter.activeCount(),0);
});


test('failed cell eviction retains ownership for a retry',async()=>{
 let attempts=0;
 const mesh={dispose(){if(++attempts===1)throw new Error('GPU release failed');}};
 const result={meshes:[mesh],transformNodes:[],skeletons:[],animationGroups:[]};
 const adapter=create({scene:{},Babylon:{SceneLoader:{async ImportMeshAsync(){return result;}}},resolveCell:()=>({url:'./cells/retry.glb'})});
 const resource=await adapter.load('retry');
 await assert.rejects(adapter.dispose(resource,'retry'),/GPU release failed/);
 assert.equal(adapter.activeCount(),1);
 await assert.rejects(adapter.load('retry'),/duplicate/);
 await adapter.dispose(resource,'retry');
 assert.equal(attempts,2);
 assert.equal(adapter.activeCount(),0);
});
test('throwing disposal error observer cannot hide original failure',async()=>{
 const mesh={dispose(){throw new Error('dispose root cause');}};
 const result={meshes:[mesh],transformNodes:[],skeletons:[],animationGroups:[]};
 let notified=0;
 const adapter=create({scene:{},Babylon:{SceneLoader:{async ImportMeshAsync(){return result;}}},resolveCell:()=>({url:'./cells/retry.glb'}),onError(){notified++;throw new Error('observer failed');}});
 const resource=await adapter.load('retry');
 await assert.rejects(adapter.dispose(resource,'retry'),/dispose root cause/);
 assert.equal(notified,1);
 assert.equal(adapter.activeCount(),1);
});
