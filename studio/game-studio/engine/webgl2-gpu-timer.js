/* Opt-in WebGL2 EXT_disjoint_timer_query_webgl2 probe.
 * The caller brackets actual GPU work. Never blocks the render loop.
 * No measurements are claimed until the GPU reports a valid query.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDWebGL2GPUTimer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(gl){
   if(!gl||typeof gl.createQuery!=='function'||typeof gl.beginQuery!=='function'||
      typeof gl.endQuery!=='function'||typeof gl.getQueryParameter!=='function'||
      typeof gl.getParameter!=='function'||typeof gl.getExtension!=='function')
     throw new TypeError('WebGL2 query-capable context required');
   const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
   if(!ext||typeof ext.TIME_ELAPSED_EXT!=='number'||typeof ext.GPU_DISJOINT_EXT!=='number')
     throw new Error('GPU timer extension unavailable');
   let active=null,disposed=false;
   const pending=[];
   function ensure(){if(disposed)throw new Error('GPU timer disposed');}
   function begin(){
     ensure();
     if(active||pending.length) return false;
     const q=gl.createQuery();
     if(!q)return false;
     try{gl.beginQuery(ext.TIME_ELAPSED_EXT,q);}
     catch(err){gl.deleteQuery(q);throw err;}
     active=q;
     return true;
   }
   function end(){
     ensure();
     if(!active)return false;
     gl.endQuery(ext.TIME_ELAPSED_EXT);
     pending.push(active);active=null;
     return true;
   }
   function poll(){
     ensure();
     if(!pending.length)return Object.freeze({status:active?'recording':'idle',gpuMs:null});
     const q=pending[0];
     if(gl.getParameter(ext.GPU_DISJOINT_EXT)){
       pending.shift();gl.deleteQuery(q);
       return Object.freeze({status:'disjoint',gpuMs:null});
     }
     if(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE))
       return Object.freeze({status:'pending',gpuMs:null});
     const ns=gl.getQueryParameter(q,gl.QUERY_RESULT);
     pending.shift();gl.deleteQuery(q);
     if(typeof ns!=='number'||!Number.isFinite(ns)||ns<0)
       return Object.freeze({status:'invalid',gpuMs:null});
     return Object.freeze({status:'measured',gpuMs:ns/1e6});
   }
   function dispose(){
     if(disposed)return;
     if(active){try{gl.endQuery(ext.TIME_ELAPSED_EXT);}finally{gl.deleteQuery(active);active=null;}}
     for(const q of pending)gl.deleteQuery(q);
     pending.length=0;disposed=true;
   }
   return Object.freeze({begin,end,poll,dispose});
 }
 return Object.freeze({create});
});
