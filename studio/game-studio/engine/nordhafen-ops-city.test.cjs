'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),city=require('./nordhafen-ops-city.js');
test('enter and exit switch controls and chase camera only when close',()=>{
 const car=city.car();assert.deepEqual(city.enter(car,false),car);
 const inside=city.enter(car,true);assert.equal(inside.controls,'vehicle');assert.equal(inside.camera,'chase');
 const outside=city.exit(inside);assert.equal(outside.controls,'on-foot');assert.equal(outside.camera,'shoulder');
});
test('steering angle is limited and brake stops moving car',()=>{
 let s=city.enter(city.car(),true);
 for(let i=0;i<120;i++)s=city.drive(s,1/60,{throttle:1,steer:10});
 assert.ok(s.steering<=.52);assert.ok(s.speed>0);
 for(let i=0;i<120;i++)s=city.drive(s,1/60,{brake:1});
 assert.equal(s.speed,0);
});
test('vehicle movement is approximately invariant at 30 and 120 fps',()=>{
 function simulate(fps){let s=city.enter(city.car(),true);for(let i=0;i<fps*3;i++)s=city.drive(s,1/fps,{throttle:1,steer:.25});return s;}
 const a=simulate(30),b=simulate(120);
 assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<Math.max(1,Math.hypot(a.x,a.z)*.05));
});
test('traffic stops before obstacle and accelerates on clear road',()=>{
 let s={...city.car(),speed:7};
 for(let i=0;i<60;i++)s=city.traffic(s,1/60,{obstacleDistance:5});
 assert.equal(s.speed,0);
 for(let i=0;i<120;i++)s=city.traffic(s,1/60,{obstacleDistance:100});
 assert.ok(s.speed>0);
});
test('train wraps at loop boundary and carries passenger displacement',()=>{
 assert.equal(city.train(895,1,900,9),4);
 const prev={x:4,z:8},next={x:10,z:9},p={x:5,z:9};
 assert.deepEqual(city.passenger(p,prev,next,true),{x:11,z:10});
 assert.deepEqual(city.passenger(p,prev,next,false),p);
});
test('pedestrians run faster when frightened',()=>{
 const s={x:0,z:0,heading:0};
 assert.ok(city.pedestrian(s,1,{scared:true}).z>city.pedestrian(s,1).z);
});
