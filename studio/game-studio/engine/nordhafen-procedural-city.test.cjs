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
function mock(level='small'){
 const textures=[],meshes=[],materials=[],external={buildingClones:0,treeClones:0};
 const mesh=()=>({isVisible:true,material:null,dispose(){this.disposed=(this.disposed||0)+1;},
  clone(name){const m=mesh();m.name=name;m.material=this.material;meshes.push(m);return m;},
  thinInstanceSetBuffer(kind,data){if(data&&this.thinInstanceCount)throw new Error('inherited thin instances');this.thinInstanceCount=data?data.length/16:0;},thinInstanceRefreshBoundingInfo(){},
  getVerticesData(){return [0,1,0,0,-1,0,1,1,0,1,-1,0];},setVerticesData(kind,data){this.colors=data;},
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
  MeshBuilder:{CreateBox:(name)=>{const m=mesh();m.name=name;meshes.push(m);return m;},CreateCylinder:(name)=>{const m=mesh();m.name=name;meshes.push(m);return m;},CreateGround:mesh},
  Quaternion:{Identity:()=>({})},
  Matrix:{Compose:()=>({copyToArray(){}})}};
 const scene={fogMode:0};
 const f=fixture(level,1337);
 const building={clone(){external.buildingClones++;throw Error('external building clone');}};
 const tree={clone(){external.treeClones++;throw Error('external tree clone');}};
 const result=city.create({scene,BABYLON,fixture:f,seed:1337,building,tree});
 return {result,textures,meshes,materials,scene,f,external};
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

test('box sky has colors at every vertex and ignores fog',()=>{
 const h=mock(),sky=h.meshes.find(m=>m.name==='city-gradient-sky');
 assert.equal(sky.infiniteDistance,true);
 assert.equal(sky.applyFog,false);
 assert.equal(sky.material.fogEnabled,false);
 assert.equal(sky.colors.length,sky.getVerticesData().length/3*4);
 assert.ok(sky.colors.every(v=>Number.isFinite(v)&&v>0));
 h.result.dispose();
});
test('medium city thin buffers contain all eight buildings per chunk',()=>{
 const h=mock('medium');
 for(const chunk of h.f.chunks){
  const cell=h.result.buildCell(chunk);
  const groups=city.buildingGroups(chunk,1337).filter(g=>g.length);
  assert.equal(cell.meshes.slice(0,groups.length).reduce((n,m)=>n+m.thinInstanceCount,0),8);
  groups.forEach((g,i)=>assert.equal(cell.meshes[i].thinInstanceCount,g.length));
 }
 h.result.dispose();
});

test('city never clones external lab sources; fresh sources have no thin instances',()=>{
 const h=mock(),chunk=h.f.chunks[0];
 assert.equal(h.external.buildingClones,0);
 assert.equal(h.external.treeClones,0);
 const sources=[...h.result.sources,h.meshes.find(m=>m.name==='city-tree-source')];
 assert.equal(sources.length,4);
 for(const source of sources)assert.equal(source.thinInstanceCount||0,0);
 const cell=h.result.buildCell(chunk);
 assert.equal(h.external.buildingClones,0);
 assert.equal(h.external.treeClones,0);
 assert.ok(cell.meshes.every(m=>m.thinInstanceCount>0));
 cell.meshes.forEach(m=>m.dispose());h.result.dispose();
});

test('full, simplified and placeholder retain all buildings while reducing trees and texture cost',()=>{
 const h=mock('medium'),chunk=h.f.chunks[0];
 const expected=chunk.objects.filter(o=>o.type==='building').length;
 const treeCount=chunk.objects.filter(o=>o.type==='vegetation').length;
 const counts=[];
 for(const level of ['full','simplified','placeholder']){
  const cell=h.result.buildCell(chunk,{level});
  const buildings=cell.meshes.filter(m=>m.material&&h.result.sources.some(s=>s.material===m.material));
  // Materials differ at simplified LOD, so identify buildings by cell name.
  const buildingMeshes=cell.meshes.filter(m=>m.name?.startsWith('city-cell-')&&!m.name.startsWith('city-cell-trees-'));
  const trees=cell.meshes.filter(m=>m.name?.startsWith('city-cell-trees-'));
  const count=buildingMeshes.reduce((n,m)=>n+m.thinInstanceCount,0);
  counts.push(count);
  assert.equal(count,expected);
  if(level==='full'){
   assert.equal(trees.reduce((n,m)=>n+m.thinInstanceCount,0),treeCount);
   assert.ok(buildingMeshes.every(m=>m.material.baseTexture===h.result.facadeTexture));
  }else{
   assert.ok(buildingMeshes.every(m=>!m.material.baseTexture));
   assert.equal(trees.reduce((n,m)=>n+m.thinInstanceCount,0),level==='simplified'?Math.ceil(treeCount/2):0);
  }
  cell.meshes.forEach(m=>m.dispose());
 }
 assert.deepEqual(counts,[expected,expected,expected]);
 h.result.dispose();
});
test('city fog meets load radius and lower sky horizon color',()=>{
 const h=mock();
 assert.equal(h.scene.fogStart,60);
 assert.ok(h.scene.fogEnd<=160);
 assert.deepEqual([h.scene.fogColor.r,h.scene.fogColor.g,h.scene.fogColor.b],[.62,.73,.8]);
 h.result.dispose();
});
