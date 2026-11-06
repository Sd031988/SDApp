/* Opt-in wiring between an existing Babylon end-frame observable and the
 * Nordhafen benchmark session. No automatic editor/scene changes.
 * End-frame cadence is NOT GPU time; independent metrics must be supplied.
 */
(function(root,factory){
 const api=factory(
  typeof module==='object'&&module.exports?require('./nordhafen-benchmark-session.js'):root.SDNordhafenBenchmarkSession,
  typeof module==='object'&&module.exports?require('./nordhafen-babylon-frame-probe.js'):root.SDNordhafenBabylonFrameProbe
 );
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenBabylonSessionBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(sessions,probes){
 'use strict';
 function create({engine,now,isVisible,level='small',seed=1337,maxSamples=600,preset='desktop60'}={}){
  if(!sessions||!probes)throw new Error('Nordhafen dependencies missing');
  const session=sessions.create({level,seed,maxSamples,preset});
  const telemetry=Object.freeze({
   sample:timestamp=>session.sampleFrame(timestamp),
   report:()=>session.report().frame,
   reset:()=>session.reset()
  });
  const probe=probes.create({engine,telemetry,now,isVisible});
  function report(){
   const result=session.report();
   return Object.freeze({...result,source:'babylon-end-frame-cadence',
    gpuMeasured:false,rendererAttached:probe.running});
  }
  function supplyMeasuredMetrics(metrics){session.supplyMeasuredMetrics(metrics);}
  return Object.freeze({
   start:probe.start,stop:probe.stop,report,supplyMeasuredMetrics,
   get running(){return probe.running;}
  });
 }
 return Object.freeze({create});
});
