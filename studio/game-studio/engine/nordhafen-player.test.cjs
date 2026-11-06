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

test('Havok gravity=0 preserves vertical velocity except for grounded jump',()=>{
 const airborne={...base,grounded:false,vy:-3.25};
 assert.equal(step({},airborne,.05,{gravity:0}).vy,-3.25);
 assert.equal(step({jump:true},base,.05,{gravity:0}).vy,5.5);
 assert.ok(step({},airborne,.05).vy<-3.25);
});
test('Havok controller locks capsule inertia and grounds via downward raycast, not height',async()=>{
 const previous=globalThis.HavokPhysics;
 globalThis.HavokPhysics=async()=>({});
 let inertia,ray,rayPredicate,rayHit=false,lastVelocity=null;
 class Vector3{
  constructor(x,y,z){Object.assign(this,{x,y,z});}
  static Zero(){return new Vector3(0,0,0);}
 }
 class Aggregate{
  constructor(mesh){this.mesh=mesh;this.body={
   setMassProperties(v){inertia=v.inertia;},
   getLinearVelocity(){return {x:0,y:-2,z:0};},
   setLinearVelocity(v){lastVelocity=v;},
   dispose(){}
  };}
  dispose(){}
 }
 let ctrlMesh;
 const makeMesh=()=>({
  position:{x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}},
  scaling:{y:1,set(){}},visibility:1,isPickable:true,dispose(){}
 });
 const BABYLON={Vector3,
 StandardMaterial:class{constructor(name,scene){this.name=name;this.scene=scene;this.diffuseColor=null;this.emissiveColor=null;}dispose(){}},
 Color3:class{constructor(r,g,b){Object.assign(this,{r,g,b});}},
 Ray:class{constructor(origin,direction,length){
  Object.assign(this,{origin,direction,length});ray=this;
 }},HavokPlugin:class{},PhysicsAggregate:Aggregate,
 PhysicsShapeType:{BOX:1,CAPSULE:2},
 MeshBuilder:{CreateGround:makeMesh,CreateCapsule:()=>{ctrlMesh=makeMesh();return ctrlMesh;},CreateBox:makeMesh}};
 const scene={enablePhysics(){},pickWithRay(r,predicate){
  rayPredicate=predicate;return {hit:rayHit,distance:.1,pickedMesh:{isPickable:true}};
 }};
 const listeners={};
 const canvas={addEventListener(type,cb){listeners[type]=cb;},removeEventListener(){},focus(){},tabIndex:0};
 const camera={alpha:0,target:{copyFrom(){}},setTarget(){}};
 const ctrl=create({scene,camera,canvas,BABYLON,motion:{step},fixture:{grid:1,chunks:[]}});
 try{
  assert.equal(await ctrl.start(),true);
  assert.ok(ctrlMesh.material,'player mesh receives a material');
  assert.deepEqual(inertia,Vector3.Zero());
  ctrl.update(.02);
  assert.equal(ray.length,.1+.15,'ray covers 10 cm capsule inset plus 15 cm below');
  assert.equal(ray.direction.y,-1);
  assert.equal(lastVelocity.y,-2,'no extra gravitational acceleration');
  listeners.keydown({code:'Space',preventDefault(){}});
  ctrl.update(.02);
  assert.equal(lastVelocity.y,-2,'airborne raycast must not allow jump');
  rayHit=true;
  ctrl.update(.02);
  assert.equal(lastVelocity.y,5.5,'ground contact from raycast allows jump');
  assert.equal(rayPredicate({isPickable:true}),true);
  ctrl.dispose();
 }finally{globalThis.HavokPhysics=previous;}
});
