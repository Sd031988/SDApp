'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),w=require('./nordhafen-ops-weapons.js');
test('five slots have independent magazines and reserve, switching does not refill',()=>{
 let s=w.initial();assert.equal(s.slots.length,5);s=w.fire(s).state;assert.equal(w.active(s).ammo,11);
 s=w.select(s,1);assert.equal(w.active(s).ammo,30);s=w.fire(s).state;assert.equal(w.active(s).ammo,29);
 s=w.select(s,0);assert.equal(w.active(s).ammo,11);assert.equal(s.slots[1].ammo,29);
});
test('shotgun consumes one shell and fires six deterministic distinct pellets',()=>{
 let s=w.select(w.initial(),3),result=w.fire(s);assert.equal(result.event,'fired');assert.equal(result.pellets.length,6);assert.equal(new Set(result.pellets.map(p=>p.x.toFixed(5)+':'+p.y.toFixed(5))).size,6);
 assert.deepEqual(result.pellets,w.fire(w.select(w.initial(),3)).pellets);
 assert.equal(w.active(result.state).ammo,5);
});
test('reloading only active weapon and transferring only available reserve',()=>{
 let s=w.initial();for(let i=0;i<12;i++){s=w.fire(s).state;s=w.tick(s,1);}
 assert.equal(w.active(s).ammo,0);s=w.reload(s);assert.ok(w.active(s).reload>0);s=w.tick(s,1.5);assert.equal(w.active(s).ammo,12);assert.equal(w.active(s).reserve,36);
});
test('cooldown blocks rapid fire and tick is framerate independent',()=>{
 let s=w.fire(w.initial()).state;assert.equal(w.fire(s).event,'cooldown');
 const a=w.tick(s,.28),b=w.tick(w.tick(s,.14),.14);assert.equal(w.active(a).cooldown,0);assert.equal(w.active(b).cooldown,0);assert.equal(w.fire(a).event,'fired');
});
test('sniper zoom differs from other aiming and spread rises with weapon profile',()=>{
 assert.equal(w.fov(w.select(w.initial(),4),true),.28);
 assert.equal(w.fov(w.select(w.initial(),0),false),.8);
 assert.ok(w.recoil(w.select(w.initial(),2))>w.recoil(w.select(w.initial(),4)));
});
