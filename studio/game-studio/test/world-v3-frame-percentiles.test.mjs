import test from 'node:test';
import assert from 'node:assert/strict';
import {createFrameSampler} from '../world-v3-frame-percentiles.mjs';
test('exact nearest-rank p50 and p95',()=>{const s=createFrameSampler();for(let i=1;i<=100;i++)s.record(i);const r=s.snapshot();assert.equal(r.p50,50);assert.equal(r.p95,95);assert.equal(r.mean,50.5)});
test('bounded rolling sample',()=>{const s=createFrameSampler({capacity:3});[1,2,3,4].forEach(s.record);assert.deepEqual([s.snapshot().min,s.snapshot().max,s.snapshot().count],[2,4,3])});
test('rejects invalid duration and capacity',()=>{assert.throws(()=>createFrameSampler({capacity:0}));const s=createFrameSampler();for(const n of [-1,Infinity,NaN])assert.throws(()=>s.record(n))});
test('timed frames and reset',()=>{let t=10;const s=createFrameSampler({now:()=>t});s.begin();assert.throws(()=>s.begin());t=22;assert.equal(s.end(),12);assert.throws(()=>s.end());s.reset();assert.equal(s.snapshot().p95,null)});
test('snapshot immutable and over-budget count',()=>{const s=createFrameSampler();s.record(16);s.record(17);const r=s.snapshot();assert.ok(Object.isFrozen(r));assert.equal(r.over16ms,1)});
