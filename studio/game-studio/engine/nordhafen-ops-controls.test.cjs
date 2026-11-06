'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const c=require('./nordhafen-ops-controls.js');
test('shoulder offset moves camera aim right of player',()=>{
 const camera={alpha:0,target:{copyFrom(p){Object.assign(this,p);},addInPlace(v){this.x+=v.x;this.z+=v.z;}}};
 class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z});}scale(n){return new Vector3(this.x*n,this.y*n,this.z*n);}}
 c.shoulder(camera,{x:0,y:1,z:0},{Vector3});
 assert.equal(camera.target.z,.6);assert.equal(camera.target.y,1.45);
 assert.ok(c.shoulderScreenSide(camera,{x:0,y:1,z:0})<0,'player projects left of crosshair');
});
test('acceleration and braking are gradual, aiming reduces speed',()=>{
 const first=c.velocity({vx:0,vz:0},{vx:5,vz:0},.016,false);
 assert.ok(first.vx>0&&first.vx<5);
 const aim=c.velocity({vx:0,vz:0},{vx:5,vz:0},.016,true);
 assert.ok(aim.vx<first.vx);
 const stop=c.velocity({vx:5,vz:0},{vx:0,vz:0},.016,false);
 assert.ok(stop.vx>0&&stop.vx<5);
});
test('five training targets are in front of spawn at 10–25m',()=>{
 const positions=c.targetPositions({x:32,z:32},{x:0,z:-1},{x:1,z:0});
 assert.equal(positions.length,5);
 assert.ok(positions.every(p=>p.distance>=10&&p.distance<=25&&p.z<32));
});
test('crosshair ray uses render center even with CSS scaling',()=>{
 const canvas={getBoundingClientRect:()=>({width:400,height:200})};
 const scene={activeCamera:{},getEngine:()=>({getRenderWidth:()=>800,getRenderHeight:()=>400}),createPickingRay:(x,y)=>({x,y})};
 assert.deepEqual(c.centerRay(scene,canvas,{Matrix:{Identity:()=>null}}),{x:400,y:200});
});

test('six enemies spawn at least 30m from player on separate streets',()=>{
 const positions=c.enemyPositions({x:128,z:128});assert.equal(positions.length,6);
 assert.ok(positions.every(p=>Math.hypot(p.x-128,p.z-128)>=30));
 assert.equal(new Set(positions.map(p=>p.x+','+p.z)).size,6);
 assert.ok(positions.every(p=>['x','z'].includes(p.patrolAxis)));
});
test('ten seconds of grace forbid enemy detection and damage',()=>{
 assert.equal(c.graceAllowsDetection(0),false);
 assert.equal(c.graceAllowsDetection(9.999),false);
 assert.equal(c.graceAllowsDetection(10),true);
});
test('enemy uniform and dummy rings have distinct material palettes',()=>{
 const enemy=c.appearance('enemy'),dummy=c.appearance('dummy');
 assert.notEqual(enemy.body,dummy.rings[0]);assert.ok(dummy.rings.includes('#ffffff'));
 assert.ok(enemy.healthBar);assert.ok(enemy.visor);
});
