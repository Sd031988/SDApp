'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../../studio/game-studio/scene-core.js');
const Project = require('../../studio/game-studio/project-assets.js');
const Exporter = require('../../studio/game-studio/godot-export-core.js');
const {makeGLB} = require('./glb-fixture.cjs');

function unzipStored(bytes) {
  const data=Buffer.from(bytes),files=new Map();
  let at=0;
  while(at+4<=data.length&&data.readUInt32LE(at)===0x04034b50){
    const method=data.readUInt16LE(at+8),crc=data.readUInt32LE(at+14),length=data.readUInt32LE(at+18);
    const nameLength=data.readUInt16LE(at+26),extraLength=data.readUInt16LE(at+28);
    const name=data.subarray(at+30,at+30+nameLength).toString('utf8');
    const start=at+30+nameLength+extraLength,end=start+length;
    assert.equal(method,0,'ZIP muss unkomprimierte lokale Dateien enthalten');
    assert(end<=data.length,'ZIP darf nicht abgeschnitten sein');
    const content=data.subarray(start,end);
    assert.equal(Exporter.crc32(content),crc,'ZIP CRC32 für '+name);
    assert(!files.has(name));files.set(name,content);
    at=end;
  }
  assert.equal(data.readUInt32LE(at),0x02014b50,'Zentralverzeichnis vorhanden');
  assert.equal(data.readUInt32LE(data.length-22),0x06054b50,'End of central directory');
  assert.equal(data.readUInt16LE(data.length-12),files.size);
  return files;
}

test('v1 scene to Godot 4 project: correct files and terrain data',()=>{
  const scene=Core.fresh();Core.sculpt(scene,'raise',0,0,3.5,.5);
  const result=Exporter.build(scene),files=unzipStored(result.bytes);
  assert.deepEqual([...files.keys()],['project.godot','main.tscn','world.gd','player.gd','world.json','README.txt']);
  assert.match(files.get('project.godot').toString(),/run\/main_scene="res:\/\/main.tscn"/);
  assert.match(files.get('main.tscn').toString(),/type="Node3D"/);
  assert.match(files.get('world.gd').toString(),/create_trimesh_shape/);
  assert.match(files.get('player.gd').toString(),/move_and_slide/);
  const data=JSON.parse(files.get('world.json').toString());
  assert.equal(data.terrain.length,Core.GRID*Core.GRID);
  assert(data.terrain.some(n=>n>0));
  assert.equal(data.objects.length,scene.objects.length);
  assert.equal(result.models,0);
});

test('v2 models are packaged as verified GLB assets without raw base64 in world JSON',()=>{
 const scene=Core.fresh(),asset=makeGLB();
 Project.addModel(scene,asset,'My Character.glb',2,3);
 const result=Exporter.build(scene),files=unzipStored(result.bytes);
 assert.equal(result.models,1);
 assert.equal(result.objects,7);
 assert.deepEqual(files.get('assets/asset-1.glb'),asset);
 assert(!files.get('world.json').toString().includes(asset.toString('base64')));
 assert.match(files.get('world.json').toString(),/"assetId": "asset-1"/);
});

test('reject invalid scenes, v3 and oversized input; never trust asset names as paths',()=>{
 assert.throws(()=>Exporter.parseAndBuild('{bad json'),/Projektformat|ungültig|JSON/i);
 assert.throws(()=>Exporter.build({version:3,cells:[]}),/Projektformat/);
 assert.throws(()=>Exporter.parseAndBuild(' '.repeat(12000001)),/groß/);
 assert.throws(()=>Exporter.zip([{name:'../escape',content:'bad'}]),/Dateiname/);
 assert.throws(()=>Exporter.zip([{name:'duplicate.txt',content:'a'},{name:'duplicate.txt',content:'b'}]),/Dateiname/);
 const scene=Core.fresh();
 scene.objects[0].x=9999;
 assert.throws(()=>Exporter.build(scene),/Ungültiges/);
});

test('isolated exporter is accessible from its own page and does not change existing editor',()=>{
 const root=path.join(__dirname,'../../studio/game-studio');
 const html=fs.readFileSync(path.join(root,'godot-export.html'),'utf8');
 const ui=fs.readFileSync(path.join(root,'godot-export-ui.js'),'utf8');
 const editor=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(editor,/href="\.\/godot-export\.html"/);
 assert.match(html,/godot-export-core\.js/);
 assert.match(html,/id="download"/);
 assert.match(ui,/Project\.parse/);
 assert.doesNotMatch(ui,/localStorage|indexedDB|fetch\(/);
 assert.doesNotMatch(html,/<script[^>]+src=["']https?:/i);
});
