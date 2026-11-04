'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const bench=require('../world-v3-cpu-benchmark.js');
const core=require('../large-world-core.js');
test('p50/p95 interpolation preserves caller samples',()=>{
const values=[10,1,4,2,3],stats=bench.summarize(values);
assert.equal(stats.p50Ms,3);assert.ok(Math.abs(stats.p95Ms-8.8)<1e-10);
assert.deepEqual(values,[10,1,4,2,3]);
});
test('bounded deterministic CPU benchmark does not claim GPU metrics or mutate world',()=>{
let tick=0;const world=core.generate(31,2),before=core.serialize(world);
const result=bench.benchmark({world,core,positions:[{x:0,z:0},{x:100,z:100}],iterations:4,warmup:2,radius:1,clock:()=>tick++});
assert.equal(result.p50Ms,1);assert.equal(result.p95Ms,1);assert.equal(result.count,4);
assert.equal(result.gpuDrawCalls,null);assert.equal(result.gpuFrameTimeMs,null);
assert.ok(result.maxActiveCells<=9);assert.equal(core.serialize(world),before);
});
test('invalid samples, coordinates, radius and clock fail closed',()=>{
for(const values of [[],[NaN],[Infinity],[-1]])assert.throws(()=>bench.summarize(values));
const world=core.generate(31,0),base={world,core,positions:[{x:0,z:0}],iterations:1,warmup:0,radius:1,clock:()=>1};
for(const change of [{iterations:0},{radius:4},{positions:[{x:Infinity,z:0}]},{clock:()=>NaN}])assert.throws(()=>bench.benchmark({...base,...change}));
});
