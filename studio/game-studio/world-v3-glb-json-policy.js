/* Conservative GLB JSON policy for opt-in local World-v3 assets. No network or project writes. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)root.SDGLBJSONPolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function reject(){throw new Error('Unsupported or unsafe GLB JSON.');}
function validateGLBJSON(buffer){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20||buffer.byteLength>100*1024*1024)reject();
  const view=new DataView(buffer);
  if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)reject();
  const len=view.getUint32(12,true);
  if(len<4||len%4||len>4*1024*1024||20+len>buffer.byteLength||view.getUint32(16,true)!==0x4e4f534a)reject();
  let json;
  try{
    const raw=new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(buffer,20,len)).replace(/[ \t\r\n]+$/g,'');
    json=JSON.parse(raw);
  }catch(_){reject();}
  if(!json||typeof json!=='object'||Array.isArray(json)||!json.asset||json.asset.version!=='2.0')reject();
  const seen=new Set();
  function walk(value,depth){
    if(depth>40)reject();
    if(value&&typeof value==='object'){
      if(seen.has(value))reject();
      seen.add(value);
      if(Array.isArray(value)){if(value.length>100000)reject();for(const child of value)walk(child,depth+1);}
      else {
        const keys=Object.keys(value);
        if(keys.length>10000)reject();
        for(const key of keys){
          if(key==='__proto__'||key==='prototype'||key==='constructor')reject();
          walk(value[key],depth+1);
        }
      }
      seen.delete(value);
    }else if(typeof value==='number'&&!Number.isFinite(value))reject();
  }
  walk(json,0);
  for(const field of ['buffers','images']){
    if(json[field]!==undefined){
      if(!Array.isArray(json[field])||json[field].length>4096)reject();
      for(const entry of json[field]){
        if(!entry||typeof entry!=='object'||Array.isArray(entry)||Object.hasOwn(entry,'uri'))reject();
      }
    }
  }
  if(json.extensionsRequired!==undefined&&(!Array.isArray(json.extensionsRequired)||json.extensionsRequired.length!==0))reject();
  if(json.buffers&&json.buffers.length>1)reject();
  if(json.buffers&&json.buffers.some(b=>!Number.isSafeInteger(b.byteLength)||b.byteLength<0||b.byteLength>100*1024*1024))reject();
  let offset=20+len,binLength=0;
  if(offset<buffer.byteLength){
    if(offset+8>buffer.byteLength)reject();
    binLength=view.getUint32(offset,true);
    if(view.getUint32(offset+4,true)!==0x004e4942||binLength%4||offset+8+binLength!==buffer.byteLength)reject();
  }
  if(json.buffers&&json.buffers.length===1&&json.buffers[0].byteLength>binLength)reject();
  if(json.buffers&&json.buffers.length===0&&binLength)reject();
  return Object.freeze({jsonByteLength:len,binByteLength:binLength,bufferCount:(json.buffers||[]).length,imageCount:(json.images||[]).length});
}
return Object.freeze({validateGLBJSON});
});
