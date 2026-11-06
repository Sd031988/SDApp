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
 assert.match(html,/mesh\.scaling\.set\(size.width,h,size.depth\)/);
 assert.match(html,/SDNordhafenProceduralCity\.height\(1337,obj\)/);
 assert.doesNotMatch(html,/mesh\.scaling\.set\(64,4,64\)/);
});
test('device regression: sliced builders wired into streaming and LOD',()=>{
 assert.match(html,/nordhafen-build-slices\.js/);
 assert.match(html,/SDNordhafenBuildSlices\.run\(work/);
 assert.match(html,/SDNordhafenBuildSlices\.run\(/);
 assert.match(html,/budgetMs:4/);
 assert.match(html,/buildCellSliced\(source,\{\.\.\.opts,level\}\)/);
});

test('step 9: city is PBR opt-in and new procedural module is integrated',()=>{
 assert.match(html,/nordhafen-procedural-city\.js/);
 assert.match(html,/if\(pbr&&pbr\.enabled\)/);
 assert.match(html,/SDNordhafenProceduralCity\.create/);
 assert.match(html,/city\.buildCell\(chunk/);
 assert.match(html,/city\.dispose\(\)/);
 assert.match(html,/Draw Calls \(aktuell\)/);
 assert.match(html,/camera\.target\.set\(x,12,z\)/);
});

const vm=require('node:vm');
function simulatePreset(search){
 const controls=Object.fromEntries(['level','pbr','thin','lod','streaming','player','glb']
  .map(id=>[id,{value:id==='level'?'small':'',checked:false}]));
 const beginCalls=[];
 const context={URLSearchParams,controls,search,beginCalls,$:id=>controls[id]};
 const snippet=html.slice(html.indexOf(' function applyPreset(search){'),html.indexOf(' const preset=applyPreset(window.location.search);'));
 assert.ok(snippet.includes('function applyPreset'));
 vm.runInNewContext(snippet+"\nresult=applyPreset(search);if(result.autoStart)beginCalls.push('begin');",context);
 return {controls,beginCalls,result:context.result};
}
test('URL without preset preserves defaults and never auto-starts',()=>{
 const x=simulatePreset('');
 assert.equal(x.result.name,'keins');
 assert.equal(x.result.autoStart,false);
 assert.deepEqual(x.beginCalls,[]);
 assert.equal(x.controls.level.value,'small');
 for(const id of ['pbr','thin','lod','streaming','player','glb'])assert.equal(x.controls[id].checked,false);
 assert.match(html,/if\(preset\.autoStart\)begin\(\)/);
});
test('preset=city sets exactly medium/PBR/thin/LOD/streaming and auto-starts',()=>{
 const x=simulatePreset('?preset=city');
 assert.equal(x.result.name,'city');
 assert.deepEqual(x.beginCalls,['begin']);
 assert.equal(x.controls.level.value,'medium');
 for(const id of ['pbr','thin','lod','streaming'])assert.equal(x.controls[id].checked,true,id);
 for(const id of ['player','glb'])assert.equal(x.controls[id].checked,false,id);
 assert.match(html,/Preset: '\+preset\.name/);
});
test('unknown preset changes no controls, does not start and gives status notice',()=>{
 const x=simulatePreset('?preset=unexpected');
 assert.equal(x.result.name,'keins');
 assert.equal(x.result.autoStart,false);
 assert.deepEqual(x.beginCalls,[]);
 assert.match(x.result.notice,/Unbekanntes Preset: unexpected/);
 assert.equal(x.controls.level.value,'small');
 for(const id of ['pbr','thin','lod','streaming','player','glb'])assert.equal(x.controls[id].checked,false,id);
 assert.match(html,/if\(preset\.notice\)status\.textContent=preset\.notice/);
});

test('active city disposes legacy floor so only city ground remains',()=>{
 const begin=html.slice(html.indexOf('     if(pbr&&pbr.enabled){'),html.indexOf('     function buildCell('));
 const floors=new Set(['pbr-ground']);
 vm.runInNewContext(begin,{pbr:{enabled:true},scene:{getMeshByName:name=>({dispose:()=>floors.delete(name)})},
  window:{SDNordhafenProceduralCity:{create:()=>{floors.add('city-roads-grass');return {};}}},
  BABYLON:{},fixture:{},building:{},tree:{},preset:{cityThin:true}});
 assert.deepEqual([...floors],['city-roads-grass']);
});
test('each frame streams around current camera target and simplified city retains buildings',()=>{
 assert.match(html,/streamer.update\(camera.position.x,camera.position.z\)/);
 assert.match(html,/obj.type==='building'\|\|\(level==='simplified'&&obj.type==='vegetation'&&i%2===0\)/);
});

test('step 9e: URL thin=0 selects city createInstance fallback without disabling the lab',()=>{
 const a=simulatePreset('?preset=city&freeze=1&thin=0');
 const b=simulatePreset('?preset=city&freeze=1&thin=1');
 assert.equal(a.result.cityThin,false);
 assert.equal(b.result.cityThin,true);
 assert.equal(a.result.freeze,true);
 assert.equal(a.result.autoStart,true);
 assert.equal(a.controls.thin.checked,true);
 assert.match(html,/useThinInstances:preset\.cityThin/);
});

test('step 9f: default city preset selects visible instances, thin=1 warns explicitly',()=>{
 const d=simulatePreset('?preset=city&freeze=1');
 assert.equal(d.result.cityThin,false);
 assert.match(html,/Thin Instances: experimentell, rendert derzeit nicht/);
});

test('step 9g: active LOD placeholder boxes have material and are visible',()=>{
 const code=html.slice(html.indexOf('     async function placeholderSliced('),html.indexOf('     const route=',html.indexOf('     async function placeholderSliced(')));
 assert.match(code,/source.createInstance\('lod-placeholder-building-/);
 assert.match(code,/mesh\.isVisible=true/);
 assert.doesNotMatch(code,/mesh\.isVisible=false/);
});

test('step 9h: LOD and streaming use camera position, not camera target',()=>{
 assert.match(html,/streamer.update\(camera.position.x,camera.position.z\)/);
 assert.doesNotMatch(html,/streamer.update\(camera.target.x,camera.target.z\)/);
 assert.match(html,/near:90,far:150,hysteresis:8/);
});
test('step 9h: distant placeholders are instances of shared source meshes',()=>{
 const code=html.slice(html.indexOf('     const placeholderSources='),html.indexOf('     const route='));
 assert.match(code,/source.createInstance\('lod-placeholder-building-/);
 assert.match(code,/source.material=material/);
 assert.doesNotMatch(code,/MeshBuilder.CreateBox\('lod-placeholder-'\+obj.id/);
});


test('step 10: third-person camera stays 6–8 m away with FOV <= 0.9',()=>{
 const controller=require('./nordhafen-player-controller.js');
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'nordhafen-player-controller.js'),'utf8');
 assert.equal(typeof controller.create,'function');
 assert.match(source,/camera\.radius=7\.5/);
 assert.match(source,/camera\.fov=\.8/);
 assert.match(source,/camera\.lowerRadiusLimit=6;camera\.upperRadiusLimit=8/);
 assert.match(source,/camera\.beta=1\.15/);
 assert.match(source,/camera\.lowerBetaLimit=\.35;camera\.upperBetaLimit=1\.3/);
});
test('step 10: player is visible with its own material and starts in the center',()=>{
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'nordhafen-player-controller.js'),'utf8');
 assert.match(source,/player\.position\.set\(fixture\.grid\*32,groundHeight\+standingHalfHeight,fixture\.grid\*32\)/);
 assert.match(source,/const groundHeight=0,standingHalfHeight=\.9;/);
 assert.match(source,/player\.material=playerMaterial/);
 assert.match(source,/player\.isVisible=true/);
 assert.match(source,/playerMaterial\.diffuseColor=new BABYLON\.Color3/);
});
test('step 10: grassy outskirts extend three times the city footprint',()=>{
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'nordhafen-procedural-city.js'),'utf8');
 assert.match(source,/city-outskirts-grass/);
 assert.match(source,/width:span\*3,height:span\*3/);
 assert.match(source,/outskirts\.position\.set\(span\/2,-\.19,span\/2\)/);
});
