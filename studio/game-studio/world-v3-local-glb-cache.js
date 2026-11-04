/* World-v3 opt-in local GLB lazy cache. No URLs, persistence or scene mutations. */
(function(root,factory){
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root&&root.document)root.SDLocalGLBLazyCache=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_FILE=100*1024*1024;
function fail(){throw Error('Invalid local GLB asset.');}
function validRef(ref){
if(!ref||typeof ref!=='object'||Array.isArray(ref)||Object.keys(ref).some(k=>!['name','sha256','size'].includes(k)))fail();
if(typeof ref.name!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}\.glb$/i.test(ref.name)||ref.name==='..glb')fail();
if(typeof ref.sha256!=='string'||!/^[a-f0-9]{64}$/.test(ref.sha256)||!Number.isSafeInteger(ref.size)||ref.size<20||ref.size>MAX_FILE)fail();
return ref;
}
function hex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
function checkGLB(data){
if(!(data instanceof ArrayBuffer)||data.byteLength<20||data.byteLength>MAX_FILE)fail();
const v=new DataView(data);
if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==data.byteLength)fail();
let offset=12,first=true;
while(offset<data.byteLength){
if(offset+8>data.byteLength)fail();
const length=v.getUint32(offset,true),type=v.getUint32(offset+4,true);offset+=8;
if(length%4||offset+length>data.byteLength)fail();
if(first&&(type!==0x4e4f534a||length===0))fail();
if(!first&&type!==0x004e4942)fail();
offset+=length;first=false;
}
if(offset!==data.byteLength)fail();
}
function createCache({maxBytes=128*1024*1024,cryptoProvider=globalThis.crypto}={}){
if(!Number.isSafeInteger(maxBytes)||maxBytes<20||maxBytes>512*1024*1024||!cryptoProvider||!cryptoProvider.subtle)fail();
const entries=new Map(),pending=new Map();let bytes=0,generation=0;
function evict(needed){
while(bytes+needed>maxBytes&&entries.size){
const key=entries.keys().next().value,old=entries.get(key);
entries.delete(key);bytes-=old.byteLength;
}
}
async function load(ref,file){
validRef(ref);
if(!file||typeof file.arrayBuffer!=='function'||file.name!==ref.name||file.size!==ref.size||ref.size>maxBytes)fail();
const key=ref.sha256+':'+ref.size;
if(entries.has(key)){const data=entries.get(key);entries.delete(key);entries.set(key,data);return data.slice(0);}
if(pending.has(key))return (await pending.get(key)).slice(0);
const epoch=generation;
const task=(async()=>{
const data=await file.arrayBuffer();
if(!(data instanceof ArrayBuffer)||data.byteLength!==ref.size)fail();
checkGLB(data);
const digest=hex(new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',data)));
if(digest!==ref.sha256)fail();
if(epoch===generation){evict(data.byteLength);entries.set(key,data.slice(0));bytes+=data.byteLength;}
return data;
})();
pending.set(key,task);
try{return (await task).slice(0);}finally{if(pending.get(key)===task)pending.delete(key);}
}
function clear(){generation++;entries.clear();pending.clear();bytes=0;}
function stats(){return Object.freeze({entries:entries.size,bytes,pending:pending.size});}
return Object.freeze({load,clear,stats});
}
return Object.freeze({createCache,validRef,checkGLB,MAX_FILE});
});