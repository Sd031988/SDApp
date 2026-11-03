'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const World=require('../../studio/game-studio/large-world-core.js');
const Stream=require('../../studio/game-studio/large-world-stream.js');
const Pack=require('../../studio/game-studio/tools/pack-world.cjs');
function file(bytes,onRead){
return{size:bytes.byteLength,async arrayBuffer(){if(onRead)await onRead();return Uint8Array.from(bytes).buffer;}};
}
async function settled(loader,min=1){
for(let i=0;i<300;i++){
const s=loader.snapshot();
if(s.loadingCells===0&&s.pendingCells===0&&s.activeCells>=min)return s;
await new Promise(resolve=>setTimeout(resolve,4));
}
throw Error('Streaming: Zeitgrenze bei Zell-Ladeprüfung');
}
test('v3-Dateipaket ist deterministisch und enthält 256 einzeln prüfbare Dateien',()=>{
const world=World.generate(43,8),original=World.serialize(world),a=Pack.buildPackage(world),b=Pack.buildPackage(world);
assert.equal(a.files.size,256);
assert.deepEqual(a.manifest,b.manifest);
assert.deepEqual([...a.files],[...b.files]);
const m=Stream.parseManifest(a.manifest);
assert.equal(m.totalObjects,2048);
assert.equal(m.cells.length,256);
for(const c of m.cells){
const bytes=a.files.get(c.file);
assert.equal(bytes.length,c.bytes);
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),c.sha256);
}
assert.equal(World.serialize(world),original);
});
test('Echte File-Lesungen erfolgen nur im aktiven Zellbereich; LRU entlädt verlassene Zellen',async()=>{
const pack=Pack.buildPackage(World.generate(31,8)),reads=new Set(),files=new Map();
for(const [name,bytes] of pack.files)files.set(name,file(bytes,()=>reads.add(name)));
const loader=Stream.createLoader(pack.manifest,files,{capacity:12,concurrency:3});
const first=loader.update(0,0);
assert.equal(first.activeCells,0,'Vor I/O sind keine Zellen im Arbeitsspeicher.');
const a=await settled(loader,9);
assert.equal(a.activeCells,9);
assert.equal(a.activeObjects,72);
assert.equal(a.totalObjects,2048);
assert.equal(loader.cachedCells,9);
assert.equal(reads.size,9);
assert(a.activeCells<256);
loader.update(170,170);
const b=await settled(loader,9);
assert.equal(b.activeCells,9);
assert.equal(b.activeObjects,72);
assert.equal(reads.size,18,'Nur neun neue Dateien dürfen nachgelesen werden.');
assert.equal(loader.cachedCells,9,'Verlassene Zellen sind aus dem Arbeitsspeicher entfernt.');
assert(b.cells.every(c=>c.cx>=11&&c.cz>=11));
loader.update(0,0);
await settled(loader,9);
assert.equal(reads.size,27,'Entladene Zellen werden bei Rückkehr erneut aus Dateien gelesen.');
loader.dispose();
assert.equal(loader.cachedCells,0);
assert.equal(loader.disposed,true);
});
test('Manipulierte oder beschädigte Dateizellen werden ohne fremde Inhalte zurückgewiesen',async()=>{
const pack=Pack.buildPackage(World.generate(38,1)),files=new Map();
for(const [name,bytes] of pack.files)files.set(name,file(bytes));
const corrupt='chunk-8-8.json',raw=Buffer.from(pack.files.get(corrupt));
raw[raw.length-5]^=1;
files.set(corrupt,file(raw));
const loader=Stream.createLoader(pack.manifest,files);
loader.update(0,0);
for(let i=0;i<300;i++){
const s=loader.snapshot();
if(s.loadingCells===0&&s.failedCells>0){
assert.equal(s.failedCells,1);
assert.equal(s.activeCells,8);
assert.match(s.lastError,/Prüfsumme/);
break;
}
await new Promise(resolve=>setTimeout(resolve,4));
if(i===299)throw Error('Fehlende Prüfsummenprüfung');
}
assert(loader.snapshot().objects.every(x=>x.id!==pack.files.get(corrupt)?.id));
loader.dispose();
});
test('Zellwechsel während eines ausstehenden Ladevorgangs verwirft alte Ergebnisse',async()=>{
const pack=Pack.buildPackage(World.generate(40,2)),waiting=[],files=new Map();
for(const [name,bytes] of pack.files){
const delayed=name.startsWith('chunk-8-')||name.startsWith('chunk-7-');
files.set(name,file(bytes,()=>delayed?new Promise(resolve=>waiting.push(resolve)):undefined));
}
const loader=Stream.createLoader(pack.manifest,files,{concurrency:2});
loader.update(0,0);
assert.equal(loader.snapshot().loadingCells,2);
loader.update(170,170);
for(const resume of waiting)resume();
const done=await settled(loader,9);
assert.equal(done.activeCells,9);
assert.equal(done.activeObjects,18);
assert(done.cells.every(c=>c.cx>=11&&c.cz>=11),'Verspätete Dateien dürfen nicht wieder in den aktiven Cache.');
assert.equal(loader.cachedCells,9);
loader.dispose();
});
test('Ungültige Manifestpfade, Zellen und unvollständige Dateisätze werden abgelehnt',()=>{
const pack=Pack.buildPackage(World.generate(31,0)),manifest=JSON.parse(pack.manifest);
const hostile=[
m=>{m.cells[0].file='../private.json';},
m=>{m.cells[0].file='https://example.org/a';},
m=>{m.cells[0].sha256='0'.repeat(63);},
m=>{m.cells[0].cx=-1;},
m=>{m.cells[0].count=65;},
m=>{m.cells.push(m.cells[0]);},
m=>{m.worldSize=40;},
m=>{m.format='glb-zip';}
];
for(const change of hostile){
const m=JSON.parse(pack.manifest);change(m);
assert.throws(()=>Stream.parseManifest(JSON.stringify(m)),/Weltstreaming:/);
}
const files=new Map([...pack.files].map(([name,bytes])=>[name,file(bytes)]));
files.delete(manifest.cells[0].file);
assert.throws(()=>Stream.createLoader(manifest,files),/fehlt/);
assert.throws(()=>Stream.parseManifest('x'.repeat(Stream.MAX_MANIFEST+1)),/zu groß/);
});
