/* Opt-in Havok-backed Nordhafen player; no changes to shared game engines. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenPlayerController=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 function create({scene,camera,canvas,BABYLON,motion,fixture}={}){
  if(!scene||!camera||!canvas||!BABYLON||!motion||!fixture)throw new TypeError('player dependencies required');
  let disposed=false,ready=false,player=null,aggregate=null,ground=null,groundBody=null;
  const colliders=new Map(),pressed=new Set();
  let status='Physik wird geladen',last=0;
  function keyDown(e){if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ControlLeft'].includes(e.code)){pressed.add(e.code);e.preventDefault();}}
  function keyUp(e){pressed.delete(e.code);}
  function releaseColliders(){
   for(const group of colliders.values())for(const item of group){item.body.dispose();item.mesh.dispose();}
   colliders.clear();
  }
  async function start(){
   if(disposed)throw new Error('player disposed');
   if(typeof root.HavokPhysics!=='function'||!BABYLON.HavokPlugin||!BABYLON.PhysicsAggregate){
    status='Physik nicht verfügbar';return false;
   }
   try{
    const havok=await root.HavokPhysics();
    if(disposed)return false;
    scene.enablePhysics(new BABYLON.Vector3(0,-9.81,0),new BABYLON.HavokPlugin(true,havok));
    ground=BABYLON.MeshBuilder.CreateGround('player-physics-ground',
      {width:fixture.grid*64,height:fixture.grid*64},scene);
    ground.position.set(fixture.grid*32,0,fixture.grid*32);
    ground.visibility=0;
    ground.isPickable=true;
    groundBody=new BABYLON.PhysicsAggregate(ground,BABYLON.PhysicsShapeType.BOX,
      {mass:0,friction:1},scene);
    player=BABYLON.MeshBuilder.CreateCapsule('nordhafen-player',{height:1.8,radius:.35},scene);
    // Start in the central street grid, away from the world boundary.
    const groundHeight=0,standingHalfHeight=.9;
    player.position.set(fixture.grid*32,groundHeight+standingHalfHeight,fixture.grid*32);
    player.scaling.y=1;
    const playerMaterial=new BABYLON.StandardMaterial('nordhafen-player-material',scene);
    playerMaterial.diffuseColor=new BABYLON.Color3(.95,.22,.12);
    player.material=playerMaterial;
    player.isVisible=true;
    camera.fov=.8;camera.minZ=.1;
    camera.lowerRadiusLimit=1.2;camera.upperRadiusLimit=8;
    camera.lowerBetaLimit=.35;camera.upperBetaLimit=2.7;
    camera.radius=7.5;camera.beta=1.15;
    camera.setTarget(player.position.clone());
    aggregate=new BABYLON.PhysicsAggregate(player,BABYLON.PhysicsShapeType.CAPSULE,
      {mass:1,friction:.7,restitution:0},scene);
    aggregate.body.setMassProperties({inertia:BABYLON.Vector3.Zero()});
    canvas.addEventListener('keydown',keyDown);
    canvas.addEventListener('keyup',keyUp);
    canvas.tabIndex=0;canvas.focus();
    ready=true;status='Spieler aktiv – WASD, Shift, Leertaste, Strg; Ducken: Kollisionsform nicht umgesetzt';
    return true;
   }catch(e){status='Physik nicht verfügbar: '+e.message;return false;}
  }
  function syncColliders(streamer){
   if(!ready||disposed||!streamer)return;
   const ids=new Set(streamer.loadedChunkIds());
   for(const [id,items] of colliders)if(!ids.has(id)){
    for(const item of items){item.body.dispose();item.mesh.dispose();}
    colliders.delete(id);
   }
   for(const id of ids){
    if(colliders.has(id))continue;
    const chunk=fixture.chunks.find(c=>c.id===id);
    if(!chunk)continue;
    const items=[];
    for(const obj of chunk.objects){
     if(obj.type!=='building')continue;
     const mesh=BABYLON.MeshBuilder.CreateBox('player-collider-'+obj.id,{size:1},scene);
     mesh.position.set(chunk.x*64+obj.x,3,chunk.z*64+obj.z);
     mesh.scaling.set(4,6,4);mesh.isVisible=false;
     const body=new BABYLON.PhysicsAggregate(mesh,BABYLON.PhysicsShapeType.BOX,{mass:0},scene);
     items.push({mesh,body});
    }
    colliders.set(id,items);
   }
  }
  function groundedByRaycast(){
   const pos=player.position;
   // From the capsule's lower tip, allow 0.1 m inside plus 0.15 m below it.
   const ray=new BABYLON.Ray(new BABYLON.Vector3(pos.x,pos.y-.9+.1,pos.z),
     new BABYLON.Vector3(0,-1,0),.25);
   const hit=scene.pickWithRay(ray,mesh=>mesh!==player&&mesh.isPickable!==false);
   return !!(hit&&hit.hit&&hit.pickedMesh!==player&&hit.distance<=.25);
  }
  function update(dt){
   if(!ready||disposed)return null;
   const p=player.position;
   const state={x:p.x,y:p.y,z:p.z,vy:aggregate.body.getLinearVelocity().y,
    yaw:Math.atan2(-Math.cos(camera.alpha),-Math.sin(camera.alpha)),grounded:groundedByRaycast()};
   const next=motion.step({forward:Number(pressed.has('KeyW'))-Number(pressed.has('KeyS')),
    right:Number(pressed.has('KeyD'))-Number(pressed.has('KeyA')),
    sprint:pressed.has('ShiftLeft'),crouch:pressed.has('ControlLeft'),
    jump:pressed.has('Space')},state,dt,{gravity:0});
   aggregate.body.setLinearVelocity(new BABYLON.Vector3(next.vx,next.vy,next.vz));
   player.scaling.y=pressed.has('ControlLeft')?next.height/1.8:1;
   camera.target.copyFrom(player.position);
   const view=(motion.thirdPersonCamera||(o=>({beta:Math.max(.35,Math.min(1.3,o.beta)),radius:7.5,targetY:o.playerY})))(
    {playerY:player.position.y,beta:camera.beta});
   camera.target.y=view.targetY;camera.beta=view.beta;camera.radius=view.radius;
   // Close camera (looking up): fade the player so it does not block the view.
   player.visibility=Math.max(.2,Math.min(1,(view.radius-1.2)/2.3));
   return player.position;
  }
  function dispose(){
   if(disposed)return;disposed=true;ready=false;
   canvas.removeEventListener('keydown',keyDown);canvas.removeEventListener('keyup',keyUp);
   releaseColliders();
   if(aggregate)aggregate.dispose();
   if(groundBody)groundBody.dispose();
   if(player){const material=player.material;player.dispose();if(material)material.dispose();}
   if(ground)ground.dispose();
   status='Spieler freigegeben';
  }
  return {start,update,syncColliders,dispose,get status(){return status;},get ready(){return ready;},get playerY(){return player?player.position.y:null;},get grounded(){return ready?groundedByRaycast():false;}};
 }
 return Object.freeze({create});
});
