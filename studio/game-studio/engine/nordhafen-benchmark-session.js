/* Explicit Nordhafen benchmark session; no editor or renderer side effects.
 * Fixture is synthetic; FPS only measured from externally supplied render-loop timestamps.
 * Full quality gate requires independently measured draw calls, memory and load time.
 */
(function(root,factory){
 const api=factory(
   typeof module==='object'&&module.exports?require('./nordhafen-benchmark.js'):root.SDNordhafenBenchmark,
   typeof module==='object'&&module.exports?require('./nordhafen-frame-telemetry.js'):root.SDNordhafenTelemetry,
   typeof module==='object'&&module.exports?require('./game-quality-gates.js'):root.SDGameQualityGates
 );
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenBenchmarkSession=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(benchmark,telemetry,gates){
 'use strict';
 function create({level='small',seed=1337,maxSamples=600,preset='desktop60'}={}){
   if(!benchmark||!telemetry||!gates)throw new Error('Benchmark dependencies required');
   if(!Object.hasOwn(gates.presets,preset))throw new RangeError('Unknown performance preset');
   const fixture=benchmark.create(level,seed);
   const frames=telemetry.create({maxSamples});
   let metrics=null;
   function supplyMeasuredMetrics(value){
     if(!value||typeof value!=='object'||Array.isArray(value))
       throw new TypeError('Independent renderer metrics required');
     const next={};
     for(const key of ['drawCalls','memoryMb','loadSeconds']){
       if(typeof value[key]!=='number'||!Number.isFinite(value[key])||value[key]<0)
         throw new TypeError('Invalid independently measured metric: '+key);
       next[key]=value[key];
     }
     metrics=Object.freeze(next);
   }
   function report(){
     const frame=frames.report();
     const ready=frame.measured&&metrics!==null;
     const verdict=ready?gates.evaluate({
       fps:frame.fps,frameP95Ms:frame.frameP95Ms,...metrics
     },preset):null;
     return Object.freeze({
       schema:'sd-nordhafen-benchmark-session/v1',
       fixture:Object.freeze({level:fixture.level,seed:fixture.seed,chunkCount:fixture.chunks.length,objectCount:fixture.objectCount,synthetic:true}),
       frame,independentMetricsSupplied:metrics!==null,
       qualityEvaluated:ready,quality:verdict
     });
   }
   function reset(){frames.reset();metrics=null;}
   return Object.freeze({fixture,sampleFrame:frames.sample,supplyMeasuredMetrics,report,reset});
 }
 return Object.freeze({create});
});
