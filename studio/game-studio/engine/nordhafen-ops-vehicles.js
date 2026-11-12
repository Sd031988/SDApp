/* Nordhafen Ops: opt-in drivable vehicle adapter for Freie Stadt.
 * Uses the existing Ops city rules, licensed Quaternius GLBs and Havok physics:
 * raycast suspension per wheel, rear-wheel drive, brakes, handbrake and tyre grip.
 * Tuning values live in nordhafen-ops-vehicle-config.js.
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
function defaultConfig(){
 const source=typeof globalThis!=='undefined'&&globalThis.SDNordhafenOpsVehicleConfig;
 if(source)return source.PLAYER_CAR;
 if(typeof require==='function'){try{return require('./nordhafen-ops-vehicle-config.js').PLAYER_CAR;}catch(_){}}
 return null;
}
function maxSteerAt(cfg,speed){
 const t=clamp(Math.abs(speed)/Math.max(1,cfg.maxSpeed),0,1);
 return cfg.maxSteer+(cfg.minSteerAtSpeed-cfg.maxSteer)*t;
}
function create({scene,BABYLON,cityRules,spawn,model='sportscar',onStatus=()=>{},config=defaultConfig()}={}){
 if(!scene||!BABYLON||!cityRules||!spawn||!BABYLON.PhysicsAggregate)
  throw new TypeError('vehicle requires Havok scene, Babylon, city rules and spawn');
 if(!config)throw new TypeError('vehicle requires nordhafen-ops-vehicle-config.js');
 const cfg=config,mass=cfg.mass,V3=BABYLON.Vector3;
 const choice=modelChoice(model);
 let disposed=false,driving=false,loadGeneration=0,assetRoot=null,imported=null,modelLoaded=false;
 const chassis=BABYLON.MeshBuilder.CreateBox('ops-vehicle-chassis',
  {width:cfg.body.width,height:cfg.body.height,depth:cfg.body.depth},scene);
 chassis.position=new V3(spawn.x,spawn.y??cfg.spawnHeight+.1,spawn.z);
 chassis.rotationQuaternion=BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y,spawn.heading||0);
 chassis.isVisible=false;chassis.isPickable=false;chassis.metadata={opsVehicle:true};
 const aggregate=new BABYLON.PhysicsAggregate(chassis,BABYLON.PhysicsShapeType.BOX,
  {mass,friction:.35,restitution:.05},scene);
 aggregate.shape.filterMembershipMask=4;
 const body=aggregate.body;
 body.setAngularDamping(cfg.angularDamping);
 body.setLinearDamping(cfg.linearDamping);
 const comLocal=new V3(0,cfg.centerOfMassY,0);
 if(body.getMassProperties&&body.setMassProperties){
  const props=body.getMassProperties();
  body.setMassProperties({...props,mass,centerOfMass:comLocal});
 }
 const physics=scene.getPhysicsEngine();
 const ray=typeof BABYLON.PhysicsRaycastResult==='function'?new BABYLON.PhysicsRaycastResult():null;
 const wheelLoad=mass*9.81/4;
 const springRate=wheelLoad/cfg.staticCompression;
 const damper=2*cfg.dampingRatio*Math.sqrt(springRate*mass/4);
 const wheels=[[-1,1,true],[1,1,true],[-1,-1,false],[1,-1,false]].map(([sx,sz,front])=>
  ({local:new V3(sx*cfg.wheelX,cfg.wheelY,sz*cfg.wheelZ),front,grounded:false,compression:0,load:0}));
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
 function cross(a,b){return new V3(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);}
 function dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}
 // One Havok step of tyre/suspension forces. Rear-wheel drive, four-wheel brakes,
 // lateral grip limited by wheel load (friction circle approximation).
 function wheelForces(t,input){
  const world=chassis.computeWorldMatrix(true);
  const up=V3.TransformNormal(new V3(0,1,0),world).normalize();
  const f=V3.TransformNormal(new V3(0,0,1),world).normalize();
  const right=cross(up,f);
  const com=V3.TransformCoordinates(comLocal,world);
  const v=body.getLinearVelocity(),w=body.getAngularVelocity();
  const longitudinal=dot(v,f);
  const throttle=driving?clamp(Number(input.throttle)||0,-1,1):0;
  let drive=0,brake=driving?clamp(Number(input.brake)||0,0,1):(Math.abs(longitudinal)>.3?.25:0);
  if(throttle>0){if(longitudinal<-1)brake=Math.max(brake,1);else if(longitudinal<cfg.maxSpeed)drive=cfg.engineForce*throttle;}
  else if(throttle<0){if(longitudinal>1)brake=Math.max(brake,1);else if(longitudinal>-cfg.maxReverseSpeed)drive=cfg.reverseForce*throttle;}
  const handbrake=driving&&!!input.handbrake;
  const target=driving?clamp(Number(input.steer)||0,-1,1)*maxSteerAt(cfg,longitudinal):0;
  steering+=clamp(target-steering,-cfg.steerSpeed*t,cfg.steerSpeed*t);
  const steerF=f.scale(Math.cos(steering)).add(right.scale(Math.sin(steering)));
  const steerR=cross(up,steerF);
  let grounded=0;
  for(const wheel of wheels){
   const from=V3.TransformCoordinates(wheel.local,world);
   const to=from.add(up.scale(-cfg.restLength));
   wheel.grounded=false;wheel.compression=0;wheel.load=0;
   if(!ray||!physics?.raycastToRef)continue;
   ray.reset?.();
   physics.raycastToRef(from,to,ray,{collideWith:0xffffffff&~4});
   if(!ray.hasHit||ray.body===body||!ray.hitPointWorld)continue;
   const dist=V3.Distance(from,ray.hitPointWorld);
   const compression=clamp(cfg.restLength-dist,0,cfg.restLength);
   const r=from.subtract(com);
   const vp=v.add(cross(w,r));
   const closing=-dot(vp,up);
   const load=clamp(springRate*compression+damper*closing,0,wheelLoad*cfg.maxSuspensionForce);
   wheel.grounded=true;wheel.compression=compression;wheel.load=load;grounded++;
   let impulse=up.scale(load*t);
   const fw=wheel.front?steerF:f,rw=wheel.front?steerR:right;
   const vLong=dot(vp,fw),vLat=dot(vp,rw);
   const limit=(wheel.front?cfg.gripFront:cfg.gripRear)*load;
   const sideGrip=!wheel.front&&handbrake?cfg.handbrakeRearGrip:1;
   let longForce=0;
   if(!wheel.front)longForce+=drive/2;
   const stopping=brake*cfg.brakeForce/4+(handbrake&&!wheel.front?cfg.handbrakeForce/2:0);
   if(stopping>0&&Math.abs(vLong)>.05)longForce-=Math.sign(vLong)*Math.min(stopping,Math.abs(vLong)*mass/4/t);
   longForce=clamp(longForce,-limit,limit);
   // Friction circle, softened: drive/brake force only partly reduces side grip.
   const latLimit=Math.sqrt(Math.max(0,limit*limit-.35*longForce*longForce))*sideGrip;
   const latForce=clamp(-vLat*cfg.corneringStiffness*mass/4,-latLimit,latLimit);
   impulse=impulse.add(fw.scale(longForce*t)).add(rw.scale(latForce*t));
   body.applyImpulse(impulse,from);
  }
  if(grounded>0){
   const resist=cfg.rollingResistance*Math.sign(longitudinal)*Math.min(1,Math.abs(longitudinal))
    +cfg.airDrag*longitudinal*Math.abs(longitudinal);
   body.applyImpulse(f.scale(-resist*t),com);
  }
  return {longitudinal,grounded};
 }
 function update(dt,input={}){
  if(disposed)return;
  const t=clamp(Number.isFinite(dt)?dt:0,0,.05);
  if(t<=0)return;
  const result=wheelForces(t,input);
  speedKmh=result.longitudinal*3.6;
  if(!driving)return;
  state={...state,speed:result.longitudinal,steering,x:chassis.position.x,z:chassis.position.z,heading:heading()};
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
  get steering(){return steering;},
  get wheelsOnGround(){return wheels.filter(w=>w.grounded).length;},
  get physicsBody(){return body;}};
}
return Object.freeze({MODELS,modelChoice,near,keysToInput,canExit,exitPoint,create});
});