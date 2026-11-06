/* Opt-in benchmark frame-window integrity; no renderer or user-project mutation. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenFrameWindowAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function audit(frames,{expectedRouteSteps}={}){
  if(!Array.isArray(frames)||!Number.isSafeInteger(expectedRouteSteps)||
     expectedRouteSteps<1||expectedRouteSteps>4096)
   throw new TypeError('frames and positive bounded route length required');
  const errors=[];
  let previousTime=-Infinity,previousStep=-1,validDraw=0,validHeap=0;
  for(let i=0;i<frames.length;i++){
   const f=frames[i];
   if(!f||typeof f!=='object'){errors.push('frame '+i+': invalid');continue;}
   if(typeof f.timestampMs!=='number'||!Number.isFinite(f.timestampMs)||
      f.timestampMs<=previousTime)errors.push('frame '+i+': nonmonotonic timestamp');
   else previousTime=f.timestampMs;
   if(!Number.isSafeInteger(f.routeStep)||f.routeStep<0||
      f.routeStep>=expectedRouteSteps||f.routeStep<previousStep||
      f.routeStep>previousStep+1)errors.push('frame '+i+': invalid route step');
   else previousStep=f.routeStep;
   for(const [field,label] of [['drawCalls','draw'],['heapBytes','heap']]){
    const value=f[field];
    if(value===null||value===undefined)continue;
    if(typeof value!=='number'||!Number.isFinite(value)||value<0)
     errors.push('frame '+i+': invalid '+label);
    else if(field==='drawCalls')validDraw++;
    else validHeap++;
   }
  }
  if(previousStep!==expectedRouteSteps-1)errors.push('route incomplete');
  if(!frames.length)errors.push('no frames');
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),
   frames:frames.length,drawSamples:validDraw,heapSamples:validHeap,
   complete:previousStep===expectedRouteSteps-1&&errors.length===0});
 }
 return Object.freeze({audit});
});
