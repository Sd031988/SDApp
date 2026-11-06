/* Opt-in browser frame telemetry: no network, no storage, no editor mutation.
 * Samples are real only when caller feeds measured render-loop timestamps.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenTelemetry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(options={}){
   const maxSamples=options.maxSamples===undefined?600:options.maxSamples;
   if(!Number.isInteger(maxSamples)||maxSamples<2||maxSamples>10000)
     throw new RangeError('maxSamples must be between 2 and 10000');
   const frames=[];
   let previous=null;
   function sample(timestampMs){
     if(typeof timestampMs!=='number'||!Number.isFinite(timestampMs)||timestampMs<0)
       throw new TypeError('Timestamp must be a finite nonnegative number');
     if(previous!==null&&timestampMs<=previous)
       throw new RangeError('Timestamps must increase');
     if(previous!==null){
       const duration=timestampMs-previous;
       frames.push(duration);
       if(frames.length>maxSamples)frames.shift();
     }
     previous=timestampMs;
     return frames.length;
   }
   function report(){
     if(frames.length<2)return Object.freeze({
       schema:'sd-nordhafen-frame-telemetry/v1',measured:false,sampleCount:frames.length,
       fps:null,frameP50Ms:null,frameP95Ms:null
     });
     const sorted=frames.slice().sort((a,b)=>a-b);
     const total=frames.reduce((a,b)=>a+b,0);
     return Object.freeze({
       schema:'sd-nordhafen-frame-telemetry/v1',measured:true,
       sampleCount:frames.length,
       fps:Number((1000*frames.length/total).toFixed(2)),
       frameP50Ms:Number(sorted[Math.ceil(sorted.length*.5)-1].toFixed(3)),
       frameP95Ms:Number(sorted[Math.ceil(sorted.length*.95)-1].toFixed(3))
     });
   }
   function reset(){frames.length=0;previous=null;}
   return Object.freeze({sample,report,reset});
 }
 return Object.freeze({create});
});
