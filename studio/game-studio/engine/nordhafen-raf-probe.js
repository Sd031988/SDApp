/* Opt-in browser RAF cadence probe. Reports scheduling cadence, NOT GPU draw time.
 * Dependency injection enables deterministic tests without a browser.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenRAFProbe=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(options){
   if(!options||typeof options!=='object')throw new TypeError('Options required');
   const {telemetry,requestFrame,cancelFrame,isVisible}=options;
   if(!telemetry||typeof telemetry.sample!=='function'||typeof telemetry.report!=='function'||typeof telemetry.reset!=='function')
     throw new TypeError('Frame telemetry required');
   if(typeof requestFrame!=='function'||typeof cancelFrame!=='function')
     throw new TypeError('RAF scheduler required');
   if(isVisible!==undefined&&typeof isVisible!=='function')
     throw new TypeError('isVisible must be a function');
   let running=false,handle=null,generation=0,lastVisible=true;
   const visible=()=>isVisible?Boolean(isVisible()):true;
   function tick(timestamp,token){
     if(!running||token!==generation)return;
     handle=null;
     const nowVisible=visible();
     if(!nowVisible){
       if(lastVisible)telemetry.reset();
     }else{
       if(!lastVisible)telemetry.reset();
       telemetry.sample(timestamp);
     }
     lastVisible=nowVisible;
     if(running&&token===generation)handle=requestFrame(t=>tick(t,token));
   }
   function start(){
     if(running)return false;
     running=true;generation++;lastVisible=visible();telemetry.reset();
     const token=generation;
     try{handle=requestFrame(t=>tick(t,token));}
     catch(error){running=false;generation++;throw error;}
     return true;
   }
   function stop(){
     if(!running)return false;
     running=false;generation++;
     if(handle!==null)cancelFrame(handle);
     handle=null;
     return true;
   }
   function report(){
     const r=telemetry.report();
     return Object.freeze({...r,source:'browser-raf-cadence',gpuMeasured:false,running});
   }
   return Object.freeze({start,stop,report,get running(){return running;}});
 }
 return Object.freeze({create});
});
