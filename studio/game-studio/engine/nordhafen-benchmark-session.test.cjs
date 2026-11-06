const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./nordhafen-benchmark-session.js');
test('session never treats synthetic fixture as actual rendered workload',()=>{
 const s=create({level:'medium',seed:7});
 const r=s.report();
 assert.equal(r.fixture.synthetic,true);
 assert.equal(r.fixture.chunkCount,64);
 assert.equal(r.qualityEvaluated,false);
 assert.equal(r.quality,null);
});
test('frame timestamps alone cannot claim full quality evaluation',()=>{
 const s=create();
 [0,16,32,48].forEach(s.sampleFrame);
 const r=s.report();
 assert.equal(r.frame.measured,true);
 assert.equal(r.qualityEvaluated,false);
});
test('quality evaluation needs explicit independent renderer measurements',()=>{
 const s=create();
 [0,16,32,48].forEach(s.sampleFrame);
 s.supplyMeasuredMetrics({drawCalls:800,memoryMb:1024,loadSeconds:6});
 const r=s.report();
 assert.equal(r.qualityEvaluated,true);
 assert.equal(r.quality.pass,true);
 assert.equal(r.fixture.synthetic,true);
});
test('bad metrics cannot be smuggled into quality results',()=>{
 const s=create();
 assert.throws(()=>s.supplyMeasuredMetrics({drawCalls:0,memoryMb:NaN,loadSeconds:1}),TypeError);
 assert.throws(()=>s.supplyMeasuredMetrics({drawCalls:1,memoryMb:1}),TypeError);
 assert.throws(()=>create({preset:'unknown'}),RangeError);
});
test('reset clears all measurements without changing fixture',()=>{
 const s=create();
 [0,16,32,48].forEach(s.sampleFrame);
 s.supplyMeasuredMetrics({drawCalls:100,memoryMb:100,loadSeconds:1});
 s.reset();
 assert.equal(s.report().qualityEvaluated,false);
 assert.equal(s.report().independentMetricsSupplied,false);
 assert.equal(s.fixture.chunks.length,16);
});
