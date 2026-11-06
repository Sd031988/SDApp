'use strict';
/* Isolated Nordhafen streaming/city lifecycle contract. No real WebGL or asset loads. */
const test=require('node:test');
const assert=require('node:assert/strict');
const cityAPI=require('./nordhafen-procedural-city.js');

function harness(){
 const textures=[],clones=[],matrices=[],materials=[];
 function mesh(name){
  return {name,isVisible:true,position:{set(){}},
   getVerticesData(){return [0,1,0,0,-1,0];},setVerticesData(){},
   clone(childName){const child=mesh(childName);clones.push(child);return child;},
   thinInstanceSetBuffer(kind,data,stride){matrices.push({name,kind,data,stride});},
   thinInstanceRefreshBoundingInfo(){},
   dispose(){this.disposed=(this.disposed||0)+1;}};
 }
 class DynamicTexture{
  constructor(name){this.name=name;this.disposed=0;textures.push(this);}
  getContext(){return {fillRect(){},set fillStyle(value){}};}
  update(){}
  dispose(){this.disposed++;}
 }
 class Material{
  constructor(){this.disposed=0;materials.push(this);}
  dispose(){this.disposed++;}
 }
 class Color3{constructor(r,g,b){Object.assign(this,{r,g,b});}}
 class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z});}}
 const BABYLON={DynamicTexture,PBRMetallicRoughnessMaterial:Material,StandardMaterial:Material,
  Color3,Vector3,VertexBuffer:{PositionKind:'position',ColorKind:'color'},
  Scene:{FOGMODE_LINEAR:1,FOGMODE_NONE:0},
  MeshBuilder:{CreateSphere:()=>mesh('sky'),CreateGround:()=>mesh('ground')},
  Quaternion:{Identity:()=>({})},
  Matrix:{Compose:()=>({copyToArray(array,offset){for(let i=0;i<16;i++)array[offset+i]=i%5===0?1:0;}})}};
 const scene={fogMode:0},fixture={grid:2,chunkSize:64};
 const city=cityAPI.create({scene,BABYLON,fixture,building:mesh('building'),tree:mesh('tree')});
 return {city,clones,matrices,textures,materials,scene};
}
const chunk={id:'0-0',x:0,z:0,objects:[
 {id:'b-1',type:'building',x:8,z:8},{id:'b-2',type:'building',x:16,z:8},
 {id:'b-3',type:'building',x:24,z:8},{id:'t-1',type:'vegetation',x:28,z:28}
]};
test('aborted streaming cell allocates no meshes or thin buffers',()=>{
 const h=harness(),before=h.clones.length;
 assert.throws(()=>h.city.buildCell(chunk,{signal:{aborted:true}}),/aborted/);
 assert.equal(h.clones.length,before);
 assert.equal(h.matrices.length,0);
 h.city.dispose();
});
test('building groups preserve every object exactly once with bounded draw mesh count',()=>{
 const h=harness(),result=h.city.buildCell(chunk);
 const groups=cityAPI.buildingGroups(chunk,1337);
 assert.equal(groups.reduce((sum,g)=>sum+g.length,0),3);
 assert.equal(result.meshes.length,groups.filter(g=>g.length).length+1);
 assert.ok(result.meshes.length<=4);
 assert.equal(h.matrices.length,result.meshes.length);
 assert.equal(h.matrices.reduce((sum,m)=>sum+m.data.length/16,0),chunk.objects.length);
 for(const buffer of h.matrices){assert.equal(buffer.kind,'matrix');assert.equal(buffer.stride,16);}
 assert.equal(h.textures.filter(t=>t.name==='nordhafen-facade').length,1);
 result.meshes.forEach(m=>m.dispose());
 h.city.dispose();
});
test('disposed city rejects late cell builds and frees shared textures once',()=>{
 const h=harness();
 h.city.dispose();h.city.dispose();
 assert.throws(()=>h.city.buildCell(chunk),/disposed/);
 assert.equal(h.matrices.length,0);
 assert.equal(h.scene.fogMode,0);
 for(const texture of h.textures)assert.equal(texture.disposed,1);
 for(const material of h.materials)assert.equal(material.disposed,1);
});
test('seed-dependent building geometry is deterministic and bounded',()=>{
 for(const obj of chunk.objects.filter(o=>o.type==='building')){
  assert.equal(cityAPI.height(1337,obj),cityAPI.height(1337,{...obj}));
  assert.equal(cityAPI.variant(1337,obj),cityAPI.variant(1337,{...obj}));
  assert.ok(cityAPI.height(1337,obj)>=9&&cityAPI.height(1337,obj)<=30);
  assert.ok(cityAPI.variant(1337,obj)>=0&&cityAPI.variant(1337,obj)<=2);
 }
});
