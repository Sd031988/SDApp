/* Nordhafen Ops: opt-in drivable vehicle adapter for Freie Stadt.
 * Uses the existing Ops city rules, licensed Quaternius GLBs and Havok physics.
 * No changes to the legacy sd.auto / SD-Fahrzeug engine.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenOpsVehicles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MODELS=Object.freeze([
 {id:'sportscar',name:'Sportwagen'},
 {id:'sportscar2',name:'Sportwagen 2'},
 {id:'suv',name:'SUV'},
 {id:'taxi',name:'Taxi'},
 {id:'cop',name:'Polizeiauto'},
 {id:'normalcar1',name:'Stadtauto 1'},
 {id:'normalcar2',name:'Stadtauto 2'}
]);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function modelChoice(id){return MODELS.some(m=>m.id===id)?id:'sportscar';}
function near(position,vehicle,radius=5.5){
 return !!position&&!!vehicle&&Math.hypot(position.x-vehicle.x,position.z-vehicle.z)<=radius;
}
function keysToInput(keys){
 const has=k=>keys.has(k);
 return {throttle:Number(has('KeyW')||has('ArrowUp'))-Number(has('KeyS')||has('ArrowDown')),
  steer:Number(has('KeyD')||has('ArrowRight'))-Number(has('KeyA')||has('ArrowLeft')),
  brake:has('KeyB')?1:0,handbrake:has('Space')};
}
function canExit(speedKmh){return Number.isFinite(speedKmh)&&Math.abs(speedKmh)<=6;}
function exitPoint(position,heading,side=1){
 const direction=side>=0?1:-1;
 return {x:position.x+Math.cos(heading)*direction*3.1,
  y:Math.max(1,position.y+.35),z:position.z-Math.sin(heading)*direction*3.1};
}
function create({scene,BABYLON,cityRules,spawn,model='sportscar',onStatus=()=>{}}={}){
 if(!scene||!BABYLON||!cityRules||!spawn||!BABYLON.PhysicsAggregate)
  throw new TypeError('vehicle requires Havok scene, Babylon, city rules and spawn');
 const mass=1450,bodyWidth=1.95,bodyLength=4.25;
 const choice=modelChoice(model);
 let disposed=false,driving=false,loadGeneration=0,assetRoot=null,imported=null,modelLoaded=false;
 const chassis=BABYLON.MeshBuilder.CreateBox('ops-vehicle-chassis',
  {width:bodyWidth,height:.72,depth:bodyLength},scene);
 chassis.position=new BABYLON.Vector3(spawn.x,spawn.y??1.05,spawn.z);
 chassis.rotationQuaternion=BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y,spawn.heading||0);
 chassis.isVisible=false;chassis.isPickable=false;chassis.metadata={opsVehicle:true};
 const aggregate=new BABYLON.PhysicsAggregate(chassis,BABYLON.PhysicsShapeType.BOX,
  {mass,friction:.65,restitution:.04},scene);
 aggregate.shape.filterMembershipMask=4;
 aggregate.body.setAngularDamping(.88);
 aggregate.body.setLinearDamping(.08);
 const physics=scene.getPhysicsEngine();
 const ray=typeof BABYLON.PhysicsRaycastResult==='function'?new BABYLON.PhysicsRaycastResult():null;
 let state=cityRules.car(spawn.x,spawn.z,spawn.heading||0),speedKmh=0,steering=0;
 function makeFallback(){
  const root=new BABYLON.TransformNode('ops-car-fallback',scene);root.parent=chassis;
  const paint=new BABYLON.StandardMaterial('ops-car-paint',scene);
  paint.diffuseColor=BABYLON.Color3.FromHexString('#ce3c30');
  const tire=new BABYLON.StandardMaterial('ops-car-tire',scene);
  tire.diffuseColor=BABYLON.Color3.FromHexString('#25292e');
  const cabin=BABYLON.MeshBuilder.CreateBox('ops-car-cabin',{width:1.5,height:.55,depth:2.2},scene);
  cabin.parent=root;cabin.position.y=.48;cabin.material=paint;
  const shell=BABYLON.MeshBuilder.CreateBox('ops-car-shell',{width:1.95,height:.52,depth:4.25},scene);
  shell.parent=root;shell.material=paint;
  for(const x of [-.95,.95])for(const z of [-1.35,1.35]){
   const wheel=BABYLON.MeshBuilder.CreateCylinder('ops-car-wheel',
    {diameter:.68,height:.24,tessellation:14},scene);
   wheel.parent=root;wheel.rotation.z=Math.PI/2;wheel.position.set(x,0,z);wheel.material=tire;
  }
  return root;
 }
 const fallback=makeFallback();
 async function loadModel(){
  const generation=++loadGeneration;
  try{
   if(!BABYLON.SceneLoader?.ImportMeshAsync)throw new Error('GLB-Loader fehlt');
   const result=await BABYLON.SceneLoader.ImportMeshAsync('','./assets/',
    'nordhafen-car-'+choice+'.glb',scene);
   if(disposed||generation!==loadGeneration){
    for(const mesh of result.meshes||[])mesh.dispose?.();
    return;
   }
   const meshes=(result.meshes||[]).filter(m=>m.getBoundingInfo&&m.getTotalVertices?.()>0);
   const bounds=meshes.map(m=>m.getBoundingInfo().boundingBox);
   if(!bounds.length)throw new Error('GLB hat keine Geometrie');
   const min={x:Math.min(...bounds.map(b=>b.minimumWorld.x)),
    y:Math.min(...bounds.map(b=>b.minimumWorld.y)),
    z:Math.min(...bounds.map(b=>b.minimumWorld.z))};
   const max={x:Math.max(...bounds.map(b=>b.maximumWorld.x)),
    y:Math.max(...bounds.map(b=>b.maximumWorld.y)),
    z:Math.max(...bounds.map(b=>b.maximumWorld.z))};
   const scale=Math.min(1.85/Math.max(.01,max.x-min.x),
    1.55/Math.max(.01,max.y-min.y),4.15/Math.max(.01,max.z-min.z));
   if(!Number.isFinite(scale)||scale<=0)throw new Error('Ungültige GLB-Abmessungen');
   const root=new BABYLON.TransformNode('ops-car-visual',scene);
   for(const node of result.meshes||[])if(!node.parent)node.parent=root;
   root.parent=chassis;root.scaling.set(scale,scale,scale);
   root.position.set(-(min.x+max.x)/2*scale,-.34-min.y*scale,-(min.z+max.z)/2*scale);
   assetRoot=root;imported=result;modelLoaded=true;fallback.dispose();
   onStatus('Fahrzeug geladen: '+MODELS.find(m=>m.id===choice).name);
  }catch(error){
   if(!disposed)onStatus('GLB nicht geladen – Ersatzfahrzeug: '+error.message);
  }
 }
 void loadModel();
 function forward(){
  const world=chassis.computeWorldMatrix(true);
  return BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0,0,1),world).normalize();
 }
 function heading(){const f=forward();return Math.atan2(f.x,f.z);}
 function position(){return chassis.position;}
 function enter(at){
  if(disposed||driving||!near(at,chassis.position))return false;
  driving=true;state=cityRules.enter(state,true);return true;
 }
 function exit(){
  if(disposed||!driving||!canExit(speedKmh))return null;
  const point=exitPoint(chassis.position,heading());
  driving=false;state=cityRules.exit(state);return point;
 }
 function suspension(dt){
  if(!ray||!physics?.raycastToRef)return;
  const world=chassis.computeWorldMatrix(true),velocity=aggregate.body.getLinearVelocity();
  for(const x of [-.76,.76])for(const z of [-1.45,1.45]){
   const from=BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(x,-.1,z),world);
   const to=from.add(new BABYLON.Vector3(0,-1,0));
   ray.reset?.();
   physics.raycastToRef(from,to,ray,{collideWith:0xffffffff&~4});
   if(!ray.hasHit||ray.body===aggregate.body||!ray.hitPointWorld)continue;
   const dist=BABYLON.Vector3.Distance(from,ray.hitPointWorld);
   const compression=clamp(.46-dist,0,.35);
   const force=clamp(compression*mass*9.81/(4*.18)-velocity.y*mass*.8,
    0,mass*9.81*.8);
   aggregate.body.applyImpulse(new BABYLON.Vector3(0,force*dt,0),from);
  }
 }
 function update(dt,input={}){
  if(disposed)return;
  const t=clamp(Number.isFinite(dt)?dt:0,0,.05),f=forward();
  const velocity=aggregate.body.getLinearVelocity();
  const longitudinal=BABYLON.Vector3.Dot(velocity,f);
  speedKmh=longitudinal*3.6;
  if(!driving)return;
  const desired=cityRules.drive({...state,heading:heading()},t,input);
  const target=desired.speed,force=clamp((target-longitudinal)*mass*5,-mass*12,mass*9);
  aggregate.body.applyImpulse(f.scale(force*t),chassis.position);
  const angular=aggregate.body.getAngularVelocity(),yawRate=Math.tan(desired.steering)*longitudinal/2.6;
  aggregate.body.setAngularVelocity(new BABYLON.Vector3(
   angular.x,angular.y+clamp(yawRate-angular.y,-2.5*t,2.5*t),angular.z));
  steering=desired.steering;
  suspension(t);
  state={...desired,x:chassis.position.x,z:chassis.position.z,heading:heading()};
 }
 function chase(camera,dt){
  if(!driving||disposed)return;
  const f=forward(),alpha=Math.atan2(-f.z,-f.x);
  const delta=Math.atan2(Math.sin(alpha-camera.alpha),Math.cos(alpha-camera.alpha));
  camera.alpha+=delta*Math.min(1,Math.max(0,dt)*5);
  camera.beta=1.14;camera.radius=9;
  camera.target.copyFrom(chassis.position);
  camera.target.y+=1.25;
 }
 function dispose(){
  if(disposed)return;disposed=true;driving=false;loadGeneration++;
  if(assetRoot)assetRoot.dispose();
  else fallback.dispose();
  for(const group of imported?.animationGroups||[])group.dispose?.();
  aggregate.dispose();chassis.dispose();
 }
 return {enter,exit,update,chase,dispose,position,
  get driving(){return driving;},get speedKmh(){return speedKmh;},
  get modelLoaded(){return modelLoaded;},get model(){return choice;},
  get steering(){return steering;}};
}
return Object.freeze({MODELS,modelChoice,near,keysToInput,canExit,exitPoint,create});
});