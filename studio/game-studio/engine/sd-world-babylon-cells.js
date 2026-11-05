/* Opt-in Babylon GLB cell adapter for SDWorldStreamController. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDWorldBabylonCells=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create({scene,Babylon,resolveCell,onError}={}){
 if(!scene||!Babylon||!Babylon.SceneLoader||typeof Babylon.SceneLoader.ImportMeshAsync!=='function'||typeof resolveCell!=='function')throw new TypeError('scene, Babylon.SceneLoader and resolveCell required');
 const active=new Map(),pending=new Set(),disposed=new WeakSet();
 function cleanup(result){
  if(!result)return;
  const nodes=[...(result.meshes||[]),...(result.transformNodes||[])],set=new Set(nodes);
  for(const node of nodes){if(node&&typeof node.dispose==='function'&&!disposed.has(node)&&(!node.parent||!set.has(node.parent))){node.dispose(false,false);disposed.add(node);
    // Babylon node.dispose(false, false) recursively disposes children.
    // Remember descendants so a later retry after another resource fails
    // cannot invoke dispose() a second time on an already freed child.
    for(const child of nodes){
     if(child===node||!child)continue;
     const seen=new Set();let parent=child.parent;
     while(parent&&!seen.has(parent)){
      if(parent===node){disposed.add(child);break;}
      seen.add(parent);parent=parent.parent;
     }
    }}}
  for(const resource of [...(result.skeletons||[]),...(result.animationGroups||[]),...(result.particleSystems||[])]){if(resource&&typeof resource.dispose==='function'&&!disposed.has(resource)){resource.dispose();disposed.add(resource);}}
 }
 function validateURL(url){
  // Never pass query strings, fragments, encoded traversal or non-GLB assets to SceneLoader.
  if(typeof url!=='string'||url.includes('\\')||/[?#%\u0000-\u001f\u007f]/.test(url)||!url.startsWith('./')||!url.toLowerCase().endsWith('.glb'))return false;
  const parts=url.slice(2).split('/');
  return parts.every(part=>part.length>0&&part!=='.'&&part!=='..'&&!part.includes(':'));
 }
 async function load(id,signal){
  if(signal?.aborted)throw new Error('cell load aborted');
  if(active.has(id)||pending.has(id))throw new Error('duplicate cell '+id);
  const spec=resolveCell(id);
  if(!spec||!validateURL(spec.url))throw new TypeError('invalid local cell asset URL');
  pending.add(id);
  try{
   const url=spec.url,slash=url.lastIndexOf('/');
   const result=await Babylon.SceneLoader.ImportMeshAsync('',url.slice(0,slash+1),url.slice(slash+1),scene);
   if(signal?.aborted){cleanup(result);throw new Error('cell load aborted');}
   active.set(id,result);return result;
  }finally{pending.delete(id);}
 }
 async function dispose(resource,id){
  if(active.get(id)!==resource)return; // stale disposals must never release a newer cell
  try{cleanup(resource);active.delete(id);}catch(error){
   // Retain ownership after failed cleanup so the caller can retry eviction.
   // Reporting is best-effort: an observer must not mask the disposal error.
   if(typeof onError==='function'){try{onError(error,id);}catch(_observerError){/* preserve original */}}
   throw error;
  }
 }
 return Object.freeze({load,dispose,activeCount:()=>active.size,pendingCount:()=>pending.size});
}
return Object.freeze({create});
});
