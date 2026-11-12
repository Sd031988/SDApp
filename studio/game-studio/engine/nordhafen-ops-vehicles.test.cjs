'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const vehicles=require('./nordhafen-ops-vehicles.js');
const city=require('./nordhafen-ops-city.js');
test('all seven licensed vehicle choices exist and unknown choices fall back safely',()=>{
 assert.equal(vehicles.MODELS.length,7);
 assert.equal(new Set(vehicles.MODELS.map(m=>m.id)).size,7);
 for(const model of vehicles.MODELS){
  assert.equal(vehicles.modelChoice(model.id),model.id);
  assert.ok(fs.existsSync(path.join(__dirname,'assets','nordhafen-car-'+model.id+'.glb')),model.id);
 }
 assert.equal(vehicles.modelChoice('../danger'),'sportscar');
});
test('F enters only near a vehicle and exit point stays clear of chassis',()=>{
 const car={x:36,z:32};
 assert.equal(vehicles.near({x:32,z:32},car),true);
 assert.equal(vehicles.near({x:12,z:12},car),false);
 assert.equal(vehicles.near(null,car),false);
 assert.equal(vehicles.canExit(6),true);
 assert.equal(vehicles.canExit(6.1),false);
 assert.equal(vehicles.canExit(-30),false);
 const point=vehicles.exitPoint({x:36,y:1,z:32},0);
 assert.ok(Math.hypot(point.x-36,point.z-32)>=3);
 assert.ok(point.y>=1);
});
test('keyboard and touch key mapping is stable, supports reverse, brake and handbrake',()=>{
 assert.deepEqual(vehicles.keysToInput(new Set()),{throttle:0,steer:0,brake:0,handbrake:false});
 assert.deepEqual(vehicles.keysToInput(new Set(['KeyW','KeyA','Space'])),
  {throttle:1,steer:-1,brake:0,handbrake:true});
 assert.deepEqual(vehicles.keysToInput(new Set(['ArrowDown','ArrowRight','KeyB'])),
  {throttle:-1,steer:1,brake:1,handbrake:false});
});
test('Free City page wires controller, physics car, F key, mobile UI and has compiling inline scripts',()=>{
 const html=fs.readFileSync(path.join(__dirname,'nordhafen-ops.html'),'utf8');
 const controller=fs.readFileSync(path.join(__dirname,'nordhafen-player-controller.js'),'utf8');
 assert.match(html,/nordhafen-ops-city\.js/);
 assert.match(html,/nordhafen-ops-vehicles\.js/);
 assert.match(html,/function toggleVehicle\(/);
 assert.match(html,/KeyF/);
 assert.match(html,/vehicles\.update\(dt/);
 assert.match(html,/vehicles\.chase\(camera,dt\)/);
 assert.match(html,/data-drive-key="KeyW"/);
 assert.match(html,/player\.setVehicleMode\(true\)/);
 assert.match(controller,/function setVehicleMode\(/);
 const inline=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 assert.ok(inline.length>0);
 for(const [i,code] of inline.entries())assert.doesNotThrow(()=>new vm.Script(code,{filename:'ops-inline-'+i+'.js'}));
});
test('Havok-backed car accepts input and invokes a physical impulse without teleporting',async()=>{
 class V{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){Object.assign(this,{x,y,z});return this;}
  copyFrom(v){return this.set(v.x,v.y,v.z);}
  scale(n){return new V(this.x*n,this.y*n,this.z*n);}
  add(v){return new V(this.x+v.x,this.y+v.y,this.z+v.z);}
  normalize(){return this;}
  static Dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}
  static TransformNormal(v){return v;}
  static TransformCoordinates(v){return v;}
  static Distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}
 }
 class Node{
  constructor(){this.position=new V();this.rotation={};this.scaling=new V(1,1,1);this.parent=null;}
  computeWorldMatrix(){return {};}
  dispose(){this.disposed=true;}
 }
 const impulses=[];let linear=new V();
 const body={
  setAngularDamping(){},setLinearDamping(){},
  getLinearVelocity(){return linear;},getAngularVelocity(){return new V();},
  applyImpulse(impulse){impulses.push(impulse);linear=linear.add(impulse.scale(1/1450));},
  setAngularVelocity(){},
 };
 class Aggregate{
  constructor(){this.body=body;this.shape={};}
  dispose(){}
 }
 const BABYLON={
  Vector3:V,Axis:{Y:new V(0,1,0)},Quaternion:{RotationAxis:()=>({})},
  PhysicsAggregate:Aggregate,PhysicsShapeType:{BOX:1},
  MeshBuilder:{CreateBox:()=>new Node(),CreateCylinder:()=>new Node()},
  TransformNode:Node,StandardMaterial:class{},Color3:{FromHexString:()=>({})},
  SceneLoader:{ImportMeshAsync:async()=>{throw Error('offline test');}}
 };
 const instance=vehicles.create({scene:{getPhysicsEngine:()=>null},BABYLON,cityRules:city,spawn:{x:36,y:1,z:32}});
 assert.equal(instance.enter({x:32,z:32}),true);
 for(let i=0;i<240;i++)instance.update(1/60,{throttle:1});
 assert.ok(impulses.length>0,'Havok body received impulses');
 assert.ok(instance.speedKmh>0,'accelerated');
 assert.equal(instance.exit(),null,'unsafe exit while moving');
 assert.equal(instance.driving,true);
 instance.dispose();
});
