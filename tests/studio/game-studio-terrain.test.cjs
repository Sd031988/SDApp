'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Terrain=require('../../studio/game-studio/large-world-terrain.js');
const World=require('../../studio/game-studio/large-world-core.js');
function seam(mesh,x){
const table=new Map();
for(let i=0;i<mesh.vertices.length;i+=6){
const [vx,y,z,nx,ny,nz]=mesh.vertices.slice(i,i+6);
if(Math.abs(vx-x)>1e-5)continue;
table.set(z.toFixed(3),{y,nx,ny,nz});
}
return table;
}
test('Terrain ist deterministisch, an Zellgrenzen nahtlos und gehört in dieselbe 640er Welt',()=>{
const a=Terrain.buildCell(8,8,31),b=Terrain.buildCell(9,8,31);
assert.equal(a.count,12*12*6);
assert.equal(a.vertices.length,12*12*6*6);
assert.deepEqual(Array.from(Terrain.buildCell(8,8,31).vertices),Array.from(a.vertices));
const left=seam(a,40),right=seam(b,40);
assert.equal(left.size,13);
assert.equal(right.size,13);
for(const [z,p] of left){
const q=right.get(z);
assert(q,'Geländezellen müssen dieselben Randpunkte besitzen');
assert(Math.abs(q.y-p.y)<1e-5,'Zellrand darf keine sichtbare Höhennaht haben');
assert(Math.abs(q.nx-p.nx)<1e-5&&Math.abs(q.ny-p.ny)<1e-5&&Math.abs(q.nz-p.nz)<1e-5);
}
assert(a.bounds.max>a.bounds.min);
});
test('Höhen und Normalen bleiben auf der gesamten Welt endlich und normiert',()=>{
for(const x of [-320,-200,-40,0,40,199,320])for(const z of [-320,-160,-39,0,77,320]){
const h=Terrain.heightAt(x,z,62),n=Terrain.normalAt(x,z,62);
assert(Number.isFinite(h));
assert(Math.abs(h)<5);
assert(Math.abs(Math.hypot(...n)-1)<1e-12);
assert(n[1]>.9);
}
assert.notEqual(Terrain.heightAt(50,70,31),Terrain.heightAt(50,70,32));
});
test('Terrainmesh bleibt begrenzt; ungültige Zellkoordinaten werden abgewiesen',()=>{
const a=Terrain.buildCell(0,0,World.VERSION,8);
assert.equal(a.count,8*8*6);
assert(a.bounds.min>-5&&a.bounds.max<5);
assert.throws(()=>Terrain.buildCell(-1,0,31),/Terrainzelle/);
assert.throws(()=>Terrain.buildCell(0,16,31),/Terrainzelle/);
assert.throws(()=>Terrain.buildCell(1,1,31,50),/Terrainzelle/);
assert.throws(()=>Terrain.heightAt(Infinity,0,31),/Terrainkoordinate/);
});
