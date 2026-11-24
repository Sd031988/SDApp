/* Nordhafen Ops: raised sidewalks with curbs along the painted street grid.
 * Street layout (same as the ground texture in nordhafen-procedural-city.js):
 * every 64 m a 13 m street band = 3 m sidewalk + 7 m asphalt + 3 m sidewalk.
 * Sidewalks are static Havok boxes, interrupted at junctions so cars can cross.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenOpsStreets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STREET=Object.freeze({spacing:64,band:13,sidewalk:3,curbHeight:.15});
// Sidewalk strips. axis 'z' = strip runs along z (street line at constant x).
function layout(worldSize=512){
 if(!Number.isFinite(worldSize)||worldSize<STREET.spacing*2)throw new RangeError('world too small');
 const lines=Math.floor(worldSize/STREET.spacing),strips=[];
 const centres=at=>[at+STREET.sidewalk/2,at+STREET.band-STREET.sidewalk/2];
 for(let k=0;k<lines;k++){
  const at=k*STREET.spacing;
  for(const line of centres(at)){
   for(let j=0;j<lines;j++){
    const start=j*STREET.spacing+STREET.band,end=Math.min(worldSize,(j+1)*STREET.spacing);
    if(end-start<1)continue;
    strips.push({axis:'z',line,start,end});
    strips.push({axis:'x',line,start,end});
   }
  }
 }
 return strips;
}
// Coordinates where a walker on a strip reaches the crossing street (centre of its sidewalks).
function crossings(worldSize=512){
 const out=[];
 for(let k=0;k<Math.floor(worldSize/STREET.spacing);k++){
  const at=k*STREET.spacing;out.push(at+STREET.sidewalk/2,at+STREET.band-STREET.sidewalk/2);
 }
 return out;
}
function onSidewalk(x,z,worldSize=512){
 const local=v=>((v%STREET.spacing)+STREET.spacing)%STREET.spacing;
 const side=v=>v<STREET.sidewalk||(v>=STREET.band-STREET.sidewalk&&v<STREET.band);
 if(x<0||z<0||x>worldSize||z>worldSize)return false;
 return side(local(x))||side(local(z));
}
function onRoad(x,z){
 const local=v=>((v%STREET.spacing)+STREET.spacing)%STREET.spacing;
 const asphalt=v=>v>=STREET.sidewalk&&v<STREET.band-STREET.sidewalk;
 return asphalt(local(x))||asphalt(local(z));
}
function create({scene,BABYLON,worldSize=512,physics=true}={}){
 if(!scene||!BABYLON)throw new TypeError('streets need scene and Babylon');
 const strips=layout(worldSize),h=STREET.curbHeight,parts=[],bodies=[];
 const material=new BABYLON.StandardMaterial('ops-sidewalk-material',scene);
 material.diffuseColor=BABYLON.Color3.FromHexString('#9a9c95');
 material.specularColor=new BABYLON.Color3(.05,.05,.05);
 const curbMaterial=new BABYLON.StandardMaterial('ops-curb-material',scene);
 curbMaterial.diffuseColor=BABYLON.Color3.FromHexString('#c9c8bf');
 curbMaterial.specularColor=new BABYLON.Color3(.05,.05,.05);
 for(const [i,s] of strips.entries()){
  const length=s.end-s.start,mid=(s.start+s.end)/2;
  const box=BABYLON.MeshBuilder.CreateBox('ops-sidewalk-'+i,
   s.axis==='z'?{width:STREET.sidewalk,height:h,depth:length}:{width:length,height:h,depth:STREET.sidewalk},scene);
  if(s.axis==='z')box.position.set(s.line,h/2,mid);else box.position.set(mid,h/2,s.line);
  box.isPickable=false;
  if(physics&&BABYLON.PhysicsAggregate&&scene.getPhysicsEngine?.()){
   const aggregate=new BABYLON.PhysicsAggregate(box,BABYLON.PhysicsShapeType.BOX,{mass:0,friction:1},scene);
   bodies.push(aggregate);
  }
  parts.push(box);
 }
 // Light curb edge on top of each strip's road side for contrast.
 const edges=[];
 for(const [i,s] of strips.entries()){
  const length=s.end-s.start,mid=(s.start+s.end)/2;
  const roadSide=((s.line%STREET.spacing)<STREET.band/2)?1:-1;
  const edge=BABYLON.MeshBuilder.CreateBox('ops-curb-edge-'+i,
   s.axis==='z'?{width:.22,height:.02,depth:length}:{width:length,height:.02,depth:.22},scene);
  const offset=roadSide*(STREET.sidewalk/2-.11);
  if(s.axis==='z')edge.position.set(s.line+offset,h+.01,mid);else edge.position.set(mid,h+.01,s.line+offset);
  edges.push(edge);
 }
 // One draw call each: physics keeps its own boxes, rendering uses merged copies.
 const visual=BABYLON.Mesh.MergeMeshes(parts.map(p=>p.clone(p.name+'-v')),true,true);
 if(visual){visual.name='ops-sidewalks';visual.material=material;visual.isPickable=false;}
 for(const p of parts)p.isVisible=false;
 const curbs=BABYLON.Mesh.MergeMeshes(edges,true,true);
 if(curbs){curbs.name='ops-curbs';curbs.material=curbMaterial;curbs.isPickable=false;}
 let disposed=false;
 function dispose(){
  if(disposed)return;disposed=true;
  for(const b of bodies)b.dispose();
  for(const p of parts)p.dispose();
  visual?.dispose();curbs?.dispose();material.dispose();curbMaterial.dispose();
 }
 return Object.freeze({dispose,get strips(){return strips;},get colliderCount(){return bodies.length;}});
}
return Object.freeze({STREET,layout,crossings,onSidewalk,onRoad,create});
});
