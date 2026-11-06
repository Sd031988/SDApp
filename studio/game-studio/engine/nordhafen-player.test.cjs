'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {step}=require('./nordhafen-player-motion.js');
const {create}=require('./nordhafen-player-controller.js');
const base={x:0,y:1,z:0,vy:0,yaw:0,grounded:true};
test('diagonal movement is normalized',()=>{
 const a=step({forward:1},base,1/60),b=step({forward:1,right:1},base,1/60);
 assert.ok(Math.abs(Math.hypot(b.vx,b.vz)-Math.hypot(a.vx,a.vz))<1e-9);
});
test('sprinting is faster than walking',()=>{
 assert.ok(step({forward:1,sprint:true},base,.02).vz>step({forward:1},base,.02).vz);
});
test('jump impulse only while grounded',()=>{
 assert.ok(step({jump:true},base,.02).vy>0);
 assert.ok(step({jump:true},{...base,grounded:false},.02).vy<=0);
});
test('crouching lowers capsule height and movement speed',()=>{
 const walk=step({forward:1},base,.02),crouch=step({forward:1,crouch:true},base,.02);
 assert.ok(crouch.height<1.8);assert.ok(crouch.vz<walk.vz);
});
test('large dt is clamped to 50 milliseconds',()=>{
 assert.equal(step({forward:1},base,5).dt,.05);
 assert.ok(step({forward:1},base,5).z<=.2);
});
test('without Havok controller reports physics unavailable and does not crash',async()=>{
 const canvas={addEventListener(){},removeEventListener(){}};
 const ctrl=create({scene:{},camera:{},canvas,BABYLON:{},motion:{step},fixture:{chunks:[]}});
 assert.equal(await ctrl.start(),false);
 assert.match(ctrl.status,/Physik nicht verfügbar/);
 ctrl.dispose();ctrl.dispose();
});
