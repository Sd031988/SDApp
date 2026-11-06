/* Opt-in GPU timer -> measured percentile bridge. No renderer hooks or auto-start. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDGPUTimingSession=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(options={}){
   const timer=options.timer,statistics=options.statistics;
   if(!timer||!statistics||typeof timer.begin!=='function'||
     typeof timer.end!=='function'||typeof timer.poll!=='function'||
     typeof timer.dispose!=='function'||typeof statistics.ingest!=='function'||
     typeof statistics.report!=='function')throw new TypeError('timer and statistics adapters required');
   let disposed=false;
   function ensure(){if(disposed)throw new Error('GPU timing session disposed');}
   function begin(){ensure();return timer.begin();}
   function end(){ensure();return timer.end();}
   function poll(){
     ensure();
     const result=timer.poll();
     // Only hardware-confirmed measured samples may enter the statistics.
     if(result&&result.status==='measured')statistics.ingest(result);
     return result;
   }
   function report(){ensure();return statistics.report();}
   function dispose(){if(disposed)return;disposed=true;timer.dispose();}
   return Object.freeze({begin,end,poll,report,dispose});
 }
 return Object.freeze({create});
});
