/* Explicitly opt-in GPU timer wiring for isolated Nordhafen lab. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenLabGPUWiring=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create({scene,gl,timerAPI,sessionAPI,statisticsAPI}={}){
  if(!scene||!scene.onBeforeRenderObservable||!scene.onAfterRenderObservable||
     !timerAPI||!sessionAPI||!statisticsAPI)throw new TypeError('GPU lab dependencies missing');
  let session=null,before=null,after=null,active=false,unavailable=false;
  let error=null;
  function detach(){
   if(before){scene.onBeforeRenderObservable.remove(before);before=null;}
   if(after){scene.onAfterRenderObservable.remove(after);after=null;}
  }
  function stop(){
   detach();active=false;
   if(session){session.dispose();session=null;}
  }
  function start(){
   if(active)return true;
   stop();unavailable=false;error=null;
   try{
    // A missing extension is not a CPU fallback and must not generate samples.
    if(!gl||typeof gl.getExtension!=='function'||
       !gl.getExtension('EXT_disjoint_timer_query_webgl2')){
      unavailable=true;return false;
    }
    session=sessionAPI.create({
     timer:timerAPI.create(gl),
     statistics:statisticsAPI.create()
    });
    before=scene.onBeforeRenderObservable.add(()=>{
     try{
      session.poll(); // only previously completed hardware queries are accepted
      session.begin(); // false while a prior query remains pending
     }catch(e){error=e.message;stop();}
    });
    after=scene.onAfterRenderObservable.add(()=>{
     if(!active)return;
     try{session.end();session.poll();}
     catch(e){error=e.message;stop();}
    });
    active=true;return true;
   }catch(e){error=e.message;unavailable=true;stop();return false;}
  }
  function report(){
   if(!session)return {active:false,unavailable,error,sampleCount:0,gpuP50Ms:null,gpuP95Ms:null};
   const r=session.report();
   return {...r,active,unavailable:false,error};
  }
  return Object.freeze({start,stop,report,get active(){return active;}});
 }
 return Object.freeze({create});
});
