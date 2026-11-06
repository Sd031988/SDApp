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

test('lab loads and executes all three audit modules before comparison display',()=>{
 for(const name of ['nordhafen-comparison-audit.js','nordhafen-route-identity.js','nordhafen-frame-window-audit.js'])
  assert.ok(html.includes('<script src="./'+name+'"></script>'),name);
 for(const call of ['SDNordhafenComparisonAudit.audit(runs)','SDNordhafenRouteIdentity.identify({','SDNordhafenFrameWindowAudit.audit(runSamples'])
  assert.ok(html.includes(call),call);
 assert.match(html,/Lauf ungültig:/);
 assert.match(html,/if\(!verdict\.valid\)runFailure/);
 assert.match(html,/if\(!verdict\.comparable\)compare/);
});

test('u: missing runs display pending rather than invalid comparison',()=>{
 assert.match(html,/const pending=modes\.filter\(m=>!comparison\[m\]\)/);
 assert.match(html,/ausstehend/);
 assert.match(html,/if\(pending\.length\)/);
 assert.match(html,/SDNordhafenThinInstances\.create/);
 assert.match(html,/id="thin"/);
});

test('step 6: GLB opt-in uses shared async Babylon loader and streamer fallback',()=>{
 assert.match(html,/id="glb"/);
 assert.match(html,/BABYLON\.SceneLoader\.ImportMeshAsync/);
 assert.match(html,/https:\/\/assets\.babylonjs\.com\/meshes\//);
 assert.match(html,/const asyncCellBuilder=glbEnabled/);
 assert.match(html,/buildCell:asyncCellBuilder/);
 assert.match(html,/GLB-Ladefehler – Box-Fallback/);
 assert.match(html,/cdn\.babylonjs\.com\/loaders\/babylonjs\.loaders\.min\.js/);
});
