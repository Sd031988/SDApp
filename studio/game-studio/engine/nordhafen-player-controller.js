/* Opt-in Havok-backed Nordhafen player; no changes to shared game engines. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenPlayerController=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 function create({scene,camera,canvas,BABYLON,motion,fixture,cityGeometry}={}){
  if(!scene||!camera||!canvas||!BABYLON||!motion||!fixture)throw new TypeError('player dependencies required');
  let disposed=false,ready=false,driving=false,player=null,aggregate=null,ground=null,groundBody=null;
  let vehicleMasks=null,vehiclePrestep=null,teleportPending=false;
  const colliders=new Map(),pressed=new Set();
  let status='Physik wird geladen',facing=null,character=null,characterState='lädt',animation='idle',modelGeneration=0;
  const pointerDocument=canvas.ownerDocument||(typeof document!=='undefined'?document:null);
  function pointerClick(){if(ready&&canvas.requestPointerLock)canvas.requestPointerLock();}
  function pointerMove(e){if(!ready||!pointerDocument||pointerDocument.pointerLockElement!==canvas)return;
   camera.alpha-=(e.movementX||0)*.0025;
   camera.beta=Math.max(camera.lowerBetaLimit??.35,Math.min(camera.upperBetaLimit??2.7,camera.beta-(e.movementY||0)*.0025));
  }
  function pointerChange(){if(ready)status='Spieler aktiv – WASD, Shift, Leertaste, Strg; Maus: '+(pointerDocument&&pointerDocument.pointerLockElement===canvas?'gefangen (Esc zum Freigeben)':'frei')+'; Ducken: Kollisionsform nicht umgesetzt';}
  function keyDown(e){if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ControlLeft'].includes(e.code)){pressed.add(e.code);e.preventDefault();}}
  function keyUp(e){pressed.delete(e.code);}
  function releaseColliders(){
   for(const group of colliders.values())for(const item of group){item.body.dispose();item.mesh.dispose();}
   colliders.clear();
  }
  function releaseCharacter(){
   if(!character)return;
   for(const group of character.groups){group.stop?.();group.dispose?.();}
   for(const mesh of character.meshes)mesh.dispose?.();
   character.root.dispose?.();character=null;
  }
  async function loadCharacter(){
   const generation=++modelGeneration;
   let loaded=null,rootNode=null;
   try{
    if(!BABYLON.SceneLoader?.ImportMeshAsync||!BABYLON.TransformNode)throw new Error('GLB-Loader nicht verfügbar');
    loaded=await BABYLON.SceneLoader.ImportMeshAsync('', './assets/', 'nordhafen-player-rogue.glb', scene);
    const meshes=loaded.meshes||[],groups=loaded.animationGroups||[];
    if(disposed||generation!==modelGeneration){for(const g of groups)g.dispose?.();for(const m of meshes)m.dispose?.();return;}
    const named=Object.fromEntries(['idle','walk','run'].map(name=>[name,groups.find(g=>g.name.toLowerCase()===name)]));
    if(!meshes.length||Object.values(named).some(g=>!g))throw new Error('Modell oder Idle/Walk/Run-Animation fehlt');
    rootNode=new BABYLON.TransformNode('nordhafen-character-root',scene);
    const bounds=meshes.filter(m=>m.getBoundingInfo&&m.getTotalVertices?.()>0).map(m=>m.getBoundingInfo().boundingBox);
    if(!bounds.length)throw new Error('Modell-Bounding-Box fehlt');
    const minY=Math.min(...bounds.map(b=>b.minimumWorld.y)),maxY=Math.max(...bounds.map(b=>b.maximumWorld.y));
    if(!(maxY>minY))throw new Error('Ungültige Modellhöhe');
    const scale=1.8/(maxY-minY);
    // Keep imported skeleton hierarchy intact: parent only root-level nodes.
    const importedRoots=meshes.filter(m=>!m.parent);
    for(const mesh of importedRoots)mesh.parent=rootNode;
    rootNode.scaling.set(scale,scale,scale);
    rootNode.position.y=-.9-minY*scale;
    // Only locomotion groups should advance; preserve other groups for future actions.
    for(const group of groups){
     if(Object.values(named).includes(group)){
      group.start?.(true);group.setWeightForAllAnimatables?.(0);
     }else group.stop?.();
    }
    named.idle.setWeightForAllAnimatables?.(1);
    character={root:rootNode,meshes,groups,named,floorY:minY,weights:{idle:1,walk:0,run:0}};
    if(driving)rootNode.setEnabled(false);
    characterState='Modell geladen';player.visibility=0;
   }catch(e){
    if(rootNode)rootNode.dispose?.();
    for(const g of loaded?.animationGroups||[])g.dispose?.();
    for(const m of loaded?.meshes||[])m.dispose?.();
    if(!disposed&&generation===modelGeneration){characterState='Figur-Modell nicht geladen: '+e.message;player.visibility=1;}
   }
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
    canvas.addEventListener('click',pointerClick);
    if(pointerDocument){pointerDocument.addEventListener('mousemove',pointerMove);pointerDocument.addEventListener('pointerlockchange',pointerChange);}
    canvas.tabIndex=0;canvas.focus();
    ready=true;pointerChange();
    void loadCharacter();
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
     const dimensions=cityGeometry&&cityGeometry.footprint&&cityGeometry.height?
      {...cityGeometry.footprint(1337,obj),height:cityGeometry.height(1337,obj)}:{width:4,depth:4,height:6};
     mesh.position.set(chunk.x*fixture.chunkSize+obj.x,dimensions.height/2,chunk.z*fixture.chunkSize+obj.z);
     mesh.scaling.set(dimensions.width,dimensions.height,dimensions.depth);mesh.isVisible=false;mesh.isPickable=false;
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
  function setVehicleMode(active,exitPosition){
   if(!ready||disposed||!aggregate?.body.setMotionType)return false;
   if(!!active===driving)return true;
   pressed.clear();
   const body=aggregate.body;
   if(active){
    vehicleMasks={membership:aggregate.shape.filterMembershipMask,collide:aggregate.shape.filterCollideMask};
    vehiclePrestep=body.getPrestepType?.();
    body.setLinearVelocity(BABYLON.Vector3.Zero());
    body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);
    aggregate.shape.filterMembershipMask=0;aggregate.shape.filterCollideMask=0;
    player.visibility=0;player.isPickable=false;
    if(character)character.root.setEnabled(false);
    driving=true;
   }else{
    const p=exitPosition||player.position;
    const destination=new BABYLON.Vector3(p.x,Math.max(1,p.y??1),p.z);
    player.position.copyFrom(destination);
    body.setMotionType(BABYLON.PhysicsMotionType.DYNAMIC);
    // Havok's setTargetTransform sets a *velocity* for animated bodies; a
    // one-step TELEPORT prestep is required to restore the capsule at the car.
    if(body.setPrestepType&&BABYLON.PhysicsPrestepType&&scene.onAfterPhysicsObservable?.addOnce){
     teleportPending=true;
     body.setPrestepType(BABYLON.PhysicsPrestepType.TELEPORT);
     scene.onAfterPhysicsObservable.addOnce(()=>{
      if(disposed)return;
      body.setPrestepType(vehiclePrestep??BABYLON.PhysicsPrestepType.DISABLED);
      teleportPending=false;
     });
    }else body.setTargetTransform?.(destination,BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y,player.rotation.y||0));
    aggregate.shape.filterMembershipMask=vehicleMasks?.membership??0xffffffff;
    aggregate.shape.filterCollideMask=vehicleMasks?.collide??0xffffffff;
    body.setLinearVelocity(BABYLON.Vector3.Zero());
    vehicleMasks=null;driving=false;
    player.isPickable=true;
    if(character)character.root.setEnabled(true);
   }
   return true;
  }
  function update(dt){
   if(!ready||disposed)return null;
   if(driving||teleportPending)return player.position;
   const p=player.position;
   const state={x:p.x,y:p.y,z:p.z,vy:aggregate.body.getLinearVelocity().y,
    yaw:Math.atan2(-Math.cos(camera.alpha),-Math.sin(camera.alpha)),grounded:groundedByRaycast()};
   const next=motion.step({forward:Number(pressed.has('KeyW'))-Number(pressed.has('KeyS')),
    right:Number(pressed.has('KeyD'))-Number(pressed.has('KeyA')),
    sprint:pressed.has('ShiftLeft'),crouch:pressed.has('ControlLeft'),
    jump:pressed.has('Space')},state,dt,{gravity:0});
   aggregate.body.setLinearVelocity(new BABYLON.Vector3(next.vx,next.vy,next.vz));
   player.scaling.y=pressed.has('ControlLeft')?next.height/1.8:1;
   animation=Math.hypot(next.vx,next.vz)<.05?'idle':pressed.has('ShiftLeft')&&!pressed.has('ControlLeft')?'run':'walk';
   if(Math.hypot(next.vx,next.vz)>.05){
    const desired=Math.atan2(next.vx,next.vz);
    if(facing===null)facing=desired;
    else{const delta=Math.atan2(Math.sin(desired-facing),Math.cos(desired-facing));facing+=delta*Math.min(1,dt*12);}
    player.rotation.y=facing;
   }
   if(character){
    character.root.position.x=player.position.x;character.root.position.z=player.position.z;
    character.root.position.y=player.position.y-.9-character.root.scaling.y*character.floorY;
    character.root.rotation.y=player.rotation.y;
    const blend=Math.min(1,Math.max(0,dt)*8);
    for(const name of ['idle','walk','run']){
     const weight=character.weights[name]+((name===animation?1:0)-character.weights[name])*blend;
     character.weights[name]=weight;character.named[name].setWeightForAllAnimatables(weight);
    }
   }
   camera.target.copyFrom(player.position);
   const view=(motion.thirdPersonCamera||(o=>({beta:Math.max(.35,Math.min(1.3,o.beta)),radius:7.5,targetY:o.playerY})))(
    {playerY:player.position.y,beta:camera.beta});
   camera.target.y=view.targetY;camera.beta=view.beta;camera.radius=view.radius;
   // Close camera (looking up): fade the player so it does not block the view.
   player.visibility=character?0:Math.max(.2,Math.min(1,(view.radius-1.2)/2.3));
   return player.position;
  }
  function dispose(){
   if(disposed)return;disposed=true;ready=false;modelGeneration++;releaseCharacter();
   canvas.removeEventListener('keydown',keyDown);canvas.removeEventListener('keyup',keyUp);
   canvas.removeEventListener('click',pointerClick);
   if(pointerDocument){pointerDocument.removeEventListener('mousemove',pointerMove);pointerDocument.removeEventListener('pointerlockchange',pointerChange);
    if(pointerDocument.pointerLockElement===canvas&&pointerDocument.exitPointerLock)pointerDocument.exitPointerLock();}
   releaseColliders();
   if(aggregate)aggregate.dispose();
   if(groundBody)groundBody.dispose();
   if(player){const material=player.material;player.dispose();if(material)material.dispose();}
   if(ground)ground.dispose();
   status='Spieler freigegeben';
  }
  return {start,update,setVehicleMode,syncColliders,dispose,get status(){return status;},get ready(){return ready;},get playerY(){return player?player.position.y:null;},get grounded(){return ready?groundedByRaycast():false;},get characterStatus(){return characterState;},get animation(){return animation;}};
 }
 return Object.freeze({create});
});
