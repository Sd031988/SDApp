'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const f=require('../world-v3-frustum.js');
// Axis-aligned camera volume: -10 <= x,y,z <= 10.
const ps=[[1,0,0,10],[-1,0,0,10],[0,1,0,10],[0,-1,0,10],[0,0,1,10],[0,0,-1,10]];
test('inside, outside, intersecting and tangent boxes are conservatively classified',()=>{
assert.equal(f.visible(f.box([-1,-1,-1],[1,1,1]),ps),true);
assert.equal(f.visible(f.box([11,-1,-1],[12,1,1]),ps),false);
assert.equal(f.visible(f.box([9,-1,-1],[12,1,1]),ps),true);
assert.equal(f.visible(f.box([10,0,0],[11,1,1]),ps),true);
});
test('positive vertex avoids false rejection of partially visible large cells',()=>{
assert.equal(f.visible(f.box([-100,-100,-100],[100,100,100]),ps),true);
assert.equal(f.visible(f.box([-100,-100,-100],[-11,100,100]),ps),false);
});
test('scaled plane normals have the same result',()=>{
assert.equal(f.visible(f.box([11,0,0],[12,1,1]),ps.map(p=>p.map(v=>v*3))),false);
});
test('World-v3 cell bounds remain centered and deterministic',()=>{
assert.deepEqual(f.cellBounds(0,0),{min:[-320,-100,-320],max:[-280,100,-280]});
assert.deepEqual(f.cellBounds(15,15),{min:[280,-100,280],max:[320,100,320]});
});
test('reject NaN, Infinity, degenerate planes, invalid extents and cell coordinates',()=>{
for(const bad of [NaN,Infinity,-Infinity,'1'])assert.throws(()=>f.box([bad,0,0],[1,1,1]));
assert.throws(()=>f.box([2,0,0],[1,1,1]));
assert.throws(()=>f.visible(f.box([0,0,0],[1,1,1]),[[0,0,0,0],...ps.slice(1)]));
assert.throws(()=>f.visible(f.box([0,0,0],[1,1,1]),ps.slice(1)));
assert.throws(()=>f.cellBounds(16,0));
assert.throws(()=>f.cellBounds(0,0,40,16,2,-2));
});
test('visibility never mutates caller-provided arrays',()=>{
const original=JSON.stringify(ps),b=f.box([-1,-1,-1],[1,1,1]);
f.visible(b,ps);assert.equal(JSON.stringify(ps),original);
});
