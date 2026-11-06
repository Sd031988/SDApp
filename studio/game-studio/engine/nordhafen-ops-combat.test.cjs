'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const combat=require('./nordhafen-ops-combat.js');
test('30 rounds fire, empty magazine and reload using reserve',()=>{
 let s=combat.initial();assert.equal(s.ammo,30);
 for(let i=0;i<30;i++){const shot=combat.fire(s);assert.equal(shot.event,'fired');s=shot.state;}
 assert.equal(combat.fire(s).event,'empty');
 s=combat.reload(s);assert.equal(combat.fire(s).event,'reloading');
 s=combat.tick(s,1);assert.ok(s.reload>0);
 s=combat.tick(s,1);assert.equal(s.ammo,30);assert.equal(s.reserve,60);
});
test('reload cannot create ammunition, hit feedback counts impacts',()=>{
 let s={ammo:28,reserve:1,reload:0,shots:2,hits:0};
 s=combat.tick(combat.reload(s),2);
 assert.equal(s.ammo,29);assert.equal(s.reserve,0);
 assert.equal(combat.reload(s),s);
 const h=combat.hit(s,25);assert.equal(h.damage,25);assert.equal(h.state.hits,1);
 assert.equal(combat.fire(s).state.ammo,28);
});
