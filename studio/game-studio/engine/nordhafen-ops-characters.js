/* Nordhafen Ops: ownership of shared model containers and disposable instances. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsCharacters=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ROLES=Object.freeze(['rogue','warrior','ranger','wizard','cleric','monk']);
const ASSETS=Object.freeze(ROLES.map(role=>role==='rogue'?'./assets/nordhafen-player-rogue.glb':'./assets/nordhafen-char-'+role+'.glb'));
function registry(load){const containers=new Map(),instances=new Set();
 async function acquire(role){if(!ROLES.includes(role))throw Error('unknown character role');if(!containers.has(role))containers.set(role,Promise.resolve().then(()=>load(ASSETS[ROLES.indexOf(role)])));return containers.get(role);}
 async function spawn(role,options){const container=await acquire(role);const entry=container.instantiateModelsToScene(undefined,false,options||{});instances.add(entry);return entry;}
 function release(entry){if(!instances.has(entry))return false;instances.delete(entry);entry.dispose();return true;}
 function reset(){for(const entry of instances)entry.dispose();instances.clear();}
 function dispose(){reset();for(const value of containers.values())Promise.resolve(value).then(c=>c.dispose?.());containers.clear();}
 function count(){return instances.size;}
 return {acquire,spawn,release,reset,dispose,count};
}
function animated(distance,lod=70){return distance<lod;}
return Object.freeze({ROLES,ASSETS,registry,animated});
});