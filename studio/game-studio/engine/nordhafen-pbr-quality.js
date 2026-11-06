/* Opt-in PBR lighting for the isolated Nordhafen Babylon lab. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenPBR=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create({scene,engine,BABYLON,building,ground,light,loadRadius=160}={}){
  if(!scene||!engine||!BABYLON||!building||!light)throw new TypeError('PBR scene dependencies required');
  let disposed=false,enabled=false,environment=null,shadows=null,materials=[];
  let status='PBR aus';
  const oldMaterial=building.material,oldGround=ground&&ground.material;
  const processing=scene.imageProcessingConfiguration;
  const previous=processing?{toneMappingEnabled:processing.toneMappingEnabled,toneMappingType:processing.toneMappingType}:null;
  const oldEnv=scene.environmentTexture,oldSrgb=engine.useExactSrgbConversions;
  function fallback(reason){
   if(disposed)return;
   if(shadows){shadows.dispose();shadows=null;}
   if(environment){environment.dispose();environment=null;}
   building.material=oldMaterial;
   if(ground)ground.material=oldGround;
   scene.environmentTexture=oldEnv;
   if(processing&&previous)Object.assign(processing,previous);
   engine.useExactSrgbConversions=oldSrgb;
   for(const mat of materials)mat.dispose();
   materials=[];enabled=false;status='PBR nicht verfügbar – StandardMaterial: '+reason;
  }
  function start(){
   if(disposed)throw new Error('PBR disposed');
   if(enabled)return true;
   if(engine.webGLVersion<2||!BABYLON.PBRMetallicRoughnessMaterial||
      !BABYLON.CascadedShadowGenerator||!BABYLON.CubeTexture?.CreateFromPrefilteredData){
    fallback('WebGL2 oder PBR-API fehlt');return false;
   }
   try{
    environment=BABYLON.CubeTexture.CreateFromPrefilteredData(
      'https://assets.babylonjs.com/environments/studio.env',scene);
    if(!environment)throw new Error('IBL-Umgebung fehlt');
    const mat=new BABYLON.PBRMetallicRoughnessMaterial('nordhafen-pbr-buildings',scene);
    mat.baseColor=new BABYLON.Color3(.42,.53,.65);mat.metallic=0.08;mat.roughness=0.78;
    materials.push(mat);building.material=mat;
    if(ground){
     const floor=new BABYLON.PBRMetallicRoughnessMaterial('nordhafen-pbr-ground',scene);
     floor.baseColor=new BABYLON.Color3(.22,.28,.31);floor.metallic=0;floor.roughness=.95;
     materials.push(floor);ground.material=floor;
    }
    scene.environmentTexture=environment;
    if(processing){
     processing.toneMappingEnabled=true;
     processing.toneMappingType=BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    }
    engine.useExactSrgbConversions=true;
    shadows=new BABYLON.CascadedShadowGenerator(1024,light);
    shadows.numCascades=3;
    enabled=true;status='PBR aktiv: IBL, ACES, sRGB, CSM';
    if(environment.onErrorObservable&&typeof environment.onErrorObservable.addOnce==='function')
     environment.onErrorObservable.addOnce(()=>fallback('IBL-Ladefehler'));
    return true;
   }catch(e){fallback(e.message);return false;}
  }
  function updateShadows(camera,meshes){
   if(!enabled||!shadows||!camera)return;
   const render=shadows.getShadowMap()?.renderList;
   if(!render)return;
   render.length=0;
   for(const mesh of meshes||[]){
    if(!mesh||!mesh.isEnabled?.()||!mesh.getBoundingInfo)continue;
    const center=mesh.getBoundingInfo().boundingSphere.centerWorld;
    if(center&&Math.hypot(center.x-camera.x,center.z-camera.z)<=loadRadius)render.push(mesh);
   }
  }
  function dispose(){
   if(disposed)return;
   fallback('freigegeben');
   disposed=true;status='PBR freigegeben';
  }
  return {start,updateShadows,dispose,get status(){return status;},get enabled(){return enabled;}};
 }
 return Object.freeze({create});
});
