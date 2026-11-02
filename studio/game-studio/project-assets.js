/* Versioned game-scene projects with embedded, validated GLB geometry.
 * The legacy v1 JSON stays byte-compatible; v2 introduces reusable model assets.
 * No persistence, external URLs or network calls. */
(function(root,factory){
const api=factory(typeof module!=='undefined'&&module.exports?
require('./scene-core.js'):root.SDGameCore,
typeof module!=='undefined'&&module.exports?
require('./glb-core.js'):root.SDGLB);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDGameProject=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,GLB){
'use strict';
if(!Core||!GLB)throw Error('Game-Studio Projektmodule fehlen.');
const PROJECT_VERSION=2,MAX_ASSETS=4,MAX_BYTES=8*1024*1024,MAX_CHARS=12_000_000;
const ID=/^asset-[1-9][0-9]{0,7}$/,BASE64=/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
function fail(message){throw Error('Projektformat: '+message);}
function encode(bytes){
if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);
if(bytes.byteLength<20||bytes.byteLength>MAX_BYTES)fail('Modell muss zwischen 20 Byte und 8 MiB groß sein.');
if(typeof Buffer!=='undefined')return Buffer.from(bytes).toString('base64');
let str='';
for(let i=0;i<bytes.length;i+=16384)str+=String.fromCharCode(...bytes.subarray(i,i+16384));
return btoa(str);
}
function decode(text){
if(typeof text!=='string'||text.length<28||text.length%4!==0||text.length>Math.ceil(MAX_BYTES/3)*4+4||!BASE64.test(text))
fail('Ungültige oder zu große GLB-Daten.');
if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(text,'base64'));
const raw=atob(text),out=new Uint8Array(raw.length);
for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
return out;
}
function cleanName(text){
if(typeof text!=='string')fail('Ungültiger Modellname.');
const cleaned=text.replace(/[\/\\]/g,'_').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,80);
if(!cleaned)fail('Modell benötigt einen Namen.');
return cleaned;
}
function validate(input){
if(input?.version===1)return Core.validate(input);
if(!input||input.version!==PROJECT_VERSION||!Array.isArray(input.objects)||!Array.isArray(input.assets)||
input.objects.length>Core.LIMIT||input.assets.length>MAX_ASSETS)fail('Ungültiges v2-Projekt oder Projektlimit erreicht.');
const sanitized=Core.validate({...input,version:1,objects:input.objects.filter(o=>o?.type!=='model')});
const assets=[],seenAssets=new Set();
let encodedChars=0;
for(const a of input.assets){
if(!a||typeof a!=='object'||!ID.test(a.id)||seenAssets.has(a.id)||
typeof a.name!=='string'||a.name!==cleanName(a.name)||!a.name||
typeof a.base64!=='string')fail('Ungültige oder doppelte Asset-ID.');
seenAssets.add(a.id);
encodedChars+=a.base64.length;
if(encodedChars>Math.ceil(MAX_BYTES/3)*4+4)fail('Asset-Budget von 8 MiB überschritten.');
const byteLength=decode(a.base64).length;
if(byteLength<20||byteLength>MAX_BYTES)fail('Asset-Größe ungültig.');
assets.push({id:a.id,name:a.name,base64:a.base64});
}
const previous=new Map(sanitized.objects.map(o=>[o.id,o]));
const ids=new Set(),objects=[];
for(const obj of input.objects){
if(!obj||!Number.isSafeInteger(obj.id)||obj.id<1||obj.id>10000000||ids.has(obj.id))
fail('Ungültige oder doppelte Objekt-ID.');
ids.add(obj.id);
if(obj.type==='model'){
if(!seenAssets.has(obj.assetId)||!finite(obj.x,-Core.WORLD,Core.WORLD)||
!finite(obj.z,-Core.WORLD,Core.WORLD)||!finite(obj.scale,.4,3)||
!Core.PALETTE.includes(obj.color))fail('Ungültige Modellinstanz oder fehlendes Asset.');
objects.push({id:obj.id,type:'model',x:obj.x,z:obj.z,scale:obj.scale,color:obj.color,assetId:obj.assetId});
}else{
if(!previous.has(obj.id))fail('Ungültiger Szenenobjekttyp.');
objects.push(previous.get(obj.id));
}
}
return{...sanitized,version:PROJECT_VERSION,objects,assets};
}
function inspectAssets(project){
const p=validate(project);
if(p.version===PROJECT_VERSION)for(const asset of p.assets)GLB.parse(decode(asset.base64));
return p;
}
function parse(source){
if(typeof source!=='string'||source.length>MAX_CHARS)fail('Projektdatei zu groß.');
let data;
try{data=JSON.parse(source);}catch(_){fail('Ungültige JSON-Projektdatei.');}
if(data?.version===1)return Core.parse(source);
return inspectAssets(data);
}
function serialize(scene){
if(scene.version===1)return Core.serialize(scene);
const value=JSON.stringify(validate(scene),null,2)+'\n';
if(value.length>MAX_CHARS)fail('Projektdatei ist zu groß.');
return value;
}
function addModel(scene,bytes,name,x=0,z=0){
if(!finite(x,-Core.WORLD,Core.WORLD)||!finite(z,-Core.WORLD,Core.WORLD))
fail('Ungültiger Platzierungsort.');
const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
GLB.parse(data);
const encoded=encode(data),label=cleanName(name);
const original=validate(scene);
if(original.objects.length>=Core.LIMIT)fail('Maximal 70 Szenenobjekte erlaubt.');
const next=original.version===1?{...original,version:PROJECT_VERSION,assets:[]}:original;
let asset=next.assets.find(a=>a.base64===encoded);
if(!asset){
if(next.assets.length>=MAX_ASSETS)fail('Maximal vier verschiedene GLB-Assets.');
const total=next.assets.reduce((n,a)=>n+decode(a.base64).length,0)+data.byteLength;
if(total>MAX_BYTES)fail('Projekt-Asset-Budget (8 MiB) überschritten.');
const used=new Set(next.assets.map(a=>a.id));
let i=1;while(used.has('asset-'+i))i++;
asset={id:'asset-'+i,name:label,base64:encoded};
next.assets.push(asset);
}
const nextId=Math.max(0,...next.objects.map(o=>o.id))+1;
if(nextId>10000000)fail('Objekt-ID-Grenze erreicht.');
const obj={id:nextId,type:'model',x,z,scale:1,color:Core.PALETTE[(nextId-1)%Core.PALETTE.length],assetId:asset.id};
next.objects.push(obj);
const normalized=validate(next),text=serialize(normalized);
if(text.length>MAX_CHARS)fail('Projektdatei wäre zu groß.');
Object.assign(scene,normalized);
return obj;
}
function duplicate(scene,id){
const original=scene.objects.find(o=>o.id===id);
if(!original)throw Error('Objekt nicht gefunden.');
if(original.type!=='model')return Core.duplicate(scene,id);
const normalized=validate(scene);
if(normalized.objects.length>=Core.LIMIT)fail('Maximal 70 Szenenobjekte erlaubt.');
const nextId=Math.max(...normalized.objects.map(o=>o.id))+1;
if(nextId>10000000)fail('Objekt-ID-Grenze erreicht.');
const copy={...original,id:nextId,x:Math.min(Core.WORLD,original.x+1.5),z:Math.min(Core.WORLD,original.z+1.5)};
normalized.objects.push(copy);
scene.objects=normalized.objects;
return copy;
}
function history(initial,capacity=40){
if(!Number.isSafeInteger(capacity)||capacity<2||capacity>100)throw Error('Ungültige Verlaufslänge.');
let pool=[],states=[],index=0;
function pack(next){
const data=validate(next);
if(data.version!==PROJECT_VERSION)return JSON.stringify(data);
const references=data.assets.map(a=>{
let token=pool.findIndex(old=>old.id===a.id&&old.name===a.name&&old.base64===a.base64);
if(token<0){token=pool.length;pool.push(a);}
return{id:a.id,name:a.name,token};
});
return JSON.stringify({...data,assets:references});
}
function unpack(raw){
const data=JSON.parse(raw);
if(data.version===PROJECT_VERSION)data.assets=data.assets.map(a=>{
const asset=pool[a.token];
if(!asset||asset.id!==a.id||asset.name!==a.name)fail('Asset aus Verlauf fehlt.');
return asset;
});
return validate(data);
}
/* Drop GLB copies that no longer belong to any retained undo/redo state.
 * Reindex snapshot tokens together so every remaining history entry stays valid. */
function compact(){
const live=new Set();
for(const raw of states){
const item=JSON.parse(raw);
if(item.version===PROJECT_VERSION)for(const asset of item.assets)live.add(asset.token);
}
if(live.size===pool.length)return;
const remap=new Map(),keep=[];
for(let i=0;i<pool.length;i++)if(live.has(i)){
remap.set(i,keep.length);keep.push(pool[i]);
}
states=states.map(raw=>{
const item=JSON.parse(raw);
if(item.version!==PROJECT_VERSION)return raw;
for(const asset of item.assets){
if(!remap.has(asset.token))fail('Asset aus Verlauf fehlt.');
asset.token=remap.get(asset.token);
}
return JSON.stringify(item);
});
pool=keep;
}
function record(next){
const state=pack(next);
if(state===states[index])return false;
states=states.slice(0,index+1);
states.push(state);
if(states.length>capacity)states.shift();
index=states.length-1;
compact();
return true;
}
function reset(next){pool=[];states=[pack(next)];index=0;}
reset(initial);
return Object.freeze({
record,
undo(){return index>0?unpack(states[--index]):null;},
redo(){return index<states.length-1?unpack(states[++index]):null;},
reset,
get canUndo(){return index>0;},
get canRedo(){return index<states.length-1;},
get retainedAssetVersions(){return pool.length;},
get retainedSnapshots(){return states.length;}
});
}
return Object.freeze({PROJECT_VERSION,MAX_ASSETS,MAX_BYTES,MAX_CHARS,validate,parse,serialize,addModel,duplicate,history,decode,encode});
});
