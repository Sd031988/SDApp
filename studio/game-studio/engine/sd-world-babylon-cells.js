/* Opt-in Babylon GLB cell adapter for SDWorldStreamController. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDWorldBabylonCells=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create({scene,Babylon,resolveCell,onError}={}){
 if(!scene||!Babylon||!Babylon.SceneLoader||typeof Babylon.SceneLoader.ImportMeshAsync!=='function'||typeof resolveCell!=='function')throw new TypeError('scene, Babylon.SceneLoader and resolveCell required');
 const active=new Map();
 function cleanup(result){
  if(!result)return;
  const nodes=[...(result.meshes||[]),...(result.transformNodes||[])],set=new Set(nodes);
  for(const node of nodes){if(node&&typeof node.dispose==='function'&&(!node.parent||!set.has(node.parent)))node.dispose(false,true);}
  for(const resource of [...(result.skeletons||[]),...(result.animationGroups||[]),...(result.particleSystems||[])]){if(resource&&typeof resource.dispose==='function')resource.dispose();}
 }
 async function load(id,signal){
  if(signal?.aborted)throw new Error('cell load aborted');
  const spec=resolveCell(id);
  if(!spec||typeof spec.url!=='string'||!/^\.?\.?\//.test(spec.url)||spec.url.includes('\\')||spec.url.split(/[?#]/)[0].split('/').includes('..'))throw new TypeError('invalid local cell asset URL');
  const url=spec.url,slash=url.lastIndexOf('/');
  const result=await Babylon.SceneLoader.ImportMeshAsync('',url.slice(0,slash+1),url.slice(slash+1),scene);
  if(signal?.aborted){cleanup(result);throw new Error('cell load aborted');}
  if(active.has(id)){cleanup(result);throw new Error('duplicate cell '+id);}
  active.set(id,result);return result;
 }
 async function dispose(resource,id){
  if(active.get(id)===resource)active.delete(id);
  try{cleanup(resource);}catch(error){if(typeof onError==='function')onError(error,id);throw error;}
 }
 return Object.freeze({load,dispose,activeCount:()=>active.size});
}
return Object.freeze({create});
});