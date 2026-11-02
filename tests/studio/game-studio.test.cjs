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

test('Landschaft: Wiese, Wüste und Schnee bleiben beim Export erhalten',()=>{
const scene=core.fresh();
assert.equal(scene.ground,'meadow');
for(const ground of core.GROUNDS){
core.setGround(scene,ground);
const restored=core.parse(core.serialize(scene));
assert.equal(restored.ground,ground);
}
assert.throws(()=>core.setGround(scene,'lava'),/Landschaftstyp/);
assert.throws(()=>core.parse(JSON.stringify({...scene,ground:'<script>'})),/Landschaftstyp/);
});
test('Ältere Szenen ohne Bodenangabe laden rückwärtskompatibel als Wiese',()=>{
const legacy=core.fresh();delete legacy.ground;
const imported=core.parse(JSON.stringify(legacy));
assert.equal(imported.ground,'meadow');
assert.deepEqual(imported.objects,legacy.objects);
const history=core.createHistory(imported);
core.setGround(imported,'sand');
assert.equal(history.record(imported),true);
assert.equal(history.undo().ground,'meadow');
assert.equal(history.redo().ground,'sand');
});
test('Neue Natur-Objekte Felsen und Hügel bleiben validiert und kollidieren',()=>{
const scene=core.fresh();
const rock=core.add(scene,'rock',12,12),hill=core.add(scene,'hill',-12,-12);
assert.equal(rock.type,'rock');
assert.equal(hill.type,'hill');
assert.equal(hill.color,'#5ebbb0');
assert.equal(core.collides(12,12,scene.objects),true);
assert.equal(core.collides(-11,-12,scene.objects),true);
assert.deepEqual(core.parse(core.serialize(scene)),scene);
});

test('Höhenraster: gültige Größe, sichere Werte und alter Szenenimport',()=>{
const scene=core.fresh();
assert.equal(scene.terrain.length,core.GRID*core.GRID);
assert(scene.terrain.every(height=>height===0));
const legacy=core.fresh();delete legacy.terrain;
const imported=core.parse(JSON.stringify(legacy));
assert.equal(imported.terrain.length,289);
assert(imported.terrain.every(x=>x===0));
assert.throws(()=>core.validate({...scene,terrain:[1]}),/Höhenprofil/);
assert.throws(()=>core.validate({...scene,terrain:Array(289).fill(-1)}),/Höhenprofil/);
assert.throws(()=>core.validate({...scene,terrain:Array(289).fill(3.01)}),/Höhenprofil/);
assert.throws(()=>core.validate({...scene,terrain:Array(289).fill('0')}),/Höhenprofil/);
assert.throws(()=>core.validate({...scene,terrain:Array(289).fill(null)}),/Höhenprofil/);
});
test('Gelände anheben, absenken und glätten bleibt im gültigen Höhenbereich',()=>{
const scene=core.fresh();
assert.equal(core.sculpt(scene,'raise',0,0,3.5,.8),true);
assert(core.terrainHeight(scene.terrain,0,0)>0);
const peak=core.terrainHeight(scene.terrain,0,0);
assert.equal(core.sculpt(scene,'lower',0,0,3.5,.5),true);
assert(core.terrainHeight(scene.terrain,0,0)<peak);
for(let i=0;i<20;i++)core.sculpt(scene,'raise',0,0,3.5,1);
assert(scene.terrain.every(x=>x>=0&&x<=core.MAX_HEIGHT));
assert.equal(core.sculpt(scene,'smooth',0,0,5.5,.8),true);
assert(scene.terrain.every(x=>x>=0&&x<=core.MAX_HEIGHT));
const exported=core.parse(core.serialize(scene));
assert.deepEqual(exported.terrain,scene.terrain);
});
test('Geländepinsel: Eingaben prüfen und Operationen rückgängig machen',()=>{
const scene=core.fresh(),history=core.createHistory(scene);
assert.throws(()=>core.sculpt(scene,'script',0,0),/Geländepinsel/);
assert.throws(()=>core.sculpt(scene,'raise',50,0),/Geländepinsel/);
assert.throws(()=>core.sculpt(scene,'raise',0,0,900),/Geländepinsel/);
assert.throws(()=>core.sculpt(scene,'raise',0,0,3.5,Infinity),/Geländepinsel/);
assert.equal(core.sculpt(scene,'lower',0,0),false);
core.sculpt(scene,'raise',0,0);
history.record(scene);
assert(core.terrainHeight(scene.terrain,0,0)>0);
const previous=history.undo();
assert.equal(core.terrainHeight(previous.terrain,0,0),0);
const redo=history.redo();
assert(core.terrainHeight(redo.terrain,0,0)>0);
const copy=core.parse(core.serialize(redo));
copy.terrain[0]=2;
assert.notEqual(copy.terrain[0],redo.terrain[0]);
});

test('Tageszeiten: vier erlaubte Lichtstimmungen werden sicher gespeichert',()=>{
const scene=core.fresh();
assert.equal(scene.lighting,'day');
assert.deepEqual(core.LIGHTS,['dawn','day','sunset','night']);
for(const lighting of core.LIGHTS){
core.setLighting(scene,lighting);
assert.equal(core.parse(core.serialize(scene)).lighting,lighting);
}
assert.throws(()=>core.setLighting(scene,'laser'),/Tageszeit/);
assert.throws(()=>core.validate({...scene,lighting:'<script>alert(1)</script>'}),/Tageszeit/);
assert.throws(()=>core.validate({...scene,lighting:null}),/Tageszeit/);
});
test('Alte 3D-Szenen ohne Tageszeit bleiben beim Import kompatibel',()=>{
const legacy=core.fresh();
delete legacy.lighting;
const imported=core.parse(JSON.stringify(legacy));
assert.equal(imported.lighting,'day');
assert.equal(imported.terrain.length,289);
assert.equal(imported.objects.length,6);
const history=core.createHistory(imported);
core.setLighting(imported,'night');
assert.equal(history.record(imported),true);
assert.equal(history.undo().lighting,'day');
assert.equal(history.redo().lighting,'night');
});

test('Figurenoutfits werden geprüft, exportiert und beim Rückgängig berücksichtigt',()=>{
const scene=core.fresh(),history=core.createHistory(scene);
assert.equal(scene.avatar,'explorer');
assert.deepEqual(core.AVATARS,['explorer','sport','night']);
for(const avatar of core.AVATARS){
core.setAvatar(scene,avatar);
assert.equal(core.parse(core.serialize(scene)).avatar,avatar);
}
assert.throws(()=>core.setAvatar(scene,'<script>'),/Spielfigur/);
assert.throws(()=>core.validate({...scene,avatar:null}),/Spielfigur/);
history.record(scene);
assert.equal(history.undo().avatar,'explorer');
assert.equal(history.redo().avatar,'night');
});
test('Alte Szenen ohne Spielfigur behalten Standard-Explorer',()=>{
const legacy=core.fresh();delete legacy.avatar;
const scene=core.parse(JSON.stringify(legacy));
assert.equal(scene.avatar,'explorer');
assert.deepEqual(scene.terrain,legacy.terrain);
assert.equal(scene.lighting,legacy.lighting);
});
test('Bewegungsrichtung: diagonal normalisiert und kamerasynchron',()=>{
const forward=core.direction({forward:true},0);
assert.equal(forward.moving,true);
assert(Math.abs(forward.x)<1e-10);
assert.equal(forward.z,-1);
const diagonal=core.direction({forward:true,right:true},Math.PI/3);
assert(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-10);
const still=core.direction({forward:true,back:true},0);
assert.equal(still.moving,false);
assert.equal(still.x,0);
const player={x:0,y:0,z:0,vy:0};
core.move(player,{forward:true,right:true},.05,[],Math.PI/3);
assert(Math.abs(Math.hypot(player.x,player.z)-.25)<1e-8);
});

test('Naturbibliothek: Tannen, Sträucher, Blumen und Felsen bleiben serialisierbar',()=>{
const scene=core.fresh();
for(const type of ['pine','bush','flower']) {
const plant=core.add(scene,type,13,13);
assert.equal(plant.type,type);
assert(core.PALETTE.includes(plant.color));
assert.deepEqual(core.parse(core.serialize(scene)).objects.at(-1),plant);
core.remove(scene,plant.id);
}
const flower=core.add(scene,'flower',13,13);
assert.equal(core.collides(13,13,[flower]),false,'Blumen dürfen die Spielfigur nicht blockieren');
const pine=core.add(scene,'pine',12,12);
assert.equal(core.collides(12,12,[pine]),true,'Baumstämme müssen kollidieren');
});
test('Naturgruppen: Waldstück und Blumenwiese werden atomar angelegt und rückgängig',()=>{
const scene=core.fresh(),history=core.createHistory(scene);
assert.deepEqual(core.NATURE_GROUPS,['grove','garden']);
const grove=core.plantGroup(scene,'grove',0,0);
assert.equal(grove.length,4);
assert.equal(scene.objects.length,10);
assert.equal(new Set(scene.objects.map(o=>o.id)).size,10);
assert(grove.some(o=>o.type==='pine'));
history.record(scene);
const garden=core.plantGroup(scene,'garden',8,8);
assert.equal(garden.length,5);
assert.equal(scene.objects.length,15);
assert(garden.filter(o=>o.type==='flower').length>=3);
assert(garden.every(o=>o.x<=core.WORLD&&o.z<=core.WORLD));
history.record(scene);
assert.equal(history.undo().objects.length,10);
assert.equal(history.undo().objects.length,6);
assert.equal(history.redo().objects.length,10);
assert.deepEqual(core.parse(core.serialize(scene)),scene);
});
test('Naturgruppen respektieren Objektlimit, Kartenränder und ungültige Eingaben',()=>{
const scene=core.fresh();
for(const bad of ['<script>','invalid'])assert.throws(()=>core.plantGroup(scene,bad,0,0),/Naturgruppe/);
assert.throws(()=>core.plantGroup(scene,'grove',NaN,0),/Naturgruppe/);
assert.throws(()=>core.plantGroup(scene,'grove',18,18),/außerhalb/);
assert.equal(scene.objects.length,6);
while(scene.objects.length<67)core.add(scene,'box');
const before=core.serialize(scene);
assert.throws(()=>core.plantGroup(scene,'grove',0,0),/Maximal/);
assert.equal(core.serialize(scene),before,'Fehler dürfen keine Teilgruppe zurücklassen');
assert.throws(()=>core.plantGroup(scene,'garden',0,0),/Maximal/);
assert.equal(core.serialize(scene),before);
const nearLimit=core.fresh();
while(nearLimit.objects.length<66)core.add(nearLimit,'box');
const added=core.plantGroup(nearLimit,'grove',0,0);
assert.equal(added.length,4);
assert.equal(nearLimit.objects.length,core.LIMIT);
assert.throws(()=>core.plantGroup(nearLimit,'garden',0,0),/Maximal/);
});
