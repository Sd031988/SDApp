'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),ai=require('./nordhafen-ops-enemies.js');
test('enemy patrols, spots player, chases, shoots and searches after losing sight',()=>{
 let e=ai.spawn(0,0,0);assert.equal(e.health,50);
 let out=ai.step(e,{x:30,z:0},.1,{visible:false});assert.equal(out.enemy.state,'patrol');assert.equal(out.shoot,false);
 out=ai.step(out.enemy,{x:25,z:0},.1,{visible:true});assert.equal(out.enemy.state,'chase');assert.ok(out.enemy.x>e.x);
 e={...out.enemy,shotCooldown:0};out=ai.step(e,{x:8,z:0},.1,{visible:true,random:.9});
 assert.equal(out.enemy.state,'shoot');assert.equal(out.shoot,true);assert.ok(out.spread>0);
 out=ai.step(out.enemy,{x:8,z:0},.1,{visible:false});assert.equal(out.enemy.state,'search');assert.equal(out.shoot,false);
});
test('enemy and player damage clamp at zero; dead enemy cannot fire',()=>{
 let e=ai.spawn(1,0,0);e=ai.damage(e,25);assert.equal(e.health,25);
 e=ai.damage(e,100);assert.equal(e.health,0);assert.equal(e.state,'dead');
 assert.equal(ai.step(e,{x:1,z:1},2,{visible:true}).shoot,false);
 assert.equal(ai.hurt(100,18),82);assert.equal(ai.hurt(10,100),0);
});
test('AI spread varies with random input; no perfect shots guaranteed',()=>{
 const e={...ai.spawn(1,0,0),shotCooldown:0};
 const a=ai.step(e,{x:3,z:0},.1,{visible:true,random:0});
 const b=ai.step(e,{x:3,z:0},.1,{visible:true,random:1});
 assert.notEqual(a.spread,b.spread);
});

test('no enemy can see or shoot during first ten seconds even at point blank range',()=>{
 const enemy={...ai.spawn(0,0,0),shotCooldown:0};
 for(const t of [0,3,9.999]){
  const out=ai.step(enemy,{x:2,z:0},.1,{visible:true,elapsed:t});
  assert.equal(out.enemy.state,'patrol');assert.equal(out.shoot,false);
 }
 const out=ai.step(enemy,{x:2,z:0},.1,{visible:true,elapsed:10});
 assert.equal(out.enemy.state,'shoot');assert.equal(out.shoot,true);
});
test('street patrols move along assigned axis',()=>{
 const e=ai.spawn(0,0,0);
 const x=ai.step(e,{x:100,z:100},.1,{patrolAxis:'x'}).enemy;
 const z=ai.step(e,{x:100,z:100},.1,{patrolAxis:'z'}).enemy;
 assert.equal(x.z,0);assert.equal(z.x,0);
});
