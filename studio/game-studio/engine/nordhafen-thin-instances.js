/* Opt-in Babylon thin instances for Nordhafen proxy cells; shared source meshes are never owned. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenThinInstances=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create({chunk,sourceByType,BABYLON,thin=true}={}){
  if(!chunk||!Array.isArray(chunk.objects)||!sourceByType||!BABYLON||!BABYLON.Matrix||!BABYLON.Vector3||!BABYLON.Quaternion)
   throw new TypeError('chunk, sources and Babylon matrix API required');
  const groups=new Map(),meshes=[],materials=[];
  for(const obj of chunk.objects){
   if(!groups.has(obj.type))groups.set(obj.type,[]);
   groups.get(obj.type).push(obj);
  }
  const supported=thin&&[...groups.keys()].every(type=>typeof sourceByType[type]?.clone==='function'&&
   typeof sourceByType[type]?.thinInstanceSetBuffer==='function');
  let disposed=false;
  function own(mesh){
   const original=mesh.dispose.bind(mesh);let released=false;
   mesh.dispose=function(){if(released)return;released=true;original();};
   meshes.push(mesh);
  }
  try{
   for(const [type,objects] of groups){
    const source=sourceByType[type];
    if(!source)throw new TypeError('missing source '+type);
    if(supported){
     const mesh=source.clone('thin-'+chunk.id+'-'+type);
     if(!mesh)throw new Error('thin clone failed');
     own(mesh);
     mesh.isVisible=true;
     const matrices=new Float32Array(objects.length*16);
     objects.forEach((obj,i)=>{
      const h=type==='building'?6:3;
      const scale=new BABYLON.Vector3(type==='building'?4:1,h,type==='building'?4:1);
      const pos=new BABYLON.Vector3(chunk.x*64+obj.x,h/2,chunk.z*64+obj.z);
      BABYLON.Matrix.Compose(scale,BABYLON.Quaternion.Identity(),pos).copyToArray(matrices,i*16);
     });
     mesh.thinInstanceSetBuffer('matrix',matrices,16,true);
    }else{
     for(const obj of objects){
      const mesh=source.createInstance(obj.id);
      own(mesh);
      const h=type==='building'?6:3;
      mesh.position.set(chunk.x*64+obj.x,h/2,chunk.z*64+obj.z);
      mesh.scaling.set(type==='building'?4:1,h,type==='building'?4:1);
     }
    }
   }
  }catch(e){
   for(const mesh of meshes)mesh.dispose();
   throw e;
  }
  function dispose(){
   if(disposed)return;
   disposed=true;
   // Babylon mesh.dispose() releases its thin-instance GPU matrix buffer as well.
   for(const mesh of meshes)mesh.dispose();
  }
  return {meshes,materials,dispose,mode:supported?'thin':'fallback',
   meshCount:meshes.length,instanceCount:chunk.objects.length};
 }
 return Object.freeze({create});
});
