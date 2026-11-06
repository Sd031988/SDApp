/* Procedural Nordhafen harbor city, no external image/model assets. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenProceduralCity=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function hash(seed,obj){
  let h=(seed>>>0)^2166136261;
  const text=String(obj.id);
  for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;
  return h>>>0;
 }
 function height(seed,obj){return 9+(hash(seed,obj)%8)*3;}
 function variant(seed,obj){return hash(seed,obj)%3;}
 function buildingGroups(chunk,seed){
  const groups=[[],[],[]];
  for(const obj of chunk.objects)if(obj.type==='building')groups[variant(seed,obj)].push(obj);
  return groups;
 }
  function checkedMatrices(matrices,count){
   if(matrices.length!==count*16||!Array.from(matrices).every(Number.isFinite))throw new TypeError('invalid thin instance matrices');
   return matrices;
  }
 function create({scene,BABYLON,fixture,seed=1337,loadRadius=160}={}){
  if(!scene||!BABYLON||!fixture)throw new TypeError('city scene required');
  if(!Number.isFinite(loadRadius)||loadRadius<=60)throw new TypeError('invalid city load radius');
  const owned=[],materials=[],textures=[],sources=[],span=fixture.grid*fixture.chunkSize;
  let disposed=false;
  const colors=[new BABYLON.Color3(.55,.63,.7),new BABYLON.Color3(.65,.57,.48),new BABYLON.Color3(.48,.57,.61)];
  const facade=new BABYLON.DynamicTexture('nordhafen-facade',{width:128,height:256},scene,false);
  textures.push(facade);
  const ctx=facade.getContext();
  ctx.fillStyle='#667887';ctx.fillRect(0,0,128,256);
  for(let row=0;row<10;row++)for(let col=0;col<4;col++){
   ctx.fillStyle=(row+col)%4===0?'#e6c987':'#233e52';
   ctx.fillRect(col*32+7,row*25+5,18,15);
   ctx.fillStyle='#c5d4d8';ctx.fillRect(col*32+7,row*25+5,18,2);
  }
  facade.update();
  const facadeMaterials=colors.map((color,i)=>{
   const m=new BABYLON.PBRMetallicRoughnessMaterial('city-facade-'+i,scene);
   m.baseColor=color;m.baseTexture=facade;m.metallic=.04;m.roughness=.86;
   materials.push(m);return m;
  });
  const simpleMaterials=colors.map((color,i)=>{
   const m=new BABYLON.PBRMetallicRoughnessMaterial('city-simple-'+i,scene);
   m.baseColor=color;m.metallic=0;m.roughness=1;materials.push(m);return m;
  });
  for(let i=0;i<3;i++){
   const source=BABYLON.MeshBuilder.CreateBox('city-building-source-'+i,{size:1},scene);
   source.material=facadeMaterials[i];source.isVisible=false;sources.push(source);owned.push(source);
  }
  const treeSource=BABYLON.MeshBuilder.CreateCylinder('city-tree-source',{height:1,diameter:.5},scene);
  treeSource.isVisible=false;owned.push(treeSource);
  // Gradient sky via vertex colors, no external shader or CDN.
  const sky=BABYLON.MeshBuilder.CreateBox('city-gradient-sky',{size:span*6},scene);
  const positions=sky.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  const colorsArray=[];
  for(let i=0;i<positions.length;i+=3){
   const t=Math.max(0,Math.min(1,(positions[i+1]/(span*3)+1)/2));
   colorsArray.push(.62-.43*t,.73-.36*t,.8-.17*t,1);
  }
  sky.setVerticesData(BABYLON.VertexBuffer.ColorKind,colorsArray);
  const skyMat=new BABYLON.StandardMaterial('city-sky-gradient',scene);
  skyMat.fogEnabled=false;sky.applyFog=false;
  skyMat.disableLighting=true;skyMat.backFaceCulling=false;skyMat.emissiveColor=new BABYLON.Color3(1,1,1);
  skyMat.useVertexColors=true;sky.material=skyMat;sky.isPickable=false;
  sky.infiniteDistance=true;sky.isVisible=true;owned.push(sky);materials.push(skyMat);
  scene.fogMode=BABYLON.Scene.FOGMODE_LINEAR;
  scene.fogStart=60;scene.fogEnd=loadRadius;
  // Lower skybox edge (t=0) is the horizon color in the vertex gradient.
  scene.fogColor=new BABYLON.Color3(.62,.73,.8);
  const groundTexture=new BABYLON.DynamicTexture('city-ground-map',{width:512,height:512},scene,false);
  textures.push(groundTexture);
  const g=groundTexture.getContext();
  g.fillStyle='#638157';g.fillRect(0,0,512,512);
  const step=512/fixture.grid;
  for(let i=0;i<fixture.grid;i++){
   const at=i*step;
   g.fillStyle='#888b84';g.fillRect(at,0,13,512);g.fillRect(0,at,512,13);
   g.fillStyle='#373e43';g.fillRect(at+3,0,7,512);g.fillRect(0,at+3,512,7);
   g.fillStyle='#c4c6b2';
   for(let k=16;k<512;k+=32){g.fillRect(at+6,k,1,10);g.fillRect(k,at+6,10,1);}
  }
  groundTexture.update();
  const ground=BABYLON.MeshBuilder.CreateGround('city-roads-grass',{width:span,height:span},scene);
  ground.position.set(span/2,-.16,span/2);
  const groundMat=new BABYLON.PBRMetallicRoughnessMaterial('city-roads-material',scene);
  groundMat.baseTexture=groundTexture;groundMat.metallic=0;groundMat.roughness=1;
  ground.material=groundMat;owned.push(ground);materials.push(groundMat);
  const water=BABYLON.MeshBuilder.CreateGround('city-harbor-water',{width:span,height:80},scene);
  water.position.set(span/2,-.22,span+40);
  const waterMat=new BABYLON.PBRMetallicRoughnessMaterial('city-water-material',scene);
  waterMat.baseColor=new BABYLON.Color3(.11,.32,.43);waterMat.metallic=.25;waterMat.roughness=.3;
  water.material=waterMat;owned.push(water);materials.push(waterMat);
  function buildCell(chunk,{signal,level='full'}={}){
   if(!['full','simplified','placeholder'].includes(level))throw new TypeError('invalid city LOD');
   if(disposed||signal?.aborted)throw new Error('city disposed or aborted');
   const meshes=[],groups=buildingGroups(chunk,seed);
   try{
    for(let v=0;v<3;v++){
     if(!groups[v].length)continue;
     const mesh=sources[v].clone('city-cell-'+chunk.id+'-'+v);
     mesh.isVisible=false;mesh.material=level==='full'?facadeMaterials[v]:simpleMaterials[v];mesh.thinInstanceSetBuffer?.('matrix',null,16);
     const matrix=new Float32Array(groups[v].length*16);
     groups[v].forEach((obj,i)=>{
      const h=height(seed,obj);
      BABYLON.Matrix.Compose(new BABYLON.Vector3(4,h,4),BABYLON.Quaternion.Identity(),
       new BABYLON.Vector3(chunk.x*fixture.chunkSize+obj.x,h/2,chunk.z*fixture.chunkSize+obj.z))
       .copyToArray(matrix,i*16);
     });
     mesh.thinInstanceSetBuffer('matrix',checkedMatrices(matrix,groups[v].length),16,true);
     mesh.thinInstanceRefreshBoundingInfo?.(true);
     mesh.isVisible=true;meshes.push(mesh);
    }
    const trees=level==='placeholder'?[]:chunk.objects.filter(o=>o.type==='vegetation').filter((_,i)=>level==='full'||i%2===0);
    if(trees.length){
     const mesh=treeSource.clone('city-cell-trees-'+chunk.id);
     mesh.isVisible=false;
     const matrix=new Float32Array(trees.length*16);
     trees.forEach((obj,i)=>{
      BABYLON.Matrix.Compose(new BABYLON.Vector3(1,3,1),BABYLON.Quaternion.Identity(),
       new BABYLON.Vector3(chunk.x*fixture.chunkSize+obj.x,1.5,chunk.z*fixture.chunkSize+obj.z))
       .copyToArray(matrix,i*16);
     });
     mesh.thinInstanceSetBuffer('matrix',checkedMatrices(matrix,trees.length),16,true);
     mesh.thinInstanceRefreshBoundingInfo?.(true);
     mesh.isVisible=true;meshes.push(mesh);
    }
    return {meshes,materials:[]};
   }catch(e){for(const m of meshes)m.dispose();throw e;}
  }
  function dispose(){
   if(disposed)return;
   disposed=true;
   for(const mesh of owned)mesh.dispose();
   for(const mat of materials)mat.dispose();
   for(const texture of textures)texture.dispose();
   scene.fogMode=BABYLON.Scene.FOGMODE_NONE;
  }
  return {buildCell,dispose,get facadeTexture(){return facade;},get sources(){return sources;}};
 }
 return Object.freeze({create,height,variant,buildingGroups,checkedMatrices});
});
