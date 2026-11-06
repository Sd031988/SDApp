/* Isolated, opt-in WebGL capability audit. No GPU timer measurements.
 * Does not request a new context or alter renderer state.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDWebGLCapabilityAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function inspect(gl){
   if(!gl||typeof gl.getParameter!=='function'||typeof gl.getExtension!=='function')
     throw new TypeError('An existing WebGL context is required');
   const get=(key)=>{
     if(key===undefined||key===null)return null;
     try{const value=gl.getParameter(key);return typeof value==='number'&&Number.isFinite(value)?value:null;}
     catch(_){return null;}
   };
   const ext=name=>{try{return Boolean(gl.getExtension(name));}catch(_){return false;}};
   const webgl2=typeof gl.texStorage3D==='function'&&typeof gl.drawBuffers==='function';
   const timer=webgl2?ext('EXT_disjoint_timer_query_webgl2'):ext('EXT_disjoint_timer_query');
   return Object.freeze({
     schema:'sd-webgl-capability-audit/v1',
     context:webgl2?'webgl2':'webgl1',
     maxTextureSize:get(gl.MAX_TEXTURE_SIZE),
     maxRenderbufferSize:get(gl.MAX_RENDERBUFFER_SIZE),
     maxVertexAttribs:get(gl.MAX_VERTEX_ATTRIBS),
     instancing:webgl2||ext('ANGLE_instanced_arrays'),
     uintIndices:webgl2||ext('OES_element_index_uint'),
     floatTexture:webgl2||ext('OES_texture_float'),
     gpuTimerExtension:timer,
     gpuTimeMeasured:false,
     fpsMeasured:false
   });
 }
 return Object.freeze({inspect});
});
