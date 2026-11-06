/* Opt-in Nordhafen per-cell LOD lifecycle; proxy assets only. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenCellLOD=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const levels=['full','simplified','placeholder'];
 function create({buildLevel,near=90,far=180,hysteresis=12}={}){
  if(typeof buildLevel!=='function'||!Number.isFinite(near)||!Number.isFinite(far)||
   !Number.isFinite(hysteresis)||near<=0||far<=near||hysteresis<=0||
   near+hysteresis>=far-hysteresis)throw new TypeError('invalid LOD thresholds or builder');
  let active=null,level=null,disposed=false,changing=false;
  const released=new WeakSet();
  function free(cell){
   if(!cell)return;
   for(const item of [...cell.meshes,...cell.materials]){
    if(item&&typeof item.dispose==='function'&&!released.has(item)){
     item.dispose();released.add(item);
    }
   }
  }
  function desired(distance){
   if(level===null)return distance<near?'full':distance<far?'simplified':'placeholder';
   if(level==='full')return distance>far+hysteresis?'placeholder':distance>near+hysteresis?'simplified':'full';
   if(level==='simplified')return distance<near-hysteresis?'full':distance>far+hysteresis?'placeholder':'simplified';
   return distance<near-hysteresis?'full':distance<far-hysteresis?'simplified':'placeholder';
  }
  function update(distance){
   if(disposed)throw new Error('LOD cell disposed');
   if(!Number.isFinite(distance)||distance<0)throw new TypeError('invalid distance');
   if(changing)throw new Error('LOD update already in progress');
   const next=desired(distance);
   if(next===level)return level;
   changing=true;
   try{
    const replacement=buildLevel(next);
    if(!replacement||!Array.isArray(replacement.meshes)||!Array.isArray(replacement.materials))
     throw new TypeError('LOD builder must return meshes and materials arrays');
    if(disposed){free(replacement);return null;}
    const previous=active;
    active=replacement;level=next;
    free(previous);
    return level;
   }finally{changing=false;}
  }
  function dispose(){
   if(disposed)return;
   disposed=true;
   const old=active;active=null;level=null;free(old);
  }
  return Object.freeze({update,dispose,get level(){return level;},get disposed(){return disposed;}});
 }
 return Object.freeze({create,levels:Object.freeze(levels)});
});
