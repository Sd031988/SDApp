/* Opt-in asynchronous chunk resource scheduler. No network or project writes.
 * Caller owns load/unload functions and must validate assets before loading. */
(function(root,factory){
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDChunkScheduler=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create({load,dispose=()=>{},maxConcurrent=2,maxResident=16}={}){
if(typeof load!=='function'||typeof dispose!=='function')throw TypeError('load and dispose callbacks required');
if(!Number.isSafeInteger(maxConcurrent)||maxConcurrent<1||maxConcurrent>8||
!Number.isSafeInteger(maxResident)||maxResident<1||maxResident>256)throw RangeError('Invalid chunk budget');
const resident=new Map(),pending=new Map(),failed=new Set();
let desired=new Set(),generation=0,closed=false;
function cleanup(key,value){try{dispose(key,value);}catch(_){/* cleanup must not stall scheduling */}}
function trim(){
for(const [key,value] of resident){
if(resident.size<=maxResident)break;
if(!desired.has(key)){resident.delete(key);cleanup(key,value);}
}
}
function setVisible(keys){
if(closed)throw Error('Scheduler closed');
if(!Array.isArray(keys)||keys.length>256||keys.some(k=>typeof k!=='string'||!/^[0-9]{1,2}:[0-9]{1,2}$/.test(k)))throw TypeError('Invalid chunk IDs');
const unique=[...new Set(keys)];
if(unique.length>maxResident)throw RangeError('Visible cells exceed resident budget');
generation++;
desired=new Set(unique);failed.clear();
for(const [key,job] of pending)if(!desired.has(key))job.controller.abort();
for(const [key,value] of resident)if(!desired.has(key)){resident.delete(key);cleanup(key,value);}
pump();
}
function pump(){
if(closed)return;
for(const key of desired){
if(pending.size>=maxConcurrent)break;
if(pending.has(key)||resident.has(key)||failed.has(key))continue;
const controller=new AbortController(),job={controller};
pending.set(key,job);
Promise.resolve().then(()=>load(key,controller.signal)).then(value=>{
if(closed||controller.signal.aborted||!desired.has(key))cleanup(key,value);
else{resident.set(key,value);trim();}
},()=>{if(!closed&&!controller.signal.aborted&&desired.has(key))failed.add(key);}).finally(()=>{
if(pending.get(key)===job)pending.delete(key);
pump();
});
}
}
function close(){
if(closed)return;
closed=true;desired.clear();generation++;
for(const job of pending.values())job.controller.abort();
for(const [key,value] of resident)cleanup(key,value);
resident.clear();
}
return Object.freeze({setVisible,close,get:(key)=>resident.get(key),snapshot:()=>Object.freeze({
resident:[...resident.keys()],pending:[...pending.keys()],desired:[...desired],
failed:[...failed],abortedPending:[...pending].filter(([,job])=>job.controller.signal.aborted).map(([key])=>key),
generation,closed
})});
}
return Object.freeze({create});
});
