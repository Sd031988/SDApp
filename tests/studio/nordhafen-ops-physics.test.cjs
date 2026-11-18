'use strict';
/* Nordhafen Ops: real Havok (WASM) driving tests in Node with Babylon's NullEngine.
 * Requires the npm packages babylonjs and @babylonjs/havok (CI installs them with
 * `npm install --no-save babylonjs @babylonjs/havok`). No rendering, no browser:
 * this proves the physics, not the look or the frame rate.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const engineDir=path.resolve(__dirname,'../../studio/game-studio/engine');
const BABYLON=require('babylonjs');
const HavokPhysics=require('@babylonjs/havok');
const vehicles=require(path.join(engineDir,'nordhafen-ops-vehicles.js'));
const traffic=require(path.join(engineDir,'nordhafen-ops-traffic.js'));
const city=require(path.join(engineDir,'nordhafen-ops-city.js'));
const {PLAYER_CAR}=require(path.join(engineDir,'nordhafen-ops-vehicle-config.js'));
const STEP=1/60;
let havok;
test.before(async()=>{
 const wasm=fs.readFileSync(require.resolve('@babylonjs/havok/lib/umd/HavokPhysics.wasm'));
 havok=await HavokPhysics({wasmBinary:wasm});
});
function world({wallAt=null,spawn={x:0,z:0,heading:0}}={}){
 const engine=new BABYLON.NullEngine();
 const scene=new BABYLON.Scene(engine);
 scene.enablePhysics(new BABYLON.Vector3(0,-9.81,0),new BABYLON.HavokPlugin(false,havok));
 new BABYLON.FreeCamera('test-camera',new BABYLON.Vector3(0,5,-10),scene);
 const ground=BABYLON.MeshBuilder.CreateBox('ground',{width:2000,height:1,depth:2000},scene);
 ground.position.y=-.5;
 new BABYLON.PhysicsAggregate(ground,BABYLON.PhysicsShapeType.BOX,{mass:0,friction:1},scene);
 if(wallAt!==null){
  // Same kind of static Havok box the city streamer creates for buildings.
  const wall=BABYLON.MeshBuilder.CreateBox('building-collider',{width:30,height:8,depth:2},scene);
  wall.position.set(0,4,wallAt+1);
  new BABYLON.PhysicsAggregate(wall,BABYLON.PhysicsShapeType.BOX,{mass:0},scene);
 }
 const car=vehicles.create({scene,BABYLON,cityRules:city,spawn:{x:spawn.x,y:1.05,z:spawn.z,heading:spawn.heading},model:'suv'});
 const run=(seconds,input={},each)=>{
  for(let i=0;i<Math.round(seconds/STEP);i++){car.update(STEP,input);scene.render();each?.(car);}
 };
 const up=()=>BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0,1,0),scene.getMeshByName('ops-vehicle-chassis').computeWorldMatrix(true)).y;
 const dispose=()=>{car.dispose();scene.dispose();engine.dispose();};
 return {scene,car,run,up,dispose};
}
function heading(scene){
 const m=scene.getMeshByName('ops-vehicle-chassis').computeWorldMatrix(true);
 const f=BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0,0,1),m);
 return Math.atan2(f.x,f.z);
}
test('car settles on its four suspended wheels without falling through the road',()=>{
 const w=world();
 w.run(2);
 assert.equal(w.car.wheelsOnGround,4);
 const y=w.car.position().y;
 assert.ok(y>.4&&y<.9,'chassis height '+y.toFixed(2));
 assert.ok(Math.abs(w.car.speedKmh)<1,'stands still without input');
 assert.ok(w.up()>.98,'upright');
 w.dispose();
});
test('throttle accelerates and the speed limit holds',()=>{
 const w=world();
 w.run(1);
 w.car.enter(w.car.position());
 w.run(3,{throttle:1});
 const after3=w.car.speedKmh;
 assert.ok(after3>35,'0→'+after3.toFixed(1)+' km/h in 3 s');
 w.run(12,{throttle:1});
 assert.ok(w.car.speedKmh<=PLAYER_CAR.maxSpeed*3.6+3,'max '+w.car.speedKmh.toFixed(1)+' km/h');
 assert.ok(w.car.speedKmh>PLAYER_CAR.maxSpeed*3.6-8,'reaches top speed');
 assert.ok(w.up()>.95,'stays upright at speed');
 w.dispose();
});
test('brake stops the car from top speed on a plausible distance',()=>{
 const w=world();
 w.run(1);w.car.enter(w.car.position());
 w.run(15,{throttle:1});
 const start=w.car.position().z,v0=w.car.speedKmh;
 w.run(5,{brake:1});
 const distance=w.car.position().z-start;
 assert.ok(Math.abs(w.car.speedKmh)<1,'stopped, now '+w.car.speedKmh.toFixed(1));
 assert.ok(distance>10&&distance<45,'braking distance '+distance.toFixed(1)+' m from '+v0.toFixed(0)+' km/h');
 assert.ok(w.car.exit(),'exit allowed once stopped');
 w.dispose();
});
test('S brakes when moving forward and reverses when stopped',()=>{
 const w=world();
 w.run(1);w.car.enter(w.car.position());
 w.run(3,{throttle:1});
 w.run(4,{throttle:-1});
 assert.ok(w.car.speedKmh<0,'driving backwards: '+w.car.speedKmh.toFixed(1));
 assert.ok(w.car.speedKmh>=-PLAYER_CAR.maxReverseSpeed*3.6-2,'reverse limit');
 w.dispose();
});
test('steering right turns the car right through tyre forces (no rotation override, no spin)',()=>{
 const w=world();
 w.run(1);w.car.enter(w.car.position());
 w.run(2,{throttle:1});
 const h0=heading(w.scene);
 w.run(1.5,{throttle:.6,steer:1});
 const d=heading(w.scene)-h0,turned=Math.atan2(Math.sin(d),Math.cos(d));
 assert.ok(turned>.5&&turned<2.4,'turned '+(turned*180/Math.PI).toFixed(0)+'° to the right');
 assert.ok(w.car.position().x>2,'moved towards +x');
 const v=w.car.physicsBody.getLinearVelocity(),h=heading(w.scene);
 const slip=Math.abs(Math.atan2(Math.sin(Math.atan2(v.x,v.z)-h),Math.cos(Math.atan2(v.x,v.z)-h)));
 assert.ok(slip<.45,'slip angle '+(slip*180/Math.PI).toFixed(0)+'° – car is not spinning');
 assert.ok(w.up()>.9,'no rollover in the turn');
 w.run(2,{throttle:.3});
 assert.ok(Math.abs(w.car.physicsBody.getAngularVelocity().y)<.6,'straightens out when the wheel is released');
 w.dispose();
});
test('handbrake slows the car and loosens the rear',()=>{
 const w=world();
 w.run(1);w.car.enter(w.car.position());
 w.run(4,{throttle:1});
 const v0=w.car.speedKmh;
 w.run(1.5,{handbrake:true});
 assert.ok(w.car.speedKmh<v0-15,'handbrake '+v0.toFixed(0)+'→'+w.car.speedKmh.toFixed(0)+' km/h');
 w.dispose();
});
test('a building wall stops the car – no driving through',()=>{
 const w=world({wallAt:25});
 w.run(1);w.car.enter(w.car.position());
 let maxZ=-Infinity;
 w.run(8,{throttle:1},car=>{maxZ=Math.max(maxZ,car.position().z);});
 const front=maxZ+PLAYER_CAR.body.depth/2;
 assert.ok(front<25.3,'car front reached z='+front.toFixed(2)+' (wall at 25)');
 assert.ok(w.car.position().z<25,'still in front of the wall');
 assert.ok(w.car.position().y>.2,'did not fall through the road');
 w.dispose();
});
test('AI traffic cars carry kinematic Havok colliders that block the player car',()=>{
 const engine=new BABYLON.NullEngine(),scene=new BABYLON.Scene(engine);
 scene.enablePhysics(new BABYLON.Vector3(0,-9.81,0),new BABYLON.HavokPlugin(false,havok));
 new BABYLON.FreeCamera('test-camera',new BABYLON.Vector3(0,5,-10),scene);
 const ground=BABYLON.MeshBuilder.CreateBox('ground',{width:1200,height:1,depth:1200},scene);ground.position.set(256,-.5,256);
 new BABYLON.PhysicsAggregate(ground,BABYLON.PhysicsShapeType.BOX,{mass:0,friction:1},scene);
 const cars=traffic.create({scene,BABYLON,cityRules:city,worldSize:512,count:4,seed:7});
 const target=traffic.plan(512,4,7)[0];
 cars.update(STEP,{x:target.x,z:target.z});
 scene.render();
 const colliders=cars.colliders;
 assert.equal(colliders.length,4,'one collider per AI car');
 const near=colliders[0];
 assert.ok(Math.hypot(near.position.x-cars.positions[0].x,near.position.z-cars.positions[0].z)<.01,'collider follows the AI car');
 assert.equal(near.physicsBody.getMotionType(),BABYLON.PhysicsMotionType.ANIMATED,'kinematic, no driving physics');
 // Freeze traffic and drive the player car into the first AI car from the side.
 const ai=cars.positions[0];
 const axis=target.axis;
 const spawn=axis==='z'?{x:ai.x-14,z:ai.z,heading:Math.PI/2}:{x:ai.x,z:ai.z-14,heading:0};
 const car=vehicles.create({scene,BABYLON,cityRules:city,spawn:{...spawn,y:1.05},model:'suv'});
 for(let i=0;i<60;i++){car.update(STEP,{});scene.render();}
 car.enter(car.position());
 let closest=Infinity;
 for(let i=0;i<300;i++){
  car.update(STEP,{throttle:1});scene.render();
  const p=car.position();closest=Math.min(closest,Math.hypot(p.x-ai.x,p.z-ai.z));
 }
 // Centres can never get closer than the half widths of both boxes (0.9 + 0.975).
 assert.ok(closest>1.7,'player car stopped at the AI car, centre distance '+closest.toFixed(2)+' m');
 car.dispose();cars.dispose();scene.dispose();engine.dispose();
});
test('the car drives over a 15 cm curb – it bumps but does not take off or get stuck',()=>{
 const streets=require(path.join(engineDir,'nordhafen-ops-streets.js'));
 for(const [label,throttle,seconds] of [['slow',.3,6],['fast',1,3.2]]){
  const engine=new BABYLON.NullEngine(),scene=new BABYLON.Scene(engine);
  scene.enablePhysics(new BABYLON.Vector3(0,-9.81,0),new BABYLON.HavokPlugin(false,havok));
  new BABYLON.FreeCamera('test-camera',new BABYLON.Vector3(0,5,-10),scene);
  const ground=BABYLON.MeshBuilder.CreateBox('ground',{width:1200,height:1,depth:1200},scene);ground.position.set(256,-.5,256);
  new BABYLON.PhysicsAggregate(ground,BABYLON.PhysicsShapeType.BOX,{mass:0,friction:1},scene);
  const walks=streets.create({scene,BABYLON,worldSize:512});
  assert.equal(walks.colliderCount,256,'every sidewalk strip is a Havok collider');
  // Road of the street at x=256..269, heading +x across the sidewalk at x=266..269.
  const car=vehicles.create({scene,BABYLON,cityRules:city,spawn:{x:259,y:1.05,z:300,heading:Math.PI/2},model:'suv'});
  for(let i=0;i<60;i++){car.update(STEP,{});scene.render();}
  const restY=car.position().y;
  car.enter(car.position());
  let maxY=-Infinity,minWheels=4,maxUpTilt=1;
  for(let i=0;i<Math.round(seconds/STEP);i++){
   car.update(STEP,{throttle});scene.render();
   maxY=Math.max(maxY,car.position().y);minWheels=Math.min(minWheels,car.wheelsOnGround);
   const up=BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0,1,0),scene.getMeshByName('ops-vehicle-chassis').computeWorldMatrix(true)).y;
   maxUpTilt=Math.min(maxUpTilt,up);
  }
  assert.ok(car.position().x>272,label+': crossed the curb, x='+car.position().x.toFixed(1));
  assert.ok(maxY<restY+.45,label+': no take-off (max height +'+(maxY-restY).toFixed(2)+' m)');
  assert.ok(maxUpTilt>.9,label+': stays upright over the curb');
  assert.ok(minWheels>=2,label+': at least two wheels keep contact');
  car.dispose();walks.dispose();scene.dispose();engine.dispose();
 }
});
