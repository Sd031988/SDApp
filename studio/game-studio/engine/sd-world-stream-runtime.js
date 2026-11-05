/* SD Engine: opt-in async world-cell resource lifecycle; no Babylon dependency. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDWorldStreamRuntime=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(options){
 if(!options||typeof options.load!=='function'||typeof options.dispose!=='function')throw new TypeError('load and dispose required');
 const limit=options.maxConcurrent===undefined?2:options.maxConcurrent;
 if(!Number.isSafeInteger(limit)||limit<1||limit>16)throw new RangeError('maxConcurrent');
 const loaded=new Map(),pending=new Map();let epoch=0,closed=false,desired=new Set();
 const dispose=(value,id)=>Promise.resolve(options.dispose(value,id));
 const snapshot=()=>Object.freeze({loaded:Object.freeze([...loaded.keys()]),pending:Object.freeze([...pending.keys()]),closed});
 async function reconcile(plan){
  if(closed)throw new Error('runtime closed');
  if(!plan||!Array.isArray(plan.desired)||!Array.isArray(plan.acquire)||!Array.isArray(plan.release))throw new TypeError('plan');
  const next=new Set(plan.desired);
  if(next.size!==plan.desired.length||[...next].some(id=>typeof id!=='string'||!/^(0|[1-9]\d*):(0|[1-9]\d*)$/.test(id)))throw new TypeError('desired IDs');
  desired=next;const current=++epoch;
  for(const [id,task] of pending)if(!desired.has(id))task.controller.abort();
  for(const [id,value] of loaded)if(!desired.has(id)){loaded.delete(id);await dispose(value,id);}
  const queue=[...desired].filter(id=>!loaded.has(id)&&!pending.has(id));let i=0;
  const workers=Array.from({length:Math.min(limit,queue.length)},async()=>{
   while(i<queue.length&&!closed&&current===epoch){
    const id=queue[i++],controller=new AbortController(),task={controller};pending.set(id,task);
    try{
     const value=await options.load(id,controller.signal);
     if(closed||controller.signal.aborted||!desired.has(id))await dispose(value,id);
     else loaded.set(id,value);
    }catch(error){if(!controller.signal.aborted&&!closed&&typeof options.onError==='function')options.onError(error,id);}
    finally{if(pending.get(id)===task)pending.delete(id);}
   }
  });
  await Promise.all(workers);return snapshot();
 }
 async function close(){
  if(closed)return;closed=true;++epoch;
  for(const task of pending.values())task.controller.abort();
  const entries=[...loaded];loaded.clear();await Promise.all(entries.map(([id,value])=>dispose(value,id)));
 }
 return Object.freeze({reconcile,snapshot,close});
}
return Object.freeze({create});
});