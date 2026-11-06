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

test('GLB unavailable: broken URL is never requested without HTTP 200 proof',()=>{
 assert.match(html,/id="glb"/);
 assert.match(html,/const glbEnabled=false/);
 assert.match(html,/GLB deaktiviert: keine verifizierte HTTP-200-Asset-URL/);
 assert.doesNotMatch(html,/BoomBox\.glb/);
 assert.doesNotMatch(html,/SceneLoader\.ImportMeshAsync/);
});

test('step 7: PBR opt-in is used in Lab and fifth comparison mode is selected',()=>{
 assert.match(html,/id="pbr"/);
 assert.match(html,/nordhafen-pbr-quality\.js/);
 assert.match(html,/SDNordhafenPBR\.create/);
 assert.match(html,/pbr\.start\(\)/);
 assert.match(html,/pbr\.updateShadows/);
 assert.match(html,/pbr\.dispose\(\)/);
 assert.match(html,/Streaming \+ LOD \+ Thin Instances \+ PBR/);
});

test('step 8: player and pure motion are loaded and executed in Lab',()=>{
 for(const name of ['nordhafen-player-motion.js','nordhafen-player-controller.js'])
  assert.ok(html.includes('<script src="./'+name+'"></script>'),name);
 assert.match(html,/id="player"/);
 assert.match(html,/cdn\.babylonjs\.com\/havok\/HavokPhysics_umd\.js/);
 assert.match(html,/SDNordhafenPlayerController\.create/);
 assert.match(html,/motion:window\.SDNordhafenPlayerMotion/);
 assert.match(html,/player\.update\(engine\.getDeltaTime\(\)\/1000\)/);
 assert.match(html,/streamer\.update\(pos\.x,pos\.z\)/);
 assert.match(html,/player\.syncColliders\(streamer\)/);
 assert.match(html,/player\.dispose\(\)/);
});

test('GLB normalization module remains registered for a future verified asset',()=>{
 assert.match(html,/nordhafen-thin-instances\.js/);
 assert.doesNotMatch(html,/BoomBox\.glb/);
});

test('device regression: LOD placeholders are real per-building boxes, not flat cell discs',()=>{
 assert.match(html,/chunk\.objects\.filter\(obj=>obj\.type==='building'\)/);
 assert.match(html,/mesh\.scaling\.set\(4,6,4\)/);
 assert.doesNotMatch(html,/mesh\.scaling\.set\(64,4,64\)/);
});
test('device regression: sliced builders wired into streaming and LOD',()=>{
 assert.match(html,/nordhafen-build-slices\.js/);
 assert.match(html,/SDNordhafenBuildSlices\.run\(work/);
 assert.match(html,/SDNordhafenBuildSlices\.run\(/);
 assert.match(html,/budgetMs:4/);
 assert.match(html,/buildCellSliced\(source,opts\)/);
});
