/* File-backed, on-demand 3D world cell loader. No network or project writes.
 * Selected local File objects are retained as handles; only active cells'
 * bytes are read, validated and kept in a bounded LRU cache. */
(function(root,factory){
const api=factory(typeof module!=='undefined'&&module.exports?require('./large-world-core.js'):root.SDLargeWorld);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDWorldStream=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(World){
'use strict';
if(!World)throw Error('World-core fehlt.');
const FORMAT='sd-game-chunks',VERSION=1,MAX_MANIFEST=120000,MAX_CELL_BYTES=120000;
const validInt=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const name=(cx,cz)=>'chunk-'+cx+'-'+cz+'.json';
const id=(cx,cz)=>cx+':'+cz;
function fail(msg){throw Error('Weltstreaming: '+msg);}
function manifestFromWorld(world){
const w=World.validate(world);
return {format:FORMAT,version:VERSION,name:w.name,worldSize:w.size,cellSize:w.cellSize,seed:w.seed,
spawn:{...w.spawn},cells:w.cells.map(c=>({cx:c.cx,cz:c.cz,ground:c.ground,count:c.objects.length,
file:name(c.cx,c.cz),bytes:0,sha256:'0'.repeat(64)}))};
}
function parseManifest(input){
let data=input;
if(typeof input==='string'){
if(input.length>MAX_MANIFEST)fail('Manifest zu groß.');
try{data=JSON.parse(input);}catch(_){fail('Manifest ist kein gültiges JSON.');}
}
if(!data||typeof data!=='object'||Array.isArray(data)||data.format!==FORMAT||data.version!==VERSION||
typeof data.name!=='string'||!data.name.trim()||data.name.length>80||
data.worldSize!==World.GRID*World.CHUNK||data.cellSize!==World.CHUNK||
!validInt(data.seed,1,2147483647)||!data.spawn||
typeof data.spawn.x!=='number'||!Number.isFinite(data.spawn.x)||Math.abs(data.spawn.x)>World.HALF||
typeof data.spawn.z!=='number'||!Number.isFinite(data.spawn.z)||Math.abs(data.spawn.z)>World.HALF||
!Array.isArray(data.cells)||data.cells.length>World.GRID*World.GRID)fail('Ungültiges Weltmanifest.');
const seen=new Set(),cells=[];
let total=0;
for(const c of data.cells){
if(!c||!validInt(c.cx,0,World.GRID-1)||!validInt(c.cz,0,World.GRID-1)||
!World.GROUNDS.includes(c.ground)||!validInt(c.count,0,World.MAX_PER_CELL)||
c.file!==name(c.cx,c.cz)||!validInt(c.bytes,16,MAX_CELL_BYTES)||
typeof c.sha256!=='string'||!/^[0-9a-f]{64}$/.test(c.sha256))fail('Ungültiger Zellenverweis.');
const k=id(c.cx,c.cz);
if(seen.has(k))fail('Doppelte Zelle.');
seen.add(k);total+=c.count;
if(total>World.MAX_OBJECTS)fail('Weltlimit überschritten.');
cells.push({cx:c.cx,cz:c.cz,ground:c.ground,count:c.count,file:c.file,bytes:c.bytes,sha256:c.sha256});
}
return{format:FORMAT,version:VERSION,name:data.name,worldSize:data.worldSize,cellSize:data.cellSize,seed:data.seed,
spawn:{x:data.spawn.x,z:data.spawn.z},cells,totalObjects:total};
}
function toHex(buffer){return Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');}
async function digest(bytes){
const subtle=typeof crypto!=='undefined'&&crypto.subtle?crypto.subtle:
typeof require==='function'?require('node:crypto').webcrypto.subtle:null;
if(!subtle)fail('SHA-256 wird in diesem Browser nicht unterstützt.');
return toHex(await subtle.digest('SHA-256',bytes));
}
function createLoader(manifest,files,{capacity=12,concurrency=3,onChange=null}={}){
const m=parseManifest(manifest);
if(!(files instanceof Map)||!validInt(capacity,9,36)||!validInt(concurrency,1,4))fail('Ungültige Cache-Konfiguration.');
const refs=new Map();
for(const c of m.cells){
const f=files.get(c.file);
if(!f||typeof f.arrayBuffer!=='function'||f.size!==c.bytes)fail('Zellendatei fehlt oder hat die falsche Größe: '+c.file);
refs.set(id(c.cx,c.cz),c);
}
const cache=new Map(),busy=new Set(),errors=new Map();
let desired=new Set(),center=null,revision=0,disposed=false,access=0;
const changed=()=>{if(typeof onChange==='function')onChange(snapshot());};
function snapshot(){
const cells=[];
for(const k of desired){const c=cache.get(k);if(c)cells.push(c.cell);}
return{center, cells,objects:cells.flatMap(c=>c.objects),activeCells:cells.length,
activeObjects:cells.reduce((n,c)=>n+c.objects.length,0),totalObjects:m.totalObjects,
loadedCells:cache.size,pendingCells:[...desired].filter(k=>!cache.has(k)&&!errors.has(k)).length,
failedCells:[...desired].filter(k=>errors.has(k)).length,loadingCells:busy.size,
lastError:errors.size?[...errors.values()].at(-1):null};
}
function prune(){
for(const k of cache.keys())if(!desired.has(k))cache.delete(k);
while(cache.size>capacity){const k=cache.keys().next().value;cache.delete(k);}
}
async function read(c,jobRevision){
const k=id(c.cx,c.cz);
try{
const file=files.get(c.file),buffer=await file.arrayBuffer();
if(buffer.byteLength!==c.bytes)fail('Länge verändert: '+c.file);
if(await digest(buffer)!==c.sha256)fail('Prüfsumme falsch: '+c.file);
const bytes=new Uint8Array(buffer);
const source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
let cell;
try{cell=JSON.parse(source);}catch(_){fail('Ungültiges Zellen-JSON: '+c.file);}
const single=World.validate({version:World.VERSION,name:m.name,size:m.worldSize,cellSize:m.cellSize,seed:m.seed,spawn:m.spawn,cells:[cell]});
const validated=single.cells[0];
if(validated.cx!==c.cx||validated.cz!==c.cz||validated.ground!==c.ground||
validated.objects.length!==c.count)fail('Zellendaten passen nicht zum Manifest: '+c.file);
if(!disposed&&desired.has(k)){
cache.delete(k);cache.set(k,{cell:validated,access:++access});errors.delete(k);prune();
}
}catch(err){
if(!disposed&&desired.has(k))errors.set(k,err?.message||'Zelle konnte nicht geladen werden.');
}finally{
busy.delete(k);
if(!disposed){changed();pump();}
}
}
function pump(){
if(disposed)return;
for(const k of desired){
if(busy.size>=concurrency)break;
if(cache.has(k)||busy.has(k)||errors.has(k))continue;
const c=refs.get(k);
if(!c)continue;
busy.add(k);
void read(c,revision);
}
}
function update(x,z,radius=1){
if(disposed)fail('Loader ist geschlossen.');
if(!validInt(radius,0,1))fail('Radius außerhalb des getesteten Streaming-Budgets.');
const at=World.cellAt(x,z),target=new Set();
const sorted=m.cells.filter(c=>Math.abs(c.cx-at.cx)<=radius&&Math.abs(c.cz-at.cz)<=radius)
.sort((a,b)=>((a.cx-at.cx)**2+(a.cz-at.cz)**2)-((b.cx-at.cx)**2+(b.cz-at.cz)**2));
for(const c of sorted)target.add(id(c.cx,c.cz));
const different=center?.cx!==at.cx||center?.cz!==at.cz||target.size!==desired.size;
if(different){
center=at;desired=target;revision++;errors.clear();prune();pump();changed();
}
return snapshot();
}
function dispose(){disposed=true;desired.clear();cache.clear();busy.clear();errors.clear();files.clear();}
return Object.freeze({manifest:m,update,snapshot,dispose,
get cachedCells(){return cache.size;},get disposed(){return disposed;}});
}
return Object.freeze({FORMAT,VERSION,MAX_MANIFEST,MAX_CELL_BYTES,name,digest,manifestFromWorld,parseManifest,createLoader});
});
