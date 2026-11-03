'use strict';
/* Offline v3 → verified chunk folder packer. Never overwrites an existing folder.
 * Usage: node studio/game-studio/tools/pack-world.cjs world-v3.json empty-output-folder */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const World=require('../large-world-core.js');
const Stream=require('../large-world-stream.js');
function buildPackage(input){
const world=World.validate(input),manifest=Stream.manifestFromWorld(world),files=new Map();
for(let i=0;i<world.cells.length;i++){
const cell=world.cells[i];
const name=Stream.name(cell.cx,cell.cz),bytes=Buffer.from(JSON.stringify(cell)+'\n','utf8');
if(bytes.length>Stream.MAX_CELL_BYTES)throw Error('Zellendatei zu groß: '+name);
files.set(name,bytes);
manifest.cells[i].bytes=bytes.length;
manifest.cells[i].sha256=crypto.createHash('sha256').update(bytes).digest('hex');
}
delete manifest.totalObjects;
const json=JSON.stringify(manifest,null,2)+'\n';
if(Buffer.byteLength(json)>Stream.MAX_MANIFEST)throw Error('Manifest zu groß.');
Stream.parseManifest(json);
return{manifest:json,files};
}
function writePackage(worldFile,directory){
const stat=fs.statSync(worldFile);
if(!stat.isFile()||stat.size>World.MAX_FILE)throw Error('Ungültige oder zu große v3-Weltdatei.');
const world=World.parse(fs.readFileSync(worldFile,'utf8'));
const pack=buildPackage(world);
fs.mkdirSync(directory); // Exclusively new directory; never overwrite user data.
for(const [name,bytes] of pack.files)fs.writeFileSync(path.join(directory,name),bytes,{flag:'wx'});
fs.writeFileSync(path.join(directory,'manifest.json'),pack.manifest,{flag:'wx'});
return{files:pack.files.size,objects:World.total(world),directory};
}
module.exports={buildPackage,writePackage};
if(require.main===module){
const args=process.argv.slice(2);
if(args.length!==2){console.error('Aufruf: node pack-world.cjs eingabe-v3.json NEUER-zielordner');process.exitCode=2;}
else{
try{const stats=writePackage(args[0],args[1]);console.log('Gesichert:',stats.files,'Zellen,',stats.objects,'Objekte in',stats.directory);}
catch(err){console.error('Großwelt-Export abgebrochen:',err.message);process.exitCode=1;}
}
}
