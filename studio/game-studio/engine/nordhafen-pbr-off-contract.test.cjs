'use strict';
/* Non-browser contract checks: PBR-off must not initialize procedural textures.
 * Browser/WebGL runtime verification remains a separate acceptance gate. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'nordhafen-live-webgl-lab.html'),'utf8');
const citySource=fs.readFileSync(path.join(__dirname,'nordhafen-procedural-city.js'),'utf8');
test('procedural city module loads without allocating any textures',()=>{
 let allocated=0;
 const sandbox={module:{exports:{}},BABYLON:{DynamicTexture:class{constructor(){allocated++;}}}};
 vm.runInNewContext(citySource,sandbox,{timeout:1000});
 assert.equal(allocated,0);
 assert.equal(typeof sandbox.module.exports.create,'function');
});
test('procedural city construction is guarded by successful PBR activation',()=>{
 const gate='if(pbr&&pbr.enabled){';
 const create='city=window.SDNordhafenProceduralCity.create(';
 const pos=html.indexOf(create);
 assert.ok(pos>0,'city initialization exists');
 const opening=html.lastIndexOf(gate,pos);
 assert.ok(opening>0,'successful PBR gate precedes city initialization');
 assert.equal(html.slice(opening,pos).includes('}'),false,'city initialization is inside gate');
 assert.equal(html.split(create).length,2,'city is initialized at only one call site');
});
test('procedural texture creation remains inside opt-in create() factory',()=>{
 const start=citySource.indexOf('function create(');
 assert.ok(start>0);
 for(const match of citySource.matchAll(/new BABYLON\.DynamicTexture\(/g))
  assert.ok(match.index>start,'texture constructed only after explicit create()');
});
test('cleanup disposes city before scene and no-PBR fallback keeps legacy path',()=>{
 const cleanup=html.slice(html.indexOf('function cleanup(){'),html.indexOf('function show(){'));
 assert.ok(cleanup.indexOf('city.dispose()')<cleanup.indexOf('scene.dispose()'));
 assert.match(html,/if\(city\)\{[\s\S]*?city\.buildCell\(chunk/);
 assert.match(html,/const meshes=\[\],materials=\[\];/);
});
