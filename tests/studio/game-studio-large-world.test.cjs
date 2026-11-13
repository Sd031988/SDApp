'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const World=require('../../studio/game-studio/large-world-core.js');
const Core=require('../../studio/game-studio/scene-core.js');
const Project=require('../../studio/game-studio/project-assets.js');
test('Große v3-Welt erzeugt 256 Zellen mit 2.048 eindeutigen Objekten auf 640 × 640',()=>{
const world=World.generate(31,8);
assert.equal(world.version,3);
assert.equal(world.size,640);
assert.equal(world.cellSize,40);
assert.equal(world.cells.length,256);
assert.equal(World.total(world),2048);
assert.equal(new Set(world.cells.map(c=>c.cx+':'+c.cz)).size,256);
assert.equal(new Set(world.cells.flatMap(c=>c.objects.map(o=>o.id))).size,2048);
assert.deepEqual(World.generate(31,8),world,'Worldgen muss deterministisch sein');
assert.deepEqual(World.parse(World.serialize(world)),world);
assert(World.serialize(world).length<World.MAX_FILE);
});
test('Aktive Szenenzellen nutzen weniger Objekte als die Gesamtwelt',()=>{
const w=World.generate(31,8),r=World.runtime(w,1);
const center=r.query(0,0);
assert.equal(center.totalObjects,2048);
assert.equal(center.activeCells,9);
assert.equal(center.activeObjects,72);
assert.equal(center.entered,9);
assert.equal(center.exited,0);
const same=r.query(2,2);
assert.equal(same.entered,0);assert.equal(same.exited,0);
const moved=r.query(50,0);
assert(moved.entered>0&&moved.exited>0);
assert.equal(moved.activeCells,9);
const edge=r.query(-319,-319);
assert.equal(edge.activeCells,4);
assert.equal(edge.activeObjects,32);
assert(edge.activeObjects<center.totalObjects/20);
assert.equal(World.nearby(w,0,0,1).activeObjects,72);
});
test('Bewegte Objekte wechseln ohne Duplikate und ohne Datenverlust die Zelle',()=>{
const w=World.generate(31,8),o=World.add(w,'box',.5,0);
const prevCount=World.total(w);
assert.equal(prevCount,2049);
const original=World.cellAt(o.x,o.z);
const moved=World.shift(w,o.id,44,1);
assert.equal(moved.id,o.id);
assert.notDeepEqual(World.cellAt(moved.x,moved.z),original);
assert.equal(World.total(w),prevCount);
assert.equal(w.cells.flatMap(c=>c.objects).filter(item=>item.id===o.id).length,1);
assert.deepEqual(World.parse(World.serialize(w)),w);
assert.equal(World.remove(w,o.id),true);
assert.equal(World.remove(w,o.id),false);
assert.equal(World.total(w),2048);
});
test('Welt kann bis zu 8.192 Objekte als verwaltete Zellinstanzen aufnehmen',()=>{
const world=World.generate(71,32);
assert.equal(World.total(world),8192);
assert.equal(World.parse(World.serialize(world)).cells.length,256);
const original=World.serialize(world);
assert.throws(()=>World.add(world,'rock',0,0),/limit/i);
assert.equal(World.serialize(world),original);
});
test('Sicheres Laden weist fehlerhafte Zellen, IDs und ungültige Koordinaten zurück',()=>{
const world=World.generate(31,0),snapshot=World.serialize(world);
for(const bad of [
x=>{x.version=2;},x=>{x.size=40;},x=>{x.spawn.x=999;},
x=>{x.cells.push(x.cells[0]);},x=>{x.cells[0].cx=16;},
x=>{x.cells[0].objects=[{id:1,type:'tree',x:300,z:300,scale:1,color:World.COLORS[0]}];},
x=>{x.cells[0].ground='remote://asset';},
]){
const x=JSON.parse(snapshot);bad(x);
assert.throws(()=>World.parse(JSON.stringify(x)),/Großwelt v3:/);
}
assert.throws(()=>World.parse('x'.repeat(World.MAX_FILE+1)),/zu groß/);
assert.throws(()=>World.parse('{not json'),/JSON/);
assert.equal(World.serialize(world),snapshot);
assert.throws(()=>World.cellAt(NaN,0),/außerhalb/);
assert.throws(()=>World.generate(31,33),/Weltgenerator/);
});
test('Zellwechsel auf volle Zielzelle bleibt atomar',()=>{
const w=World.generate(31,0),target=w.cells.find(c=>c.cx===10&&c.cz===10),source=w.cells.find(c=>c.cx===8&&c.cz===8);
const x=-World.HALF+target.cx*World.CHUNK+12,z=-World.HALF+target.cz*World.CHUNK+12;
for(let i=0;i<World.MAX_PER_CELL;i++)World.add(w,'tree',x+i*.01,z+i*.01);
const obj=World.add(w,'rock',0,0),before=World.serialize(w);
assert.equal(source.objects.some(o=>o.id===obj.id),true);
assert.throws(()=>World.shift(w,obj.id,x,z),/voll/);
assert.equal(World.serialize(w),before);
});
test('Alte v1/v2-Projekte werden nicht durch die neue v3-Engine verändert',()=>{
const old=Core.fresh(),v1=Core.serialize(old),v2=Project.serialize(old);
const v3=World.generate(44,1);
assert.equal(World.parse(World.serialize(v3)).version,3);
assert.equal(Core.serialize(old),v1);
assert.equal(Project.serialize(old),v2);
assert.throws(()=>World.parse(v1),/Großwelt v3/);
});
test('Runtime lehnt ungültige Zellradien vor der Initialisierung ab',()=>{
const world=World.generate(31,1),before=World.serialize(world);
for(const radius of [-1,4,0.5,NaN,Infinity,'1',null]){
assert.throws(()=>World.runtime(world,radius),/Ungültiger aktiver Zellenradius/);
}
for(const radius of [0,1,2,3]){
const runtime=World.runtime(world,radius);
assert(runtime.query(0,0).activeCells>0);
}
assert.equal(World.serialize(world),before,'Ungültige Radiuswerte dürfen das Projekt nicht verändern');
});
