'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),r=require('./nordhafen-ops-royale.js');
test('parachute opens, slows descent, landing cannot go below terrain',()=>{
 let fast=r.drop(),slow=r.drop();for(let i=0;i<100;i++){fast=r.descend(fast,.05);slow=r.descend(slow,.05,{open:i===0});}
 assert.equal(slow.parachute,true);assert.ok(slow.y>fast.y);
 for(let i=0;i<1000&&!slow.landed;i++)slow=r.descend(slow,.05,{ground:2});
 assert.equal(slow.y,2);assert.equal(slow.landed,true);assert.deepEqual(r.descend(slow,.05),slow);
});
test('pickup applies once; health and armor capped; backpack increases capacity',()=>{
 let inv=r.inventory();inv={...inv,health:50,ammo:110};
 inv=r.pickup(inv,{id:1,type:'medkit'});assert.equal(inv.health,100);
 assert.deepEqual(r.pickup(inv,{id:1,type:'medkit'}),inv);
 inv=r.pickup(inv,{id:2,type:'ammo'});assert.equal(inv.ammo,120);
 inv=r.pickup(inv,{id:3,type:'backpack'});assert.equal(inv.capacity,240);
 inv=r.pickup(inv,{id:4,type:'armor'});assert.equal(inv.armor,50);
 inv=r.pickup(inv,{id:5,type:'rifle'});assert.ok(inv.weapons.includes('rifle'));
});
test('bots loot when safe, fight nearby threats and never act after death',()=>{
 const b={id:1,x:0,z:0,alive:true};
 assert.equal(r.bot(b,.1,{loot:{x:10,z:0}}).activity,'seek-loot');
 assert.equal(r.bot(b,.1,{enemy:{id:2,x:5,z:0}}).activity,'fight');
 assert.deepEqual(r.bot({...b,alive:false},.1,{enemy:{id:2,x:5,z:0}}),{...b,alive:false});
});
test('tank cannot fire during cooldown and blast fades with distance',()=>{
 let t=r.tank();let shot=r.tankFire(t);assert.equal(shot.fired,true);
 assert.equal(r.tankFire(shot.state).fired,false);
 t=r.tankTick(shot.state,4);assert.equal(r.tankFire(t).fired,true);
 assert.equal(r.blast(0),90);assert.ok(r.blast(4)<r.blast(1));assert.equal(r.blast(8),0);
});
