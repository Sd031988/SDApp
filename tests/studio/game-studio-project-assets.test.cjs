'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../../studio/game-studio/scene-core.js');
const project=require('../../studio/game-studio/project-assets.js');
const {makeGLB}=require('./glb-fixture.cjs');

test('Alte Version-1-Projekte bleiben ohne Umwandlung bitgleich exportierbar',()=>{
const old=core.fresh(),source=core.serialize(old);
assert.equal(project.PROJECT_VERSION,2);
assert.equal(project.serialize(old),source);
assert.deepEqual(project.parse(source),old);
const history=project.history(old);
core.add(old,'box');
assert.equal(history.record(old),true);
assert.equal(history.undo().version,1);
assert.equal(history.redo().version,1);
});
test('Import von GLB erzeugt v2-Projekt mit einem gespeicherten und zwei wiederverwendbaren Objekten',()=>{
const scene=core.fresh(),raw=makeGLB();
const first=project.addModel(scene,raw,'model.glb',3,4);
assert.equal(scene.version,2);
assert.equal(scene.objects.length,7);
assert.equal(first.type,'model');
assert.equal(scene.assets.length,1);
assert.equal(first.assetId,scene.assets[0].id);
const second=project.addModel(scene,raw,'copy.glb',-1,-2);
assert.equal(second.assetId,first.assetId);
assert.equal(scene.assets.length,1);
const saved=project.serialize(scene),loaded=project.parse(saved);
assert.deepEqual(loaded,scene);
assert.equal(loaded.objects[6].x,3);
assert.equal(loaded.objects[7].z,-2);
assert(saved.length>1000);
const moved=core.update(scene,first.id,{x:6,scale:1.7,color:'#5ebbb0'});
assert.equal(moved.assetId,first.assetId);
const clone=project.duplicate(scene,first.id);
assert.notEqual(clone.id,first.id);
assert.equal(clone.assetId,first.assetId);
core.remove(scene,first.id);
assert.equal(project.parse(project.serialize(scene)).objects.some(o=>o.id===first.id),false);
});
test('Undo/Redo teilen sich große Assets und erhalten Asset-Versionen beim Branchwechsel',()=>{
const scene=core.fresh(),history=project.history(scene);
project.addModel(scene,makeGLB(),'first.glb',0,0);
assert(history.record(scene));
assert.equal(history.undo().version,1);
assert.equal(history.redo().assets.length,1);
const firstId=scene.assets[0].id;
const previous=history.undo();
assert.equal(previous.version,1);
project.addModel(previous,makeGLB(d=>{d.nodes[0].translation=[4,2,1];}),'second.glb',1,1);
assert.equal(previous.assets[0].id,firstId,'Neue Branche darf dieselbe lokale ID nutzen');
assert(history.record(previous));
assert.equal(history.canRedo,false);
assert.equal(project.parse(project.serialize(history.undo())).version,1);
const restored=history.redo();
assert.equal(restored.assets[0].name,'second.glb');
assert.deepEqual(project.parse(project.serialize(restored)),restored);
});
test('Importfehler und Größenlimits ändern Originalprojekt nicht',()=>{
const scene=core.fresh(),saved=project.serialize(scene);
for(const bad of [
[Buffer.alloc(24),'invalid.glb'],
[makeGLB(),''],
[makeGLB(),'fine.glb',99,0]
]){
assert.throws(()=>project.addModel(scene,...bad),/GLB-Import:|Projektformat:/);
assert.equal(project.serialize(scene),saved);
}
const model=project.addModel(scene,makeGLB(),'valid.glb');
const after=project.serialize(scene);
const invalid=JSON.parse(after);
invalid.objects.find(o=>o.id===model.id).assetId='asset-999';
assert.throws(()=>project.parse(JSON.stringify(invalid)),/Modellinstanz/);
invalid.objects.find(o=>o.id===model.id).assetId=scene.assets[0].id;
invalid.assets[0].base64='AA==';
assert.throws(()=>project.parse(JSON.stringify(invalid)),/GLB|Asset-/);
assert.deepEqual(project.parse(after),scene);
assert.throws(()=>project.parse('x'.repeat(project.MAX_CHARS+1)),/zu groß/);
});
test('v2-Objektlimit, doppelte IDs, fehlerhafte Assets und unbekannte Modelle werden zurückgewiesen',()=>{
const scene=core.fresh();
project.addModel(scene,makeGLB(),'test.glb');
const data=JSON.parse(project.serialize(scene));
assert.throws(()=>project.validate({...data,assets:[data.assets[0],data.assets[0]]}),/doppelte/);
assert.throws(()=>project.validate({...data,objects:[...data.objects,data.objects[0]]}),/doppelte/);
assert.throws(()=>project.validate({...data,objects:[...data.objects,{id:99,type:'model',assetId:'bad',x:0,z:0,scale:1,color:'#d7a35c'}]}),/Modellinstanz/);
assert.throws(()=>project.validate({...data,objects:[...data.objects,{id:100,type:'model',assetId:'asset-1',x:100,z:0,scale:1,color:'#d7a35c'}]}),/Modellinstanz/);
assert.throws(()=>project.validate({...data,version:9}),/Ungültiges/);
while(scene.objects.length<core.LIMIT)core.add(scene,'box');
const snap=project.serialize(scene);
assert.throws(()=>project.addModel(scene,makeGLB(),'test.glb'),/Maximal/);
assert.equal(project.serialize(scene),snap);
});

test('Große 3D-Projekte geben nicht mehr erreichbare GLB-Verlaufsversionen frei',()=>{
const original=core.fresh(),history=project.history(original,5);
let scene=original;
const sources=new Map();
for(let i=1;i<=35;i++){
scene=core.fresh();
const buffer=makeGLB(data=>{data.nodes[0].translation=[i,1,3];});
sources.set(i,buffer);
project.addModel(scene,buffer,'asset-'+i+'.glb',0,0);
assert.equal(history.record(scene),true);
assert.equal(history.retainedSnapshots,Math.min(5,i+1));
assert(history.retainedAssetVersions<=5,'Verwaiste GLB-Kopien dürfen sich nicht endlos sammeln.');
}
assert.equal(history.retainedSnapshots,5);
assert.equal(history.retainedAssetVersions,5);
const old=history.undo();
assert.equal(old.assets[0].name,'asset-34.glb');
assert.deepEqual(project.parse(project.serialize(old)),old);
assert.equal(history.redo().assets[0].name,'asset-35.glb');
const previous=history.undo();
assert.equal(previous.assets[0].name,'asset-34.glb');
const replacement=core.fresh();
project.addModel(replacement,makeGLB(data=>{data.nodes[0].translation=[100,2,4];}),'branch-model.glb',0,0);
assert.equal(history.record(replacement),true);
assert.equal(history.canRedo,false);
assert.equal(history.retainedAssetVersions,5);
assert.equal(history.undo().assets[0].name,'asset-34.glb');
assert.equal(history.redo().assets[0].name,'branch-model.glb');
history.reset(core.fresh());
assert.equal(history.retainedAssetVersions,0);
assert.equal(history.retainedSnapshots,1);
});
test('Undo/Redo bewahrt mehrere Modelle und Asset-Referenzen nach Kompaktierung',()=>{
let scene=core.fresh();const history=project.history(scene,4);
project.addModel(scene,makeGLB(),'original.glb',1,1);
const a=project.serialize(scene);
history.record(scene);
project.addModel(scene,makeGLB(d=>{d.nodes[0].translation=[11,2,0]}),'second.glb',2,2);
const b=project.serialize(scene);
history.record(scene);
for(let i=0;i<5;i++){
scene=core.fresh();
project.addModel(scene,makeGLB(d=>{d.nodes[0].translation=[i+30,1,0]}),'extra-'+i+'.glb',0,0);
history.record(scene);
}
assert(history.retainedAssetVersions<=4);
const last=history.undo();
assert.deepEqual(project.parse(project.serialize(last)),last);
assert.equal(history.redo().assets[0].name,'extra-4.glb');
assert.notEqual(a,b);
});
