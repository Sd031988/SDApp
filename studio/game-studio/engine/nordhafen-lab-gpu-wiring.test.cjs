'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const wiring=require('./nordhafen-lab-gpu-wiring.js');
const html=fs.readFileSync(path.join(__dirname,'nordhafen-live-webgl-lab.html'),'utf8');
function harness(extension=true){
 const listeners=()=>{const set=new Set();return {add(fn){set.add(fn);return fn;},remove(fn){set.delete(fn);},fire(){for(const fn of [...set])fn();},get size(){return set.size;}};};
 const before=listeners(),after=listeners(),queries=new Set();
 const gl={
  QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,
  getExtension:()=>extension?{TIME_ELAPSED_EXT:3,GPU_DISJOINT_EXT:4}:null,
  createQuery(){const q={};queries.add(q);return q;},
  beginQuery(){},endQuery(){},deleteQuery(q){queries.delete(q);},
  getParameter:()=>false,getQueryParameter:(_,p)=>p===1?false:1000000
 };
 const scene={onBeforeRenderObservable:before,onAfterRenderObservable:after};
 const api=wiring.create({scene,gl,timerAPI:require('./webgl2-gpu-timer.js'),
 sessionAPI:require('./gpu-timing-session.js'),statisticsAPI:require('./gpu-timing-statistics.js')});
 return {api,before,after,queries};
}
test('lab includes both GPU dependencies and opt-in controller',()=>{
 for(const f of ['webgl2-gpu-timer.js','gpu-timing-session.js','gpu-timing-statistics.js','nordhafen-lab-gpu-wiring.js'])
  assert.ok(html.includes('src="./'+f+'"'),f);
});
test('missing extension shows unavailable and no samples',()=>{
 const h=harness(false);
 assert.equal(h.api.start(),false);
 assert.equal(h.api.report().unavailable,true);
 assert.equal(h.api.report().sampleCount,0);
 assert.match(html,/GPU-Messung nicht verfügbar/);
});
test('GPU never starts without explicit opt-in',()=>{
 const h=harness();
 assert.equal(h.api.active,false);
 assert.equal(h.before.size,0);
 assert.match(html,/addEventListener\('click',beginGPU\)/);
});
test('stop deletes all query handles and observers',()=>{
 const h=harness();assert.equal(h.api.start(),true);
 h.before.fire();assert.equal(h.queries.size,1);
 h.after.fire();h.api.stop();
 assert.equal(h.queries.size,0);
 assert.equal(h.before.size,0);assert.equal(h.after.size,0);
});
test('pending GPU queries do not become measured samples',()=>{
 const h=harness();h.api.start();h.before.fire();h.after.fire();
 assert.equal(h.api.report().sampleCount,0);h.api.stop();
});

test('lab has no hard-coded GPU measured NO status',()=>{
 assert.doesNotMatch(html,/GPU gemessen: NEIN/);
 assert.match(html,/g && g\.measured/);
 assert.match(html,/GPU verworfen:/);
});
test('report without a session explicitly has no measurements or rejects',()=>{
 const h=harness();
 const r=h.api.report();
 assert.equal(r.measured,false);
 assert.equal(r.rejectedCount,0);
 assert.equal(r.sampleCount,0);
 assert.equal(r.minimumSamples,30);
});
test('lab labels cadence as frame interval rather than CPU time',()=>{
 assert.doesNotMatch(html,/CPU-Frame/);
 assert.match(html,/Frame-Intervall p50/);
 assert.match(html,/Frame-Intervall p95/);
});
