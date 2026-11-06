const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./nordhafen-benchmark.js');
test('Nordhafen fixture is deterministic with the same seed',()=>{
 const a=create('small',7),b=create('small',7);
 assert.deepEqual(a,b);assert.notDeepEqual(a,create('small',8));
});
test('Nordhafen workload scales predictably across three levels',()=>{
 const small=create('small'),medium=create('medium'),large=create('large');
 assert.equal(small.chunks.length,16);
 assert.equal(medium.chunks.length,64);
 assert.equal(large.chunks.length,256);
 assert.equal(small.objectCount,256);
 assert.equal(medium.objectCount,2048);
 assert.equal(large.objectCount,15360);
});
test('fixture cannot be mistaken for measured engine performance',()=>{
 const fixture=create();
 assert.equal(fixture.synthetic,true);
 assert.equal(fixture.measured,false);
 assert.equal(fixture.chunks[0].objects[0].type,'building');
 assert.ok(Object.isFrozen(fixture.chunks[0].objects));
});
test('invalid benchmark sizes and seeds fail clearly',()=>{
 assert.throws(()=>create('ultra'),RangeError);
 assert.throws(()=>create('small',-1),TypeError);
 assert.throws(()=>create('small',Infinity),TypeError);
});
