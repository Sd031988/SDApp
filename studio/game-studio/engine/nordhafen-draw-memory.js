/* Babylon draw-call and optional browser JS heap observations; never synthesize values. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenDrawMemory=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function summarize(samples,{complete=false}={}){
  const valid=key=>samples.map(s=>s&&s[key]).filter(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0).sort((a,b)=>a-b);
  const draws=valid('drawCalls'),heap=valid('heapBytes');
  function percentile(values,p){
   if(!values.length)return null;
   const index=(values.length-1)*p,lo=Math.floor(index),hi=Math.ceil(index);
   return values[lo]+(values[hi]-values[lo])*(index-lo);
  }
  return Object.freeze({
   drawCallsP50:percentile(draws,.5),drawCallsP95:percentile(draws,.95),
   drawCallsMax:draws.length?draws[draws.length-1]:null,
   heapP50:percentile(heap,.5),heapMax:heap.length?heap[heap.length-1]:null,
   samples:Math.max(draws.length,heap.length),complete:Boolean(complete)
  });
 }
 function create({scene,performanceAPI}={}){
  const perf=performanceAPI===undefined?(typeof performance!=='undefined'?performance:null):performanceAPI;
  let instrumentation=null,disposed=false;
  try{
   const Babylon=typeof BABYLON!=='undefined'?BABYLON:null;
   if(scene&&Babylon&&typeof Babylon.SceneInstrumentation==='function'){
    instrumentation=new Babylon.SceneInstrumentation(scene);
    instrumentation.captureDrawCalls=true;
   }
  }catch(e){instrumentation=null;}
  function read(){
   if(disposed)throw new Error('draw/memory probe disposed');
   let drawCalls=null,heapBytes=null;
   try{
    const counter=instrumentation&&instrumentation.drawCallsCounter;
    const value=counter&&counter.current;
    if(Number.isFinite(value)&&value>=0)drawCalls=value;
   }catch(e){}
   try{
    const value=perf&&perf.memory&&perf.memory.usedJSHeapSize;
    if(Number.isFinite(value)&&value>=0)heapBytes=value;
   }catch(e){}
   return Object.freeze({drawCalls,heapBytes});
  }
  function dispose(){
   if(disposed)return;
   disposed=true;
   if(instrumentation&&typeof instrumentation.dispose==='function')instrumentation.dispose();
  }
  return Object.freeze({read,dispose});
 }
 return Object.freeze({create,summarize});
});
