const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./nordhafen-frame-telemetry.js');
test('does not invent performance metrics without frames',()=>{
 const t=create();
 assert.equal(t.report().measured,false);
 t.sample(0);t.sample(16);
 assert.equal(t.report().measured,false);
});
test('computes FPS and P95 from supplied render timestamps',()=>{
 const t=create();
 [0,16,32,48,80,96].forEach(x=>t.sample(x));
 const r=t.report();
 assert.equal(r.measured,true);
 assert.equal(r.sampleCount,5);
 assert.equal(r.fps,52.08);
 assert.equal(r.frameP95Ms,32);
});
test('bounded rolling buffer and reset work without persistence',()=>{
 const t=create({maxSamples:2});
 [0,10,20,40].forEach(x=>t.sample(x));
 assert.equal(t.report().sampleCount,2);
 t.reset();
 assert.equal(t.report().sampleCount,0);
 assert.equal(t.report().measured,false);
});
test('rejects invalid and out-of-order timestamps',()=>{
 const t=create();
 assert.throws(()=>t.sample(-1),TypeError);
 t.sample(10);
 assert.throws(()=>t.sample(10),RangeError);
 assert.throws(()=>t.sample(NaN),TypeError);
 assert.throws(()=>create({maxSamples:1}),RangeError);
});
