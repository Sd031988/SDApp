'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const glb=require('../../studio/game-studio/glb-core.js');
const {makeGLB}=require('./glb-fixture.cjs');

test('GLB 2.0 importiert indizierte Dreiecke, Knoten und Grundmaterial ohne externe Dateien',()=>{
const model=glb.parse(makeGLB());
assert.equal(model.stats.meshes,1);
assert.equal(model.stats.primitives,1);
assert.equal(model.stats.triangles,1);
assert.equal(model.stats.nodes,1);
assert.deepEqual(model.parts[0].color,[.7,.4,.3]);
assert.deepEqual(Array.from(model.parts[0].vertices.slice(0,3)),[2,1,3]);
assert.deepEqual(model.bounds.center,[2.5,1.5,3]);
assert(Math.abs(model.bounds.radius-Math.SQRT1_2)<1e-7);
assert.deepEqual(model.warnings,['Vorschau zeigt vereinfachte Farben und flache Normalen; keine Animationen.']);
});

test('Knoten-Hierarchie, gemeinsame Meshes und transparente Projekttrennung',()=>{
const buf=makeGLB(doc=>{
doc.nodes=[{translation:[0,2,0],children:[1,2]},{mesh:0,translation:[2,1,3]},{mesh:0,translation:[-2,0,0]}];
doc.scenes=[{nodes:[0]}];
});
const m=glb.parse(buf);
assert.equal(m.stats.triangles,2);
assert.equal(m.stats.nodes,3);
assert.equal(m.stats.primitives,2);
assert.deepEqual(Array.from(m.parts[0].vertices.slice(0,3)),[2,3,3]);
assert.deepEqual(Array.from(m.parts[1].vertices.slice(0,3)),[-2,2,0]);
const snap=Buffer.from(buf);
glb.parse(buf);
assert.deepEqual(buf,snap,'Parser verändert die GLB-Quelldaten nicht');
});

test('GLB-Eingaben ohne legitime Binary- und Headerstruktur abweisen',()=>{
assert.throws(()=>glb.parse(null),/GLB/);
assert.throws(()=>glb.parse(new Uint8Array(4)),/Dateigröße/);
assert.throws(()=>glb.parse(Buffer.alloc(8*1024*1024+1)),/Dateigröße/);
const corrupt=makeGLB();corrupt.writeUInt32LE(0,0);
assert.throws(()=>glb.parse(corrupt),/binäre glTF/);
const mismatch=makeGLB();mismatch.writeUInt32LE(100,8);
assert.throws(()=>glb.parse(mismatch),/binäre glTF/);
const truncated=makeGLB();truncated.writeUInt32LE(0xffffffff,12);
assert.throws(()=>glb.parse(truncated),/Chunk-Länge/);
});

test('Sicherheitsgrenzen und unbekannte Erweiterungen werden abgewiesen',()=>{
const bad=[
d=>{d.buffers[0].uri='https://example.invalid/malware.bin';},
d=>{d.extensionsRequired=['KHR_draco_mesh_compression'];},
d=>{d.accessors[0].sparse={count:1};},
d=>{d.accessors[0].count=900000;},
d=>{d.meshes[0].primitives[0].mode=1;},
d=>{d.materials[0].alphaMode='BLEND';},
d=>{d.animations=[{}];},
d=>{d.nodes[0].children=[0];},
d=>{d.accessors[1].count=4;},
d=>{d.scenes[0].nodes=[100];}
];
for(const modify of bad)assert.throws(()=>glb.parse(makeGLB(modify)),/GLB-Import:/);
assert.throws(()=>glb.parse(makeGLB((d,b)=>b.writeUInt16LE(99,36))),/Dreiecksindex/);
assert.throws(()=>glb.parse(makeGLB((d,b)=>b.writeFloatLE(NaN,0))),/Modellkoordinate/);
});

test('Ununterstützte Texturen werden explizit gekennzeichnet, niemals nachgeladen',()=>{
const result=glb.parse(makeGLB(d=>d.materials[0].pbrMetallicRoughness.baseColorTexture={index:0}));
assert.equal(result.warnings.length,2);
assert.match(result.warnings[0],/Texturen/);
});
