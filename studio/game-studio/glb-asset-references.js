/* SD Game-Studio v3: local-only, content-addressed GLB references.
 * No network fetch, file-system access, or implicit user-project writes. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root&&root.document)root.SDGLBReferences=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_BYTES=100*1024*1024;
const HASH=/^[a-f0-9]{64}$/;
const NAME=/^[a-zA-Z0-9][a-zA-Z0-9._ -]{0,119}\.glb$/i;
function fail(){throw new Error('Ungültige lokale GLB-Referenz.');}
function validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input))fail();
  const {version,kind,name,sha256,bytes}=input;
  if(version!==1||kind!=='local-glb'||typeof name!=='string'||
    !NAME.test(name)||name==='.'||name==='..'||name.includes('..')||
    typeof sha256!=='string'||!HASH.test(sha256)||
    !Number.isSafeInteger(bytes)||bytes<12||bytes>MAX_BYTES)fail();
  if(Object.keys(input).some(k=>!['version','kind','name','sha256','bytes'].includes(k)))fail();
  return Object.freeze({version:1,kind:'local-glb',name,sha256,bytes});
}
function create(name,sha256,bytes){
  return validate({version:1,kind:'local-glb',name,sha256,bytes});
}
function resolve(reference,files){
  const ref=validate(reference);
  if(!files||typeof files[Symbol.iterator]!=='function')fail();
  // Resolution is deliberately explicit: caller supplies already verified local files.
  // Never use reference.name as a URL or local filesystem path.
  for(const entry of files){
    if(entry&&entry.sha256===ref.sha256&&entry.bytes===ref.bytes&&entry.file)
      return entry.file;
  }
  return null;
}
return Object.freeze({MAX_BYTES,validate,create,resolve});
});
