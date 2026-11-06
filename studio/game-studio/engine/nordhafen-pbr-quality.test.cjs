'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('./nordhafen-pbr-quality.js');
function setup(webGLVersion=2,fail=false){
 const freed={env:0,shadow:0,materials:0},scene={
  imageProcessingConfiguration:{toneMappingEnabled:false,toneMappingType:0},
  environmentTexture:null
 };
 const engine={webGLVersion,useExactSrgbConversions:false};
 const building={material:{name:'standard'}},ground={material:{name:'ground-standard'}};
 class PBR{constructor(){this.baseColor=null;}dispose(){freed.materials++;}}
 const BABYLON={
  Color3:class{constructor(r,g,b){this.r=r;this.g=g;this.b=b;}},
  PBRMetallicRoughnessMaterial:PBR,
  ImageProcessingConfiguration:{TONEMAPPING_ACES:2},
  CubeTexture:{CreateFromPrefilteredData(){if(fail)throw Error('environment offline');return {
   dispose(){freed.env++;},onErrorObservable:{addOnce(){}}
  };}},
  CascadedShadowGenerator:class{
   constructor(){this.list=[];}getShadowMap(){return {renderList:this.list};}
   dispose(){freed.shadow++;}
  }
 };
 return {scene,engine,building,ground,BABYLON,light:{},freed};
}
test('PBR opt-in off leaves original scene and materials unchanged',()=>{
 const f=setup(),p=create({...f});assert.equal(p.enabled,false);
 assert.equal(f.building.material.name,'standard');
 assert.equal(f.scene.environmentTexture,null);
 assert.equal(f.scene.imageProcessingConfiguration.toneMappingEnabled,false);
 p.dispose();
});
test('PBR opt-in enables material, IBL, ACES, sRGB and cascaded shadows',()=>{
 const f=setup(),p=create({...f});assert.equal(p.start(),true);
 assert.ok(f.building.material instanceof f.BABYLON.PBRMetallicRoughnessMaterial);
 assert.ok(f.ground.material instanceof f.BABYLON.PBRMetallicRoughnessMaterial);
 assert.ok(f.scene.environmentTexture);
 assert.equal(f.scene.imageProcessingConfiguration.toneMappingType,2);
 assert.equal(f.scene.imageProcessingConfiguration.toneMappingEnabled,true);
 assert.equal(f.engine.useExactSrgbConversions,true);
 const near={isEnabled:()=>true,getBoundingInfo:()=>({boundingSphere:{centerWorld:{x:1,z:1}}})};
 const far={isEnabled:()=>true,getBoundingInfo:()=>({boundingSphere:{centerWorld:{x:500,z:500}}})};
 p.updateShadows({x:0,z:0},[near,far]);
 assert.equal(p.enabled,true);p.dispose();
});
test('WebGL1 and IBL failure visibly restore StandardMaterial',()=>{
 for(const [version,fail] of [[1,false],[2,true]]){
  const f=setup(version,fail),p=create({...f});assert.equal(p.start(),false);
  assert.match(p.status,/StandardMaterial/);
  assert.equal(f.building.material.name,'standard');
  assert.equal(f.scene.environmentTexture,null);
  p.dispose();
 }
});
test('PBR dispose releases environment, shadow map and materials once',()=>{
 const f=setup(),p=create({...f});p.start();p.dispose();p.dispose();
 assert.deepEqual(f.freed,{env:1,shadow:1,materials:2});
 assert.equal(f.building.material.name,'standard');
 assert.equal(f.scene.imageProcessingConfiguration.toneMappingEnabled,false);
});
