'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./gpu-timing-statistics.js');
test('never reports GPU percentiles from pending, disjoint or invalid samples',()=>{
 const s=create({minimum:2});
 for(const status of ['pending','disjoint','invalid','idle'])
   assert.equal(s.ingest({status,gpuMs:3}),false);
 assert.equal(s.ingest({status:'measured',gpuMs:NaN}),false);
 assert.equal(s.ingest({status:'measured',gpuMs:-1}),false);
 assert.deepEqual([s.report().measured,s.report().gpuP95Ms,s.report().rejectedCount],[false,null,6]);
});
test('computes interpolated p50/p95 only from measured GPU milliseconds',()=>{
 const s=create({minimum:5});
 [1,2,3,4,5].forEach(gpuMs=>s.ingest({status:'measured',gpuMs}));
 assert.deepEqual([s.report().gpuP50Ms,s.report().gpuP95Ms],[3,4.8]);
 assert.equal(s.report().source,'EXT_disjoint_timer_query_webgl2');
});
test('bounded window excludes oldest sample',()=>{
 const s=create({capacity:3,minimum:2});
 [100,10,20,30].forEach(gpuMs=>s.ingest({status:'measured',gpuMs}));
 assert.equal(s.report().sampleCount,3);
 assert.equal(s.report().gpuP50Ms,20);
});
test('reset and invalid options fail closed',()=>{
 assert.throws(()=>create({capacity:1}),RangeError);
 assert.throws(()=>create({minimum:10,capacity:3}),RangeError);
 const s=create({minimum:2});
 s.ingest({status:'measured',gpuMs:1});s.ingest({status:'measured',gpuMs:2});
 assert.equal(s.report().measured,true);
 s.reset();
 assert.deepEqual([s.report().measured,s.report().rejectedCount],[false,0]);
});
