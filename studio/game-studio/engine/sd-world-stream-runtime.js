/* SD Engine: opt-in async world-cell resource lifecycle; no Babylon dependency. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDWorldStreamRuntime=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(options){
 if(!options||typeof options.load!=='function'||typeof options.dispose!=='function')throw new TypeError('load and dispose required');
 const limit=options.maxConcurrent===undefined?2:options.maxConcurrent;
 if(!Number.isSafeInteger(limit)||limit<1||limit>16)throw new RangeError('maxConcurrent');
 const loaded=new Map(),pending=new Map();let closed=false,desired=new Set(),chain=Promise.resolve(),shutdown=null;
 const dispose=(value,id)=>Promise.resolve(options.dispose(value,id));
 const snapshot=()=>Object.freeze({loaded:Object.freeze([...loaded.keys()]),pending:Object.freeze([...pending.keys()]),closed});
 const valid=id=>typeof id==='string'&&/^(0|[1-9]\d*):(0|[1-9]\d*)$/.test(id);
 function reconcile(plan){
  if(closed)return Promise.reject(new Error('runtime closed'));
  if(!plan||!Array.isArray(plan.desired)||!Array.isArray(plan.acquire)||!Array.isArray(plan.release))return Promise.reject(new TypeError('plan'));
  const ids=plan.desired.slice(),next=new Set(ids);
  if(next.size!==ids.length||ids.some(id=>!valid(id)))return Promise.reject(new TypeError('desired IDs'));
  // Serialize reconciliations; overlapping callers cannot overwrite in-flight state.
  const job=chain.then(async()=>{
   if(closed)throw new Error('runtime closed');
   desired=next;
   for(const [id,task] of pending)if(!desired.has(id))task.controller.abort();
   for(const [id,value] of loaded)if(!desired.has(id)){loaded.delete(id);await dispose(value,id);}
   const queue=ids.filter(id=>!loaded.has(id)&&!pending.has(id));let i=0;
   const workers=Array.from({length:Math.min(limit,queue.length)},async()=>{
    while(i<queue.length&&!closed){
     const id=queue[i++],controller=new AbortController(),task={controller};pending.set(id,task);
     try{
      let value;
      try{value=await options.load(id,controller.signal);}
      catch(error){
       if(!controller.signal.aborted&&!closed&&typeof options.onError==='function'){
        try{options.onError(error,id);}catch(_ignored){/* observer cannot strand cleanup */}
       }
       continue;
      }
      // Disposal is a resource-lifecycle failure, not a load failure.
      // Propagate it so callers can detect a potentially leaked GPU resource.
      if(closed||controller.signal.aborted||!desired.has(id))await dispose(value,id);
      else loaded.set(id,value);
     }finally{if(pending.get(id)===task)pending.delete(id);}
    }
   });
   await Promise.all(workers);return snapshot();
  });
  chain=job.catch(()=>{});return job;
 }
 function close(){
  if(shutdown)return shutdown;
  closed=true;for(const task of pending.values())task.controller.abort();
  shutdown=chain.then(async()=>{
   const entries=[...loaded];loaded.clear();
   const outcomes=await Promise.allSettled(entries.map(([id,value])=>dispose(value,id)));
   const failed=outcomes.find(x=>x.status==='rejected');if(failed)throw failed.reason;
  });
  return shutdown;
 }
 return Object.freeze({reconcile,snapshot,close});
}
return Object.freeze({create});
});
