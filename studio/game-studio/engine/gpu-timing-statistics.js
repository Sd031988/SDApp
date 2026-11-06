/* GPU timing statistics: only accepted WebGL timer status='measured' values.
 * Does not initiate GPU queries, infer GPU timing from FPS, or persist data.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDGPUTimingStatistics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(options={}){
   const capacity=options.capacity===undefined?256:options.capacity;
   const minimum=options.minimum===undefined?30:options.minimum;
   if(!Number.isInteger(capacity)||capacity<2||capacity>10000)
     throw new RangeError('capacity must be 2..10000');
   if(!Number.isInteger(minimum)||minimum<2||minimum>capacity)
     throw new RangeError('minimum must be 2..capacity');
   let samples=[],rejected=0;
   function ingest(result){
     if(!result||result.status!=='measured'||
        typeof result.gpuMs!=='number'||!Number.isFinite(result.gpuMs)||
        result.gpuMs<0){
       rejected++;
       return false;
     }
     samples.push(result.gpuMs);
     if(samples.length>capacity)samples.shift();
     return true;
   }
   function report(){
     const count=samples.length;
     const ready=count>=minimum;
     const sorted=ready?samples.slice().sort((a,b)=>a-b):null;
     function quantile(p){
       const index=(sorted.length-1)*p;
       const lower=Math.floor(index),upper=Math.ceil(index);
       return sorted[lower]+(sorted[upper]-sorted[lower])*(index-lower);
     }
     return Object.freeze({
       schema:'sd-gpu-timing-statistics/v1',
       source:'EXT_disjoint_timer_query_webgl2',
       measured:ready,sampleCount:count,minimumSamples:minimum,
       rejectedCount:rejected,
       gpuP50Ms:ready?Number(quantile(.5).toFixed(4)):null,
       gpuP95Ms:ready?Number(quantile(.95).toFixed(4)):null
     });
   }
   function reset(){samples=[];rejected=0;}
   return Object.freeze({ingest,report,reset});
 }
 return Object.freeze({create});
});
