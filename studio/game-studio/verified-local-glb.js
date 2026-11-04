/* SD Game-Studio: explicit local GLB integrity verification; no fetch or persistent writes. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root&&root.document)root.SDVerifiedGLB=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_BYTES=100*1024*1024, MAGIC=0x46546c67, JSON_CHUNK=0x4e4f534a, BIN_CHUNK=0x004e4942;
function reject(){throw Error('Invalid local GLB asset.');}
function inspect(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20||buffer.byteLength>MAX_BYTES)reject();
 const view=new DataView(buffer), length=buffer.byteLength;
 if(view.getUint32(0,true)!==MAGIC||view.getUint32(4,true)!==2||view.getUint32(8,true)!==length)reject();
 let offset=12, count=0;
 while(offset<length){
  if(length-offset<8)reject();
  const bytes=view.getUint32(offset,true),kind=view.getUint32(offset+4,true);
  offset+=8;
  if(bytes===0||bytes%4!==0||bytes>length-offset)reject();
  if(count===0&&kind!==JSON_CHUNK)reject();
  if(count===1&&kind!==BIN_CHUNK)reject();
  if(count>=2)reject();
  if(count===0){
   const jsonBytes=new Uint8Array(buffer,offset,bytes);
   let json;
   try{
    const decoded=new TextDecoder('utf-8',{fatal:true}).decode(jsonBytes).replace(/ +$/,'');
    json=JSON.parse(decoded);
   }catch(_){reject();}
   if(!json||typeof json!=='object'||Array.isArray(json)||!json.asset||json.asset.version!=='2.0')reject();
  }
  offset+=bytes;count++;
 }
 if(offset!==length||count<1)reject();
 return Object.freeze({bytes:length,chunks:count});
}
async function verify(file,expected){
 if(!file||typeof file.arrayBuffer!=='function'||!Number.isSafeInteger(file.size)||
 file.size<20||file.size>MAX_BYTES||!expected||typeof expected!=='object'||
 !Number.isSafeInteger(expected.bytes)||expected.bytes!==file.size||
 typeof expected.sha256!=='string'||!/^[a-f0-9]{64}$/.test(expected.sha256))reject();
 const buffer=await file.arrayBuffer();
 if(buffer.byteLength!==file.size)reject();
 const structure=inspect(buffer);
 const cryptoApi=globalThis.crypto;
 if(!cryptoApi||!cryptoApi.subtle||typeof cryptoApi.subtle.digest!=='function')reject();
 const digest=new Uint8Array(await cryptoApi.subtle.digest('SHA-256',buffer));
 const hex=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
 if(hex!==expected.sha256)reject();
 return Object.freeze({buffer,bytes:structure.bytes,sha256:hex});
}
return Object.freeze({MAX_BYTES,inspect,verify});
});
