/* Opt-in glTF 2.0 metallic-roughness material normalization. No GPU or I/O. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)root.SDWorldV3PBRMaterial=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function fail(){throw new TypeError('Invalid PBR material');}
function plain(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;}
function keys(v,allowed){if(!plain(v)||Object.keys(v).some(k=>!allowed.includes(k)))fail();}
function number(v,min,max){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail();return v;}
function vector(v,n,min,max){if(!Array.isArray(v)||v.length!==n)fail();return Object.freeze(v.map(x=>number(x,min,max)));}
function texture(v){
  keys(v,['index','texCoord']);
  if(!Number.isSafeInteger(v.index)||v.index<0||v.index>65535)fail();
  const texCoord=v.texCoord===undefined?0:v.texCoord;
  if(!Number.isSafeInteger(texCoord)||texCoord<0||texCoord>1)fail();
  return Object.freeze({index:v.index,texCoord});
}
function normalizeMaterial(source,textureCount=0){
  if(!Number.isSafeInteger(textureCount)||textureCount<0||textureCount>65536)fail();
  keys(source,['name','pbrMetallicRoughness','normalTexture','occlusionTexture','emissiveTexture','emissiveFactor','alphaMode','alphaCutoff','doubleSided']);
  if(source.name!==undefined&&(typeof source.name!=='string'||source.name.length>128||/[\u0000-\u001f]/.test(source.name)))fail();
  const p=source.pbrMetallicRoughness===undefined?{}:source.pbrMetallicRoughness;
  keys(p,['baseColorFactor','metallicFactor','roughnessFactor','baseColorTexture','metallicRoughnessTexture']);
  const used=[];
  function slot(v){if(v===undefined)return null;const t=texture(v);if(t.index>=textureCount)fail();used.push(t.index);return t;}
  const baseColorTexture=slot(p.baseColorTexture);
  const metallicRoughnessTexture=slot(p.metallicRoughnessTexture);
  const normalTexture=slot(source.normalTexture);
  const occlusionTexture=slot(source.occlusionTexture);
  const emissiveTexture=slot(source.emissiveTexture);
  const alphaMode=source.alphaMode===undefined?'OPAQUE':source.alphaMode;
  if(!['OPAQUE','MASK','BLEND'].includes(alphaMode))fail();
  const alphaCutoff=source.alphaCutoff===undefined?0.5:number(source.alphaCutoff,0,1);
  if(source.doubleSided!==undefined&&typeof source.doubleSided!=='boolean')fail();
  return Object.freeze({
    name:source.name===undefined?'':source.name,
    baseColorFactor:vector(p.baseColorFactor===undefined?[1,1,1,1]:p.baseColorFactor,4,0,1),
    metallicFactor:number(p.metallicFactor===undefined?1:p.metallicFactor,0,1),
    roughnessFactor:number(p.roughnessFactor===undefined?1:p.roughnessFactor,0,1),
    emissiveFactor:vector(source.emissiveFactor===undefined?[0,0,0]:source.emissiveFactor,3,0,1),
    baseColorTexture,metallicRoughnessTexture,normalTexture,occlusionTexture,emissiveTexture,
    alphaMode,alphaCutoff,doubleSided:source.doubleSided===true,
    referencedTextureIndices:Object.freeze([...new Set(used)].sort((a,b)=>a-b))
  });
}
return Object.freeze({normalizeMaterial});
});
