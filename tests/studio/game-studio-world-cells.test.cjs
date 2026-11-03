'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../../studio/game-studio/scene-core.js');
const Project=require('../../studio/game-studio/project-assets.js');
const World=require('../../studio/game-studio/world-cells.js');
const {makeGLB}=require('./glb-fixture.cjs');
test('v1 wird nur explizit und ohne Änderung des Originals nach v3 migriert',()=>{
const old=Core.fresh(),before=Core.serialize(old);
const world=World.migrateLegacy(old);
assert.equal(world.version,3);assert.equal(world.sourceVersion,1);
assert.equal(world.cells.length,1);assert.equal(world.cells[0].id,'cell:0:0');
assert.deepEqual(World.toLegacy(world),Core.validate(old));
assert.equal(Core.serialize(old),before);
assert.deepEqual(World.parseWorld(World.serializeWorld(world)),world);
});
test('v2 mit zwei eingebetteten GLB-Assets bleibt beim v3-Roundtrip erhalten',()=>{
const old=Core.fresh();
Project.addModel(old,makeGLB(),'one.glb',3,3);
Project.addModel(old,makeGLB((json)=>{json.nodes[0].translation=[1,2,3];}),'two.glb',-3,-3);
const original=Project.serialize(old);
const world=World.migrateLegacy(old);
assert.equal(world.sourceVersion,2);assert.equal(world.assets.length,2);
assert.equal(world.cells[0].objects.filter(o=>o.type==='model').length,2);
assert.equal(Project.serialize(World.toLegacy(World.parseWorld(World.serializeWorld(world)))),original);
assert.equal(Project.serialize(old),original);
});
test('mehr als 70 Objekte in 16 Zellen sind als Daten validierbar, nicht als Runtime gerendert',()=>{
const seed=World.migrateLegacy(Core.fresh());
seed.cells=[];
let id=1;
for(let cx=-2;cx<2;cx++)for(let cz=-2;cz<2;cz++){
const objects=[];
for(let j=0;j<6;j++)objects.push({id:id++,parentId:null,type:'box',x:cx*40+j,z:cz*40+j,scale:1,color:Core.PALETTE[0]});
seed.cells.push({id:World.cellId(cx,cz),cx,cz,terrain:null,objects});
}
const valid=World.validateWorld(seed);
assert.equal(valid.cells.length,16);assert.equal(valid.cells.reduce((n,c)=>n+c.objects.length,0),96);
const index=World.indexWorld(valid);
const near=World.selectVisibleCells(index,0,0,0);
assert.deepEqual(near.map(c=>c.id),['cell:0:0']);
assert.equal(World.selectVisibleCells(index,0,0,1).length,9);
assert.equal(World.selectVisibleCells(index,1000,1000,1).length,0);
assert.equal(valid.cells.reduce((n,c)=>n+c.objects.length,0),96);
assert.throws(()=>World.toLegacy(valid),/nicht verlustfrei/);
});
test('globale IDs, Zellzuordnung, Koordinaten und gefährliche Felder werden abgewiesen',()=>{
const base=World.migrateLegacy(Core.fresh());
const clone=()=>JSON.parse(World.serializeWorld(base));
let bad=clone();bad.cells[0].objects.push({...bad.cells[0].objects[0]});
assert.throws(()=>World.validateWorld(bad),/Doppelte/);
bad=clone();bad.cells[0].objects[0].x=300;
assert.throws(()=>World.validateWorld(bad),/falschen Zelle/);
bad=clone();bad.cells[0].objects[0].parentId=1;
assert.throws(()=>World.validateWorld(bad),/Szenenknoten/);
bad=clone();bad.cells[0].objects[0].script='<script>alert(1)</script>';
assert.throws(()=>World.validateWorld(bad),/Objektfeld/);
bad=clone();bad.cells[0].objects[0].x=Infinity;
assert.throws(()=>World.validateWorld(bad),/Szenenknoten/);
bad=clone();bad.cells.push({...bad.cells[0]});
assert.throws(()=>World.validateWorld(bad),/doppelte Zelle/);
assert.throws(()=>World.parseWorld('{broken'),/JSON/);
assert.throws(()=>World.selectVisibleCells({},0,0),/Sichtbarkeitsindex/);
});
test('negative Zellgrenzen, Sortierung und Sichtbarkeitsauswahl sind deterministisch',()=>{
assert.deepEqual(World.cellAt(-20,-20),{cx:0,cz:0});
assert.deepEqual(World.cellAt(-20.01,20),{cx:-1,cz:1});
const base=World.migrateLegacy(Core.fresh());
const index=World.indexWorld(base);
assert.deepEqual(World.selectVisibleCells(index,0,0,0).map(c=>c.id),['cell:0:0']);
assert.deepEqual(World.selectVisibleCells(index,80,80,0),[]);
assert.throws(()=>World.selectVisibleCells(index,0,0,33),/Radius/);
});