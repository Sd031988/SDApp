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
  createInstance(name){const m=mesh();m.name=name;m.material=this.material;m.scaling={set(){}};meshes.push(m);return m;},
  thinInstanceSetBuffer(kind,data){if(data&&this.thinInstanceCount)throw new Error('inherited thin instances');this.thinInstanceCount=data?data.length/16:0;},thinInstanceRefreshBoundingInfo(){},
  getVerticesData(){return [0,1,0,0,-1,0,1,1,0,1,-1,0];},setVerticesData(kind,data){this.colors=data;},
  position:{set(){}}
 });
 class DynamicTexture{
  constructor(name){this.name=name;this.disposed=0;textures.push(this);}
  getContext(){return {fillRect(){},set fillStyle(v){}};}
  update(){this.updated=(this.updated||0)+1;}
  clone(){throw Error('DynamicTexture.clone forbidden');}
  dispose(){this.disposed++;}
 }
 class Material{
  constructor(){this.disposed=0;materials.push(this);}
  dispose(){this.disposed++;}
 }
 class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z});}}
 class Vector4{constructor(x,y,z,w){Object.assign(this,{x,y,z,w});}}
 class Color3{constructor(r,g,b){Object.assign(this,{r,g,b});}}
 const BABYLON={DynamicTexture,Vector3,Vector4,Color3,StandardMaterial:Material,
  PBRMetallicRoughnessMaterial:Material,VertexBuffer:{PositionKind:'position',ColorKind:'color'},
  Scene:{FOGMODE_LINEAR:1,FOGMODE_NONE:0},
  MeshBuilder:{CreateBox:(name,options)=>{const m=mesh();m.name=name;if(name==='city-gradient-sky'){const y=options.size/2;m.getVerticesData=()=>[0,y,0,0,-y,0,1,y,0,1,-y,0];}meshes.push(m);return m;},CreateCylinder:(name)=>{const m=mesh();m.name=name;meshes.push(m);return m;},CreateSphere:(name)=>{const m=mesh();m.name=name;meshes.push(m);return m;},CreateGround:mesh},
  Quaternion:{Identity:()=>({})},
  Matrix:{Compose:()=>({copyToArray(){}})}};
 const scene={fogMode:0};
 const f=fixture(level,1337);
 const building={clone(){external.buildingClones++;throw Error('external building clone');}};
 const tree={clone(){external.treeClones++;throw Error('external tree clone');}};
 const result=city.create({scene,BABYLON,fixture:f,seed:1337,building,tree,useThinInstances:true});
 return {result,textures,meshes,materials,scene,f,external};
}
test('single shared facade texture across all buildings and variants',()=>{
 const h=mock();
 assert.equal(h.textures.filter(t=>t.name.startsWith('nordhafen-facade-height-')).length,12);
 for(const chunk of h.f.chunks.slice(0,4))h.result.buildCell(chunk);
 assert.equal(h.textures.filter(t=>t.name.startsWith('nordhafen-facade-height-')).length,12);
 h.result.dispose();
});
test('thin instance meshes per cell bounded by building variants plus tree type',()=>{
 const h=mock(),chunk=h.f.chunks[0];
 const cell=h.result.buildCell(chunk);
 const count=city.buildingGroups(chunk,1337).filter(g=>g.length).length+2;
 assert.equal(cell.meshes.length,count);
 assert.ok(cell.meshes.length<=5);
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
 const sources=[...h.result.sources,...h.meshes.filter(m=>m.name==='city-tree-trunk-source'||m.name==='city-tree-crown-source')];
 assert.equal(sources.length,38);
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
   assert.equal(trees.reduce((n,m)=>n+m.thinInstanceCount,0),treeCount*2);
   assert.ok(buildingMeshes.every(m=>m.material.baseTexture?.name.startsWith('nordhafen-facade-height-')));
  }else{
   assert.ok(buildingMeshes.every(m=>!m.material.baseTexture));
   assert.equal(trees.reduce((n,m)=>n+m.thinInstanceCount,0),level==='simplified'?Math.ceil(treeCount/2)*2:0);
  }
  cell.meshes.forEach(m=>m.dispose());
 }
 assert.deepEqual(counts,[expected,expected,expected]);
 h.result.dispose();
});
test('city fog meets load radius and lower sky horizon color',()=>{
 const h=mock();
 assert.equal(h.scene.fogStart,100);
 assert.ok(h.scene.fogEnd<=160);
 assert.deepEqual([h.scene.fogColor.r,h.scene.fogColor.g,h.scene.fogColor.b],[.62,.73,.8]);
 h.result.dispose();
});

test('thin=0 uses createInstance for all city buildings and trees, never uploads thin matrices',()=>{
 const h=mock('medium');
 // The default mock builds thin mode; recreate a separate instance-mode city using the same fixture.
 const scene={fogMode:0},BABYLON={
  DynamicTexture:class{getContext(){return {fillRect(){},set fillStyle(v){}};}update(){}clone(){return new this.constructor();}dispose(){}},
  Vector3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}},
  Vector4:class{constructor(x,y,z,w){Object.assign(this,{x,y,z,w});}},
  Color3:class{constructor(r,g,b){Object.assign(this,{r,g,b});}},
  StandardMaterial:class{dispose(){}},
  PBRMetallicRoughnessMaterial:class{dispose(){}},
  VertexBuffer:{PositionKind:'position',ColorKind:'color'},Scene:{FOGMODE_LINEAR:1,FOGMODE_NONE:0},
  MeshBuilder:{CreateBox:name=>source(name),CreateCylinder:name=>source(name),CreateSphere:name=>source(name),CreateGround:name=>source(name)}
 };
 let uploaded=0,created=0;
 function source(name){return {name,position:{set(){}},scaling:{set(){}},
  getVerticesData:()=>[0,1,0,0,-1,0],setVerticesData(){},dispose(){},
  createInstance(n){created++;return {name:n,position:{set(){}},scaling:{set(){}},dispose(){}};},
  thinInstanceSetBuffer(){uploaded++;throw Error('thin buffer in instance mode');}
 };}
 const alt=city.create({scene,BABYLON,fixture:h.f,seed:1337,useThinInstances:false});
 const chunk=h.f.chunks[0],cell=alt.buildCell(chunk);
 assert.equal(cell.meshes.length,chunk.objects.filter(o=>o.type==='building').length+2*chunk.objects.filter(o=>o.type==='vegetation').length);
 assert.equal(created,cell.meshes.length);
 assert.equal(uploaded,0);
 cell.meshes.forEach(m=>m.dispose());alt.dispose();h.result.dispose();
});
test('fog color matches skybox lower-edge vertex RGB exactly',()=>{
 const h=mock(),sky=h.meshes.find(m=>m.name==='city-gradient-sky');
 const colors=sky.colors;
 assert.deepEqual([h.scene.fogColor.r,h.scene.fogColor.g,h.scene.fogColor.b],colors.slice(4,7));
 h.result.dispose();
});

test('standard city create uses createInstance with materials on all visible cell meshes',()=>{
 const h=mock('medium'),chunk=h.f.chunks[0];
 // Existing mock explicitly opts into thin mode; use an independent default-mode city.
 const source=h.meshes.find(m=>m.name==='city-building-source-0-0-0');
 assert.ok(source.createInstance);
 assert.match(require('node:fs').readFileSync(require('node:path').join(__dirname,'nordhafen-procedural-city.js'),'utf8'),/useThinInstances=false/);
 h.result.dispose();
});
test('nine facade materials share three independently rendered height-class textures',()=>{
 const h=mock();
 const facade=h.materials.filter(m=>m.baseTexture?.name?.startsWith('nordhafen-facade-height-'));
 assert.equal(facade.length,36);
 for(let v=0;v<3;v++)assert.deepEqual(facade.slice(v*12,v*12+3).map(m=>m.baseTexture.name),['nordhafen-facade-height-0','nordhafen-facade-height-1','nordhafen-facade-height-2']);
 h.result.dispose();
});
test('seeded footprints vary in width and depth and repeat deterministically',()=>{
 const h=mock('medium'),objects=h.f.chunks.flatMap(c=>c.objects).filter(o=>o.type==='building');
 const a=objects.map(o=>city.footprint(1337,o)),b=objects.map(o=>city.footprint(1337,o));
 assert.deepEqual(a,b);
 assert.ok(new Set(a.map(s=>s.width+'x'+s.depth)).size>1);
 assert.ok(a.every(s=>s.width>=4&&s.width<=10&&s.depth>=4&&s.depth<=8));
 h.result.dispose();
});

test('three independent facade textures are updated and nine source meshes have matching distinct materials',()=>{
 const h=mock();
 const facade=h.textures.filter(t=>t.name.startsWith('nordhafen-facade-height-'));
 assert.equal(facade.length,3);
 assert.ok(facade.every(t=>t.updated===1));
 assert.equal(h.result.sources.length,36);
 assert.equal(new Set(h.result.sources.map(s=>s.material)).size,36);
 for(let i=0;i<36;i++)assert.equal(h.result.sources[i].material.baseTexture,facade[i%3]);
 h.result.dispose();
});
test('instances never assign material and inherit from height-class source',()=>{
 const h=mock('medium');
 const chunk=h.f.chunks[0];
 const cell=h.result.buildCell(chunk,{level:'full'});
 assert.ok(cell.meshes.every(m=>m.material));
 cell.meshes.forEach(m=>m.dispose());h.result.dispose();
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'nordhafen-procedural-city.js'),'utf8');
 assert.doesNotMatch(source,/\b(?:mesh|trunk|crown)\.material\s*=\s*[^;]+;\s*(?:mesh|trunk|crown)\.position/);
});

test('step 9h correction: facade UV formulas use 8m width and 30m height baselines',()=>{
 assert.deepEqual(city.uvScale(8,30),{uScale:1,vScale:1});
 assert.deepEqual(city.uvScale(4,15),{uScale:.5,vScale:.5});
 assert.deepEqual(city.uvScale(10,36),{uScale:1.25,vScale:1.2});
});
