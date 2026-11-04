const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('./mission-core.js');
const height=()=>0;
const run=(s,input={},steps=1,obstacles=[])=>{for(let i=0;i<steps;i++)M.step(s,input,.05,height,obstacles);return s;};
test('mission starts with 3 relays, 7 drones and an extraction phase',()=>{
 const s=M.makeState();assert.equal(s.beacons.length,3);assert.equal(s.enemies.length,7);
 assert.equal(s.phase,'playing');assert.equal(M.nearbyObjective(s).done,0);
});
test('diagonal movement is normalized; sprint drains and idle restores stamina',()=>{
 const a=M.makeState(),b=M.makeState();a.enemies=[];b.enemies=[];
 run(a,{right:true},10);run(b,{right:true,forward:true},10);
 assert.ok(Math.abs(Math.hypot(a.hero.x,a.hero.z)-Math.hypot(b.hero.x,b.hero.z))<.01);
 run(a,{right:true,sprint:true},10);assert.ok(a.hero.stamina<100);
 const tired=a.hero.stamina;run(a,{},10);assert.ok(a.hero.stamina>tired);
});
test('obstacles and world bounds block player',()=>{
 const s=M.makeState();s.enemies=[];
 run(s,{right:true},10,[{type:'rock',scale:1.5,x:.8,z:0}]);assert.equal(s.hero.x,0);
 s.hero.x=317.9;run(s,{right:true},30);assert.ok(s.hero.x<=318);
});
test('jump obeys gravity and returns to ground',()=>{
 const s=M.makeState();s.enemies=[];
 run(s,{jump:true},1);assert.ok(s.hero.y>0);run(s,{},35);assert.equal(s.hero.y,0);
});
test('attack only damages enemies in front and obeys cooldown',()=>{
 const s=M.makeState();s.enemies=[{id:1,x:0,z:2,hp:100,attackCooldown:1,originX:0,originZ:2,heading:0,phase:0},{id:2,x:0,z:-2,hp:100,attackCooldown:1,originX:0,originZ:-2,heading:0,phase:0}];
 s.hero.heading=0;M.attack(s);assert.equal(s.enemies[0].hp,45);assert.equal(s.enemies[1].hp,100);
 M.attack(s);assert.equal(s.enemies[0].hp,45);
 run(s,{},13);M.attack(s);assert.equal(s.enemies[0].hp,0);assert.equal(s.kills,1);
});
test('relays require distance; all 3 plus extraction win the game',()=>{
 const s=M.makeState();s.enemies=[];
 M.interact(s);assert.equal(M.nearbyObjective(s).done,0);
 for(const b of s.beacons){s.hero.x=b.x;s.hero.z=b.z;M.interact(s);}
 assert.equal(M.nearbyObjective(s).done,3);assert.equal(s.phase,'playing');
 s.hero.x=0;s.hero.z=0;M.interact(s);assert.equal(s.phase,'won');
});
test('enemies chase and can defeat hero; restart creates clean mission',()=>{
 const s=M.makeState();s.enemies=[{id:1,x:0,z:1,hp:100,attackCooldown:0,originX:0,originZ:1,heading:0,phase:0}];
 run(s,{},230);assert.equal(s.phase,'lost');assert.equal(s.hero.hp,0);
 assert.equal(M.makeState().phase,'playing');
});
test('invalid frame timing is rejected and dt spikes are capped',()=>{
 const s=M.makeState();s.enemies=[];assert.throws(()=>M.step(s,{},NaN,height),/Zeit/);
 M.step(s,{forward:true},10,height);assert.ok(Math.hypot(s.hero.x,s.hero.z)<.4);
});
test('integration: SD World v3 queries only active chunks',()=>{
 const W=require('../../large-world-core.js');const w=W.generate(31,6),r=W.runtime(w,1);
 assert.equal(w.cells.length,256);const nearby=r.query(0,0);
 assert.equal(nearby.activeCells,9);assert.equal(nearby.objects.length,54);
 const moved=r.query(120,140);assert.equal(moved.activeCells,9);
});
test('integration: terrain cell boundaries match vertex-for-vertex',()=>{
 const T=require('../../large-world-terrain.js'),res=12;
 const a=T.buildCell(7,8,31,res),b=T.buildCell(8,8,31,res);
 assert.equal(a.vertices.length,b.vertices.length);
 for(let row=0;row<res;row++){
   const l=(row*res+res-1)*36,r=row*res*36;
   for(const [al,br] of [[l+30,r],[l+12,r+6]]){
     for(let k=0;k<3;k++)assert.ok(Math.abs(a.vertices[al+k]-b.vertices[br+k])<.0001,
       "Benachbarte Terrainzellen müssen nahtlos sein");
   }
 }
});