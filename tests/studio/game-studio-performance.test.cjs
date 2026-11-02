'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../../studio/game-studio/scene-core.js');
const perf=require('../../studio/game-studio/performance.js');

test('Profiler berechnet mediane FPS, p95, Renderlast und langsame Frames deterministisch',()=>{
const p=perf.createProfiler(10);
assert.equal(p.snapshot().frames,0);
for(const ms of [10,12,14,16,18,20,22,30,40,100])assert(p.record(ms,8,42,3));
const s=p.snapshot();
assert.equal(s.frames,10);
assert.equal(s.medianMs,18);
assert.equal(s.p95Ms,100);
assert.equal(s.fps,1000/18);
assert.equal(s.slowFrames,2);
assert.equal(s.drawCalls,8);
assert.equal(s.objects,42);
assert.equal(s.renderCpuMs,3);
p.record(11,9,50,4);
assert.equal(p.snapshot().frames,10);
assert.equal(p.snapshot().p95Ms,100);
p.reset();
assert.equal(p.snapshot().frames,0);
assert.equal(p.snapshot().drawCalls,0);
});
test('Profiler ignoriert Hintergrundpausen, ungueltige Werte und ungueltige Fenster',()=>{
assert.throws(()=>perf.createProfiler(0),/Messfenster/);
assert.throws(()=>perf.createProfiler(2001),/Messfenster/);
const p=perf.createProfiler();
for(const m of [NaN,0,-1,Infinity,2001])assert.equal(p.record(m,1,1),false);
assert.equal(p.record(16,-1,1),false);
assert.equal(p.record(16,1,NaN),false);
assert.equal(p.record(16,1,1,-1),false);
assert.equal(p.snapshot().frames,0);
});
test('Drei Testwelten sind reproduzierbar, validiert und niemals an Originalszene gebunden',()=>{
const original=core.fresh(),json=core.serialize(original);
const expected={forest:63,interior:64,open:48};
for(const kind of Object.keys(expected)){
const a=perf.createBenchmark(core,kind),b=perf.createBenchmark(core,kind);
assert.equal(a.objects.length,expected[kind]);
assert.equal(core.serialize(a),core.serialize(b));
assert.equal(new Set(a.objects.map(x=>x.id)).size,a.objects.length);
assert.deepEqual(core.parse(core.serialize(a)),a);
assert.notStrictEqual(a,original);
assert.notStrictEqual(a.terrain,original.terrain);
if(kind==='open')assert(a.terrain.some(h=>h>0));
}
assert.equal(core.serialize(original),json,'Original muss unverändert bleiben');
assert.throws(()=>perf.createBenchmark(core,'<script>'),/Unbekannte/);
});
