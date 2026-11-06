/* Opt-in Babylon.js frame-completion cadence bridge.
 * Uses onEndFrameObservable only; NOT GPU timing, no renderer modifications.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenBabylonFrameProbe=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(options){
   if(!options||typeof options!=='object')throw new TypeError('Options required');
   const {engine,telemetry,now,isVisible}=options;
   const observable=engine&&engine.onEndFrameObservable;
   if(!observable||typeof observable.add!=='function'||typeof observable.remove!=='function')
     throw new TypeError('Babylon engine onEndFrameObservable required');
   if(!telemetry||typeof telemetry.sample!=='function'||typeof telemetry.report!=='function'||typeof telemetry.reset!=='function')
     throw new TypeError('Frame telemetry required');
   if(typeof now!=='function')throw new TypeError('Monotonic clock required');
   if(isVisible!==undefined&&typeof isVisible!=='function')
     throw new TypeError('isVisible must be a function');
   let observer=null,active=false,generation=0,lastVisible=true;
   const visible=()=>isVisible?Boolean(isVisible()):true;
   function onFrame(token){
     if(!active||token!==generation)return;
     const currentVisible=visible();
     if(!currentVisible){
       if(lastVisible)telemetry.reset();
     }else{
       if(!lastVisible)telemetry.reset();
       telemetry.sample(now());
     }
     lastVisible=currentVisible;
   }
   function start(){
     if(active)return false;
     generation++;
     lastVisible=visible();
     telemetry.reset();
     const token=generation;
     // Babylon add() returns an observer; reject missing handle to avoid leaking listeners.
     const attached=observable.add(()=>onFrame(token));
     if(!attached)throw new Error('Babylon observer registration failed');
     observer=attached;
     active=true;
     return true;
   }
   function stop(){
     if(!active)return false;
     active=false;generation++;
     const attached=observer;observer=null;
     observable.remove(attached);
     return true;
   }
   function report(){
     return Object.freeze({...telemetry.report(),source:'babylon-end-frame-cadence',
       gpuMeasured:false,renderLoopInstrumented:true,running:active});
   }
   return Object.freeze({start,stop,report,get running(){return active;}});
 }
 return Object.freeze({create});
});
