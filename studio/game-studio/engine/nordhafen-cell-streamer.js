/* Isolated deterministic Nordhafen proxy cell streamer; not the user-project GLB loader. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenCellStreamer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create({scene,fixture,buildCell,loadRadius=48,unloadRadius=96,budget=2,now}={}){
  if(!scene||!fixture||!Array.isArray(fixture.chunks)||typeof buildCell!=='function')
   throw new TypeError('scene, fixture and buildCell required');
  if(!Number.isFinite(loadRadius)||loadRadius<0||!Number.isFinite(unloadRadius)||
     unloadRadius<=loadRadius)throw new TypeError('unloadRadius must exceed loadRadius');
  if(!Number.isInteger(budget)||budget<1)throw new TypeError('positive integer budget required');
  const clock=now||(()=>performance.now());
  const loaded=new Map(),samples=[],released=new WeakSet();
  let disposed=false,loadsTotal=0,unloadsTotal=0;
  const chunks=fixture.chunks,side=fixture.chunkSize;
  function release(resource){
   if(resource&&typeof resource.dispose==='function'&&!released.has(resource)){
    resource.dispose();released.add(resource);
   }
  }
  function unload(id){
   const cell=loaded.get(id);if(!cell)return;
   // Only resources returned by buildCell are owned; shared materials stay untouched.
   for(const mesh of cell.meshes)release(mesh);
   for(const material of cell.materials)release(material);
   loaded.delete(id);unloadsTotal++;
  }
  function distance(chunk,x,z){
   return Math.hypot((chunk.x+.5)*side-x,(chunk.z+.5)*side-z);
  }
  function update(cameraX,cameraZ){
   if(disposed)throw new Error('cell streamer disposed');
   if(!Number.isFinite(cameraX)||!Number.isFinite(cameraZ))throw new TypeError('finite camera coordinates required');
   for(const chunk of chunks){
    if(loaded.has(chunk.id)&&distance(chunk,cameraX,cameraZ)>unloadRadius)unload(chunk.id);
   }
   const candidates=chunks.filter(c=>!loaded.has(c.id)&&distance(c,cameraX,cameraZ)<=loadRadius)
    .sort((a,b)=>distance(a,cameraX,cameraZ)-distance(b,cameraX,cameraZ)||a.id.localeCompare(b.id));
   let newLoads=0;
   for(const chunk of candidates.slice(0,budget)){
    const start=clock();
    let cell;
    try{
     cell=buildCell(chunk);
     if(!cell||!Array.isArray(cell.meshes)||!Array.isArray(cell.materials))
      throw new TypeError('buildCell must return {meshes,materials}');
     const elapsed=clock()-start;
     loaded.set(chunk.id,cell);loadsTotal++;newLoads++;
     if(Number.isFinite(elapsed)&&elapsed>=0){samples.push(elapsed);if(samples.length>512)samples.shift();}
    }catch(e){
     // A failed cell must not affect any other loaded cell.
     if(cell&&Array.isArray(cell.meshes)&&Array.isArray(cell.materials)){
      for(const mesh of cell.meshes)release(mesh);
      for(const material of cell.materials)release(material);
     }
    }
   }
   return Object.freeze({newLoads,loadedCells:loaded.size,pendingCells:Math.max(0,candidates.length-newLoads)});
  }
  function report(){
   const sorted=samples.slice().sort((a,b)=>a-b);
   function percentile(p){
    if(!sorted.length)return null;
    const i=(sorted.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);
    return Number((sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo)).toFixed(4));
   }
   return Object.freeze({loadedCells:loaded.size,pendingCells:chunks.length-loaded.size,
    loadsTotal,unloadsTotal,loadMsP50:percentile(.5),loadMsP95:percentile(.95)});
  }
  function dispose(){
   if(disposed)return;
   for(const id of [...loaded.keys()])unload(id);
   disposed=true;
  }
  return Object.freeze({update,report,dispose});
 }
 return Object.freeze({create});
});
