'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const city=require('./nordhafen-procedural-city.js');
const {create:fixture}=require('./nordhafen-benchmark.js');
test('same seed and fixture produce deterministic building heights and variants',()=>{
 const a=fixture('small',1337),b=fixture('small',1337);
 for(let i=0;i<a.chunks.length;i++)for(let j=0;j<a.chunks[i].objects.length;j++){
  const x=a.chunks[i].objects[j],y=b.chunks[i].objects[j];
  assert.equal(city.height(1337,x),city.height(1337,y));
  assert.equal(city.variant(1337,x),city.variant(1337,y));
 }
});
function mock(){
 const textures=[],meshes=[],materials=[];
 const mesh=()=>({isVisible:true,material:null,dispose(){this.disposed=(this.disposed||0)+1;},
  clone(){const m=mesh();meshes.push(m);return m;},
  thinInstanceSetBuffer(){},thinInstanceRefreshBoundingInfo(){},
  getVerticesData(){return [0,1,0,0,-1,0];},setVerticesData(){},
  position:{set(){}}
 });
 class DynamicTexture{
  constructor(name){this.name=name;this.disposed=0;textures.push(this);}
  getContext(){return {fillRect(){},set fillStyle(v){}};}
  update(){}
  dispose(){this.disposed++;}
 }
 class Material{
  constructor(){this.disposed=0;materials.push(this);}
  dispose(){this.disposed++;}
 }
 class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z});}}
 class Color3{constructor(r,g,b){Object.assign(this,{r,g,b});}}
 const BABYLON={DynamicTexture,Vector3,Color3,StandardMaterial:Material,
  PBRMetallicRoughnessMaterial:Material,VertexBuffer:{PositionKind:'position',ColorKind:'color'},
  Scene:{FOGMODE_LINEAR:1,FOGMODE_NONE:0},
  MeshBuilder:{CreateSphere:mesh,CreateGround:mesh},
  Quaternion:{Identity:()=>({})},
  Matrix:{Compose:()=>({copyToArray(){}})}};
 const scene={fogMode:0};
 const f=fixture('small',1337);
 const result=city.create({scene,BABYLON,fixture:f,seed:1337,building:mesh(),tree:mesh()});
 return {result,textures,meshes,materials,scene,f};
}
test('single shared facade texture across all buildings and variants',()=>{
 const h=mock();
 assert.equal(h.textures.filter(t=>t.name==='nordhafen-facade').length,1);
 for(const chunk of h.f.chunks.slice(0,4))h.result.buildCell(chunk);
 assert.equal(h.textures.filter(t=>t.name==='nordhafen-facade').length,1);
 h.result.dispose();
});
test('thin instance meshes per cell bounded by building variants plus tree type',()=>{
 const h=mock(),chunk=h.f.chunks[0];
 const cell=h.result.buildCell(chunk);
 const count=city.buildingGroups(chunk,1337).filter(g=>g.length).length+1;
 assert.equal(cell.meshes.length,count);
 assert.ok(cell.meshes.length<=4);
 for(const mesh of cell.meshes)mesh.dispose();
 h.result.dispose();
});
test('dispose releases shared textures exactly once',()=>{
 const h=mock();
 h.result.dispose();h.result.dispose();
 assert.ok(h.textures.length>=2);
 for(const texture of h.textures)assert.equal(texture.disposed,1);
 for(const material of h.materials)assert.equal(material.disposed,1);
});
