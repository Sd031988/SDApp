'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=require('../../studio/game-studio/scene-core.js');
const root=path.resolve(__dirname,'../../studio');
test('Beispielwelt hat gültige exportierbare Objekte',()=>{
const scene=core.fresh();assert.equal(scene.version,1);assert.equal(scene.objects.length,6);
assert.deepEqual(core.parse(core.serialize(scene)),scene);});
test('Objekte anlegen, bewegen, einfärben und löschen',()=>{
const scene=core.fresh(),old=scene.objects.length;
const obj=core.add(scene,'box',3,-2);assert.equal(scene.objects.length,old+1);
core.update(scene,obj.id,{x:4,z:7,scale:1.8,color:'#5ebbb0'});
assert.equal(obj.scale,1.8);assert.equal(core.remove(scene,obj.id),true);
assert.equal(core.remove(scene,obj.id),false);assert.equal(scene.objects.length,old);});
test('Fehlerhafte JSON-Szenen, ungültige Werte und doppelte IDs zurückweisen',()=>{
const scene=core.fresh();
assert.throws(()=>core.parse('invalid'),/JSON/);
assert.throws(()=>core.parse('x'.repeat(60001)),/groß/);
assert.throws(()=>core.parse(JSON.stringify({...scene,version:2})),/Ungültige/);
assert.throws(()=>core.parse(JSON.stringify({...scene,objects:[...scene.objects,scene.objects[0]]})),/doppelte/);
assert.throws(()=>core.parse(JSON.stringify({...scene,objects:[{id:8,type:'script',x:0,z:0,scale:1,color:'#d7a35c'}]})),/Ungültiges/);
assert.throws(()=>core.parse(JSON.stringify({...scene,objects:[{id:8,type:'box',x:999,z:0,scale:1,color:'#d7a35c'}]})),/Ungültiges/);
assert.throws(()=>core.update(scene,1,{id:99}),/Eigenschaft/);
assert.throws(()=>core.update(scene,1,{color:'#ffffff'}),/Ungültiger/);
const injected=JSON.parse(core.serialize(scene));injected.objects[0].arbitrary='<script>alert(1)</script>';
assert.equal(core.validate(injected).objects[0].arbitrary,undefined);});
test('Limit von 70 Objekten gilt',()=>{
const scene=core.fresh();while(scene.objects.length<core.LIMIT)core.add(scene,'box');
assert.throws(()=>core.add(scene,'box'),/Maximal/);});
test('Spielfigur: Bewegung, Sprung, Boden und Kollisionen',()=>{
const player={x:0,y:0,z:5,vy:0},scene=core.fresh();
core.move(player,{forward:true,jump:true},.03,scene.objects,0);
assert(player.z<5);assert(player.y>0);
for(let i=0;i<200;i++)core.move(player,{},.03,scene.objects,0);
assert.equal(player.y,0);assert.equal(player.vy,0);
assert.equal(core.collides(50,0,scene.objects),true);
assert.equal(core.collides(-3,2,scene.objects),true);
assert.equal(core.collides(0,0,[]),false);});
test('Game-Studio bleibt vom Editor getrennt und lädt keine externe Engine',()=>{
const html=fs.readFileSync(path.join(root,'game-studio/index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'game-studio/game.js'),'utf8');
const studio=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(html,/id="stage"/);assert.match(html,/src="\.\/game\.js/);
assert.match(html,/src="\.\/scene-core\.js/);
assert.match(studio,/href="\.\/game-studio\/index\.html"/);
assert.doesNotMatch(js,/\b(?:eval|localStorage|indexedDB|XMLHttpRequest|fetch)\s*\(/);
assert.doesNotMatch(html,/<script[^>]+src="https?:/i);});
test('Objektduplikate behalten Typ, Größe und Farbe, bekommen aber eine neue ID',()=>{
const scene=core.fresh(),source=scene.objects[0],copy=core.duplicate(scene,source.id);
assert.notEqual(copy.id,source.id);
assert.equal(copy.type,source.type);
assert.equal(copy.scale,source.scale);
assert.equal(copy.color,source.color);
assert.equal(copy.x,source.x+1.5);
assert.equal(copy.z,source.z+1.5);
assert.throws(()=>core.duplicate(scene,99999),/nicht gefunden/);
while(scene.objects.length<core.LIMIT)core.add(scene,'box');
assert.throws(()=>core.duplicate(scene,source.id),/Maximal/);
});
test('Rückgängig/Wiederholen: Snapshots isoliert, Redo-Verzweigung verworfen',()=>{
const scene=core.fresh(),history=core.createHistory(scene);
assert.equal(history.canUndo,false);
assert.equal(history.canRedo,false);
core.add(scene,'box');assert.equal(history.record(scene),true);
const first=core.serialize(scene);
assert.equal(history.record(scene),false);
core.add(scene,'tree');assert.equal(history.record(scene),true);
assert.equal(history.canUndo,true);
const previous=history.undo();
assert.equal(core.serialize(previous),first);
assert.equal(history.canRedo,true);
core.add(previous,'sphere');
assert.equal(history.record(previous),true);
assert.equal(history.canRedo,false);
assert.equal(history.redo(),null);
assert.equal(history.undo().objects.length,7);
assert.equal(history.undo().objects.length,6);
assert.equal(history.undo(),null);
});
test('Verlauf ist begrenzt und wird bei einem neuen Import zurückgesetzt',()=>{
const scene=core.fresh(),history=core.createHistory(scene,3);
for(let i=0;i<4;i++){core.add(scene,'box');history.record(scene);}
assert.equal(history.undo().objects.length,9);
assert.equal(history.undo().objects.length,8);
assert.equal(history.undo(),null);
const fresh=core.fresh();
history.reset(fresh);
assert.equal(history.canUndo,false);
assert.equal(history.canRedo,false);
assert.throws(()=>core.createHistory(fresh,1),/Verlaufslänge/);
assert.throws(()=>core.createHistory(fresh,101),/Verlaufslänge/);
});
