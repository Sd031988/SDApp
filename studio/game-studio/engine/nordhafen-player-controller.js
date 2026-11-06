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
    player.position.set(32,.9,32);
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
     new BABYLON.Vector3(0,-1,0),.15);
   const hit=scene.pickWithRay(ray,mesh=>mesh!==player&&mesh.isPickable!==false);
   return !!(hit&&hit.hit&&hit.pickedMesh!==player&&hit.distance<=.15);
  }
  function update(dt){
   if(!ready||disposed)return null;
   const p=player.position;
   const state={x:p.x,y:p.y,z:p.z,vy:aggregate.body.getLinearVelocity().y,
    yaw:camera.alpha+Math.PI/2,grounded:groundedByRaycast()};
   const next=motion.step({forward:Number(pressed.has('KeyW'))-Number(pressed.has('KeyS')),
    right:Number(pressed.has('KeyD'))-Number(pressed.has('KeyA')),
    sprint:pressed.has('ShiftLeft'),crouch:pressed.has('ControlLeft'),
    jump:pressed.has('Space')},state,dt,{gravity:0});
   aggregate.body.setLinearVelocity(new BABYLON.Vector3(next.vx,next.vy,next.vz));
   player.scaling.y=next.height/1.8;
   camera.target.copyFrom(player.position);
   return player.position;
  }
  function dispose(){
   if(disposed)return;disposed=true;ready=false;
   canvas.removeEventListener('keydown',keyDown);canvas.removeEventListener('keyup',keyUp);
   releaseColliders();
   if(aggregate)aggregate.dispose();
   if(groundBody)groundBody.dispose();
   if(player)player.dispose();
   if(ground)ground.dispose();
   status='Spieler freigegeben';
  }
  return {start,update,syncColliders,dispose,get status(){return status;},get ready(){return ready;}};
 }
 return Object.freeze({create});
});
