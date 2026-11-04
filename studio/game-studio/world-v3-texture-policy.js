/* Opt-in World-v3 local texture selection; never fetches or decodes assets. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)root.SDWorldV3TexturePolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_BYTES=128*1024*1024;
const TYPES=Object.freeze({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif',jxl:'image/jxl'});
function invalid(){throw new TypeError('Invalid local texture manifest');}
function plain(o){return o!==null&&typeof o==='object'&&!Array.isArray(o)&&Object.getPrototypeOf(o)===Object.prototype;}
function validateAsset(a){
  if(!plain(a)||Object.keys(a).some(k=>!['name','sha256','size','mime'].includes(k)))invalid();
  if(typeof a.name!=='string'||a.name.length>128||!/^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|webp|avif|jxl)$/i.test(a.name))invalid();
  const ext=a.name.slice(a.name.lastIndexOf('.')+1).toLowerCase();
  if(a.mime!==TYPES[ext]||typeof a.sha256!=='string'||!/^[0-9a-f]{64}$/.test(a.sha256))invalid();
  if(!Number.isSafeInteger(a.size)||a.size<1||a.size>MAX_BYTES)invalid();
  return Object.freeze({name:a.name,sha256:a.sha256,size:a.size,mime:a.mime});
}
function validateManifest(m){
  if(!plain(m)||Object.keys(m).some(k=>!['version','variants'].includes(k))||m.version!==1||!Array.isArray(m.variants)||m.variants.length<1||m.variants.length>6)invalid();
  const seen=new Set();let total=0;
  const variants=m.variants.map(a=>{
    const v=validateAsset(a);
    if(seen.has(v.mime))invalid();
    seen.add(v.mime);total+=v.size;
    if(total>MAX_BYTES)invalid();
    return v;
  });
  if(!variants.some(v=>v.mime==='image/png'||v.mime==='image/jpeg'||v.mime==='image/webp'))invalid();
  return Object.freeze({version:1,variants:Object.freeze(variants)});
}
function selectVariant(manifest,supported=[]){
  const m=validateManifest(manifest);
  if(!Array.isArray(supported)||supported.length>10||supported.some(s=>typeof s!=='string'||!Object.values(TYPES).includes(s)))invalid();
  const allowed=new Set(supported);
  // Prefer advanced codecs only when the caller explicitly confirms decoder support.
  const order=['image/jxl','image/avif','image/webp','image/png','image/jpeg'];
  const match=order.map(t=>m.variants.find(v=>v.mime===t&&allowed.has(t))).find(Boolean);
  return match||null; // No automatic fallback to an unsupported codec.
}
return Object.freeze({validateAsset,validateManifest,selectVariant,MAX_BYTES});
});
