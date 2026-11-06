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
 function footprint(seed,obj){const h=hash(seed,obj);return {width:4+(h%4)*2,depth:4+((h>>>5)%3)*2};}
 function heightClass(seed,obj){return Math.min(2,Math.floor((height(seed,obj)-9)/9));}
 function buildingGroups(chunk,seed){
  const groups=[[],[],[]];
  for(const obj of chunk.objects)if(obj.type==='building')groups[variant(seed,obj)].push(obj);
  return groups;
 }
  function checkedMatrices(matrices,count){
   if(matrices.length!==count*16||!Array.from(matrices).every(Number.isFinite))throw new TypeError('invalid thin instance matrices');
   return matrices;
  }
 function uvScale(width,h){return {uScale:width/8,vScale:h/30};}
 function create({scene,BABYLON,fixture,seed=1337,loadRadius=160,useThinInstances=false}={}){
  if(!scene||!BABYLON||!fixture)throw new TypeError('city scene required');
  if(!Number.isFinite(loadRadius)||loadRadius<=60)throw new TypeError('invalid city load radius');
  const owned=[],materials=[],textures=[],sources=[],span=fixture.grid*fixture.chunkSize;
  let disposed=false;
  const colors=[new BABYLON.Color3(.55,.63,.7),new BABYLON.Color3(.65,.57,.48),new BABYLON.Color3(.48,.57,.61)];
  // Three uploaded height-class textures, each a 4-column/10-row tile.
  // Source-specific UV transforms are baked into geometry, not shared textures:
  // texture.uScale/vScale on a shared texture would affect all materials.
  const facadeTextures=[0,1,2].map(k=>{
   const texture=new BABYLON.DynamicTexture('nordhafen-facade-height-'+k,{width:128,height:256},scene,false);
   textures.push(texture);
   const ctx=texture.getContext();ctx.fillStyle='#667887';ctx.fillRect(0,0,128,256);
   for(let row=0;row<10;row++)for(let col=0;col<4;col++){
    ctx.fillStyle=(row+col)%4===0?'#e6c987':'#233e52';
    ctx.fillRect(col*32+7,row*25+5,18,15);
    ctx.fillStyle='#c5d4d8';ctx.fillRect(col*32+7,row*25+5,18,2);
   }
   texture.update();return texture;
  });
  const facadeMaterials=colors.map((color,i)=>[0,1,2,3].map(w=>[0,1,2].map(k=>{
   const m=new BABYLON.PBRMetallicRoughnessMaterial('city-facade-'+i+'-'+w+'-'+k,scene);
   m.baseColor=color;m.baseTexture=facadeTextures[k];m.metallic=.04;m.roughness=.86;
   materials.push(m);return m;
  })));
  const simpleMaterials=colors.map((color,i)=>{
   const m=new BABYLON.PBRMetallicRoughnessMaterial('city-simple-'+i,scene);
   m.baseColor=color;m.metallic=0;m.roughness=1;materials.push(m);return m;
  });
  for(let i=0;i<3;i++)for(let w=0;w<4;w++)for(let k=0;k<3;k++){
   const width=4+w*2,h=9+k*9;
   const uv=uvScale(width,h);
   const faceUV=Array.from({length:6},()=>new BABYLON.Vector4(0,0,uv.uScale,uv.vScale));
   const source=BABYLON.MeshBuilder.CreateBox('city-building-source-'+i+'-'+w+'-'+k,{size:1,faceUV},scene);
   source.material=facadeMaterials[i][w][k];source.isVisible=false;sources.push(source);owned.push(source);
  }
  const simpleSources=colors.map((_,i)=>{
   const source=BABYLON.MeshBuilder.CreateBox('city-simple-source-'+i,{size:1},scene);
   source.material=simpleMaterials[i];source.isVisible=false;owned.push(source);return source;
  });
  const trunkMat=new BABYLON.PBRMetallicRoughnessMaterial('city-tree-trunk-brown',scene);
  trunkMat.baseColor=new BABYLON.Color3(.36,.22,.12);trunkMat.metallic=0;trunkMat.roughness=1;materials.push(trunkMat);
  const crownMat=new BABYLON.PBRMetallicRoughnessMaterial('city-tree-crown-green',scene);
  crownMat.baseColor=new BABYLON.Color3(.18,.48,.22);crownMat.metallic=0;crownMat.roughness=1;materials.push(crownMat);
  const trunkSource=BABYLON.MeshBuilder.CreateCylinder('city-tree-trunk-source',{height:1,diameter:.25},scene);
  trunkSource.material=trunkMat;trunkSource.isVisible=false;owned.push(trunkSource);
  const crownSource=BABYLON.MeshBuilder.CreateSphere('city-tree-crown-source',{diameter:1},scene);
  crownSource.material=crownMat;crownSource.isVisible=false;owned.push(crownSource);
  // Gradient sky via vertex colors, no external shader or CDN.
  const skyHorizon=[.62,.73,.8];
  const sky=BABYLON.MeshBuilder.CreateBox('city-gradient-sky',{size:span*6},scene);
  const positions=sky.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  const colorsArray=[];
  for(let i=0;i<positions.length;i+=3){
   const t=Math.max(0,Math.min(1,(positions[i+1]/(span*3)+1)/2));
   colorsArray.push(skyHorizon[0]-.43*t,skyHorizon[1]-.36*t,skyHorizon[2]-.17*t,1);
  }
  sky.setVerticesData(BABYLON.VertexBuffer.ColorKind,colorsArray);
  const skyMat=new BABYLON.StandardMaterial('city-sky-gradient',scene);
  skyMat.fogEnabled=false;sky.applyFog=false;
  skyMat.disableLighting=true;skyMat.backFaceCulling=false;skyMat.emissiveColor=new BABYLON.Color3(1,1,1);
  skyMat.useVertexColors=true;sky.material=skyMat;sky.isPickable=false;
  sky.infiniteDistance=true;sky.isVisible=true;owned.push(sky);materials.push(skyMat);
  scene.fogMode=BABYLON.Scene.FOGMODE_LINEAR;
  scene.fogStart=100;scene.fogEnd=loadRadius;
  // Lower skybox edge (t=0) is the horizon color in the vertex gradient.
  scene.fogColor=new BABYLON.Color3(...skyHorizon);
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
     if(!useThinInstances){
      for(const obj of groups[v]){
       const h=height(seed,obj);
       const source=level==='full'?sources[v*12+((footprint(seed,obj).width-4)/2)*3+heightClass(seed,obj)]:simpleSources[v];
       const mesh=source.createInstance('city-instance-'+chunk.id+'-'+obj.id);
       mesh.position.set(chunk.x*fixture.chunkSize+obj.x,h/2,chunk.z*fixture.chunkSize+obj.z);
       const size=footprint(seed,obj);
       mesh.scaling.set(size.width,h,size.depth);mesh.isVisible=true;meshes.push(mesh);
      }
      continue;
     }
     const mesh=(level==='full'?sources[v*12]:simpleSources[v]).clone('city-cell-'+chunk.id+'-'+v);
     mesh.isVisible=false;mesh.material=level==='full'?facadeMaterials[v][0][0]:simpleMaterials[v];mesh.thinInstanceSetBuffer?.('matrix',null,16);
     const matrix=new Float32Array(groups[v].length*16);
     groups[v].forEach((obj,i)=>{
      const h=height(seed,obj);
      BABYLON.Matrix.Compose(new BABYLON.Vector3(footprint(seed,obj).width,h,footprint(seed,obj).depth),BABYLON.Quaternion.Identity(),
       new BABYLON.Vector3(chunk.x*fixture.chunkSize+obj.x,h/2,chunk.z*fixture.chunkSize+obj.z))
       .copyToArray(matrix,i*16);
     });
     mesh.thinInstanceSetBuffer('matrix',checkedMatrices(matrix,groups[v].length),16,false);
     mesh.thinInstanceRefreshBoundingInfo?.(true);
     mesh.isVisible=true;meshes.push(mesh);
    }
    const trees=level==='placeholder'?[]:chunk.objects.filter(o=>o.type==='vegetation').filter((_,i)=>level==='full'||i%2===0);
    if(trees.length&&!useThinInstances){
     for(const obj of trees){
      const x=chunk.x*fixture.chunkSize+obj.x,z=chunk.z*fixture.chunkSize+obj.z;
      const trunk=trunkSource.createInstance('city-tree-trunk-'+chunk.id+'-'+obj.id);
      trunk.position.set(x,1.2,z);trunk.scaling.set(.65,2.4,.65);trunk.isVisible=true;meshes.push(trunk);
      const crown=crownSource.createInstance('city-tree-crown-'+chunk.id+'-'+obj.id);
      crown.position.set(x,3.4,z);crown.scaling.set(2.8,2.8,2.8);crown.isVisible=true;meshes.push(crown);
     }
    }else if(trees.length){
     for(const [source,part,scale,y] of [[trunkSource,'trunk',new BABYLON.Vector3(.65,2.4,.65),1.2],[crownSource,'crown',new BABYLON.Vector3(2.8,2.8,2.8),3.4]]){
      const mesh=source.clone('city-cell-trees-'+part+'-'+chunk.id);
      mesh.isVisible=false;mesh.material=source.material;
      const matrix=new Float32Array(trees.length*16);
      trees.forEach((obj,i)=>BABYLON.Matrix.Compose(scale,BABYLON.Quaternion.Identity(),
       new BABYLON.Vector3(chunk.x*fixture.chunkSize+obj.x,y,chunk.z*fixture.chunkSize+obj.z)).copyToArray(matrix,i*16));
      mesh.thinInstanceSetBuffer('matrix',checkedMatrices(matrix,trees.length),16,false);
      mesh.thinInstanceRefreshBoundingInfo?.(true);mesh.isVisible=true;meshes.push(mesh);
     }
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
  return {buildCell,dispose,get facadeTexture(){return facadeTextures[0];},get facadeTextures(){return facadeTextures;},get sources(){return sources;}};
 }
 return Object.freeze({create,height,variant,footprint,heightClass,buildingGroups,checkedMatrices});
});
