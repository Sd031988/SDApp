const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'nordhafen-live-webgl-lab.html'),'utf8');
test('opt-in WebGL lab is standalone and only creates scene on click',()=>{
 assert.match(html,/addEventListener\('click',begin\)/);
 assert.match(html,/new BABYLON\.Engine\(canvas/);
 assert.match(html,/engine\.runRenderLoop/);
});
test('lab consumes real Babylon end-frame telemetry and marks GPU unknown',()=>{
 assert.match(html,/SDNordhafenBabylonSessionBridge\.create/);
 assert.match(html,/performance\.now\(\)/);
 assert.match(html,/GPU gemessen: '\+\(g && g\.measured \? 'JA' : 'NEIN/);
 assert.doesNotMatch(html,/supplyMeasuredMetrics\(/);
});
test('lab cleans up renderer, listeners, and timers',()=>{
 for(const phrase of ['bridge.stop()','engine.stopRenderLoop()','scene.dispose()','engine.dispose()','clearInterval(timer)','pagehide'])
  assert.ok(html.includes(phrase),phrase);
});
test('lab uses bounded deterministic fixture and explicit provenance',()=>{
 assert.match(html,/create\(level,1337\)/);
 assert.match(html,/option value="small"/);
 assert.match(html,/option value="medium"/);
 assert.doesNotMatch(html,/option value="large"/);
 assert.match(html,/keine vollständige Nordhafen-Spielwelt/);
});
