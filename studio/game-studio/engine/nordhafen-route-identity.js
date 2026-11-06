/* Opt-in deterministic benchmark route identity, independent of renderer and user projects. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenRouteIdentity=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function identify({profile,seed,chunkSize,route}={}){
  if(typeof profile!=='string'||!profile||profile.length>80||
   !Number.isSafeInteger(seed)||!Number.isFinite(chunkSize)||chunkSize<=0||
   !Array.isArray(route)||route.length===0||route.length>4096)
   throw new TypeError('invalid benchmark route metadata');
  const seen=new Set(),points=[];
  for(const cell of route){
   if(!cell||!Number.isSafeInteger(cell.x)||!Number.isSafeInteger(cell.z))
    throw new TypeError('route requires integer cell coordinates');
   const key=JSON.stringify([cell.x,cell.z]);
   if(seen.has(key))throw new TypeError('duplicate route cell');
   seen.add(key);points.push([cell.x,cell.z]);
  }
  // Canonical exact serialization; unlike a short hash, unequal routes cannot collide.
  return JSON.stringify(['sd-route-v1',profile,seed,chunkSize,points]);
 }
 return Object.freeze({identify});
});
