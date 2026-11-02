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