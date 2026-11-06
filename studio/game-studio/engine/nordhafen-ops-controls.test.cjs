'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const c=require('./nordhafen-ops-controls.js');
test('shoulder offset moves camera aim right of player',()=>{
 const camera={alpha:0,target:{copyFrom(p){Object.assign(this,p);},addInPlace(v){this.x+=v.x;this.z+=v.z;}}};
 class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z});}scale(n){return new Vector3(this.x*n,this.y*n,this.z*n);}}
 c.shoulder(camera,{x:0,y:1,z:0},{Vector3});
 assert.equal(camera.target.x,.6);assert.equal(camera.target.y,1.45);
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
