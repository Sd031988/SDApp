/* Isolated deterministic Nordhafen proxy cell streamer; not the user-project GLB loader. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenCellStreamer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create({scene,fixture,buildCell,loadRadius=48,unloadRadius=96,budget=2,lodBudget=2,now}={}){
  if(!scene||!fixture||!Array.isArray(fixture.chunks)||typeof buildCell!=='function')
   throw new TypeError('scene, fixture and buildCell required');
  if(!Number.isFinite(loadRadius)||loadRadius<0||!Number.isFinite(unloadRadius)||
     unloadRadius<=loadRadius)throw new TypeError('unloadRadius must exceed loadRadius');
  if(!Number.isInteger(budget)||budget<1)throw new TypeError('positive integer budget required');
  if(!Number.isInteger(lodBudget)||lodBudget<1)throw new TypeError('positive integer LOD budget required');
  const clock=now||(()=>performance.now());
  const loaded=new Map(),pending=new Map(),samples=[],released=new WeakSet(),failures=new Map();
  let disposed=false,loadsTotal=0,unloadsTotal=0,lodFailures=0,lodSwitchesTotal=0,maxBuildSliceMs=0;
  const chunks=fixture.chunks,side=fixture.chunkSize;
  let centerX=0,centerZ=0;
  const lodPending=new Set();
  function release(resource){
   if(resource&&typeof resource.dispose==='function'&&!released.has(resource)){
    resource.dispose();released.add(resource);
   }
  }
  function freeCell(cell){
   if(!cell)return;
   if(typeof cell.dispose==='function')cell.dispose();
   for(const mesh of cell.meshes)release(mesh);
   for(const material of cell.materials)release(material);
  }
  function cancel(id){
   const job=pending.get(id);if(!job)return;
   pending.delete(id);job.controller.abort();
  }
  function unload(id){
   const cell=loaded.get(id);if(!cell)return;
   // Only resources returned by buildCell are owned; shared materials stay untouched.
   freeCell(cell);
   loaded.delete(id);unloadsTotal++;
  }
  function distance(chunk,x,z){
   return Math.hypot((chunk.x+.5)*side-x,(chunk.z+.5)*side-z);
  }
  function recordFailure(id){
   if(disposed)return;
   const count=(failures.get(id)?.count||0)+1;
   failures.set(id,{count,retryAt:clock()+Math.min(30000,1000*Math.pow(2,Math.min(count-1,5)))});
  }
  function update(cameraX,cameraZ){
   if(disposed)throw new Error('cell streamer disposed');
   if(!Number.isFinite(cameraX)||!Number.isFinite(cameraZ))throw new TypeError('finite camera coordinates required');
   centerX=cameraX;centerZ=cameraZ;
   for(const chunk of chunks){
    if(loaded.has(chunk.id)&&distance(chunk,cameraX,cameraZ)>unloadRadius)unload(chunk.id);
    if(pending.has(chunk.id)&&distance(chunk,cameraX,cameraZ)>unloadRadius)cancel(chunk.id);
   }
   const lodCandidates=chunks.filter(c=>loaded.has(c.id)&&
    typeof loaded.get(c.id).updateLOD==='function'&&distance(c,cameraX,cameraZ)<=unloadRadius)
    .sort((a,b)=>distance(a,cameraX,cameraZ)-distance(b,cameraX,cameraZ)||a.id.localeCompare(b.id));
   let lodChanges=0;
   for(const chunk of lodCandidates){
    if(lodChanges>=lodBudget)break;
    const cell=loaded.get(chunk.id);
    if(!cell||lodPending.has(cell))continue;
    const d=distance(chunk,cameraX,cameraZ);
    try{
     if(typeof cell.needsLODUpdate==='function'&&!cell.needsLODUpdate(d))continue;
     const before=cell.lodLevel&&cell.lodLevel();
     const after=cell.updateLOD(d);
     if(after&&typeof after.then==='function'){
       lodChanges++;lodPending.add(cell);
       after.then(level=>{
         if(loaded.has(chunk.id)&&level!==null&&before!==level)lodSwitchesTotal++;
       }).catch(()=>{lodFailures++;}).finally(()=>lodPending.delete(cell));
       continue;
     }
     if(!loaded.has(chunk.id))continue; // eviction during transition
     if(before===after)continue;
     lodChanges++;lodSwitchesTotal++;
    }catch(e){lodFailures++;} // keep old level and process other cells
   }
   const candidates=chunks.filter(c=>!loaded.has(c.id)&&!pending.has(c.id)&&distance(c,cameraX,cameraZ)<=loadRadius)
    .sort((a,b)=>distance(a,cameraX,cameraZ)-distance(b,cameraX,cameraZ)||a.id.localeCompare(b.id));
   let newLoads=0;
   for(const chunk of candidates.filter(c=>!failures.has(c.id)||clock()>=failures.get(c.id).retryAt).slice(0,Math.max(0,budget-pending.size))){
    const start=clock();
    let cell;
    try{
     const controller=new AbortController();
     cell=buildCell(chunk,{signal:controller.signal,recordBuildSlice:duration=>{
       if(Number.isFinite(duration)&&duration>=0)maxBuildSliceMs=Math.max(maxBuildSliceMs,duration);
     }});
     if(cell&&typeof cell.then==='function'){
       const job={controller};pending.set(chunk.id,job);newLoads++;
       Promise.resolve(cell).then(async result=>{
         if(!result||!Array.isArray(result.meshes)||!Array.isArray(result.materials))
           throw new TypeError('buildCell must return {meshes,materials}');
         if(disposed||controller.signal.aborted||pending.get(chunk.id)!==job){freeCell(result);return;}
         if(typeof result.updateLOD==='function'){
           const after=await result.updateLOD(distance(chunk,centerX,centerZ));
           if(after!==null)lodSwitchesTotal++;
         }
         if(disposed||controller.signal.aborted||pending.get(chunk.id)!==job){freeCell(result);return;}
         pending.delete(chunk.id);
         loaded.set(chunk.id,result);failures.delete(chunk.id);loadsTotal++;
         const elapsed=clock()-start;
         if(Number.isFinite(elapsed)&&elapsed>=0){samples.push(elapsed);if(samples.length>512)samples.shift();}
       }).catch(()=>{
         if(pending.get(chunk.id)===job){pending.delete(chunk.id);recordFailure(chunk.id);}
       });
       continue;
     }
     if(!cell||!Array.isArray(cell.meshes)||!Array.isArray(cell.materials))
      throw new TypeError('buildCell must return {meshes,materials}');
     const elapsed=clock()-start;
     if(typeof cell.updateLOD==='function'){
      const after=cell.updateLOD(distance(chunk,cameraX,cameraZ));
      if(after!==null)lodSwitchesTotal++;
     }
     loaded.set(chunk.id,cell);failures.delete(chunk.id);loadsTotal++;newLoads++;
     if(Number.isFinite(elapsed)&&elapsed>=0){samples.push(elapsed);if(samples.length>512)samples.shift();}
    }catch(e){
     recordFailure(chunk.id);
     // A failed cell must not affect any other loaded cell.
     if(cell&&Array.isArray(cell.meshes)&&Array.isArray(cell.materials))freeCell(cell);
    }
   }
   return Object.freeze({newLoads,loadedCells:loaded.size,pendingCells:pending.size+Math.max(0,candidates.length-newLoads)});
  }
  function report(){
   const sorted=samples.slice().sort((a,b)=>a-b);
   function percentile(p){
    if(!sorted.length)return null;
    const i=(sorted.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);
    return Number((sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo)).toFixed(4));
   }
   return Object.freeze({loadedCells:loaded.size,unloadedCells:chunks.length-loaded.size,failedCells:failures.size,
    loadsTotal,unloadsTotal,lodFailures,lodSwitchesTotal,inFlightLoads:pending.size,loadMsP50:percentile(.5),loadMsP95:percentile(.95),maxBuildSliceMs});
  }
  function dispose(){
   if(disposed)return;
   disposed=true;
   for(const id of [...pending.keys()])cancel(id);
   for(const id of [...loaded.keys()])unload(id);
   failures.clear();
  }
  return Object.freeze({update,report,dispose,loadedChunkIds:()=>Object.freeze([...loaded.keys()])});
 }
 return Object.freeze({create});
});
