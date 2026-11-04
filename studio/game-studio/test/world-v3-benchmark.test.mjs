import test from 'node:test';
import assert from 'node:assert/strict';
import {makeWorldFixture,summarizeDurations,benchmark} from '../world-v3-benchmark.mjs';
test('fixtures reproducible and immutable',()=>{const a=makeWorldFixture({seed:42});assert.deepEqual(a,makeWorldFixture({seed:42}));assert.notDeepEqual(a,makeWorldFixture({seed:43}));assert.ok(Object.isFrozen(a[0].objects[0]));});
test('fixture bounds and object budget',()=>{assert.equal(makeWorldFixture({cells:256,objectsPerCell:32}).reduce((n,c)=>n+c.objects.length,0),8192);assert.throws(()=>makeWorldFixture({cells:256,objectsPerCell:33}),RangeError);assert.throws(()=>makeWorldFixture({seed:-1}),RangeError);});
test('nearest-rank percentiles and no mutation',()=>{const a=[5,1,4,2,3];assert.deepEqual(summarizeDurations(a),{count:5,p50:3,p95:5,mean:3,min:1,max:5});assert.deepEqual(a,[5,1,4,2,3]);});
test('reject malformed durations',()=>{for(const a of [[],[NaN],[Infinity],[-1],[60001]])assert.throws(()=>summarizeDurations(a),RangeError);});
test('warmup excluded and async callback measured',async()=>{let n=0,t=0;const result=await benchmark({warmup:2,iterations:4,run:async()=>{n++;},clock:()=>t++});assert.equal(n,6);assert.equal(result.count,4);assert.equal(result.p95,1);});
test('clock reversal and invalid arguments rejected',async()=>{await assert.rejects(benchmark({run:()=>{},iterations:1}),RangeError);await assert.rejects(benchmark({run:()=>{},iterations:2,warmup:0,clock:(()=>{let t=2;return ()=>t--;})()}),RangeError);});
