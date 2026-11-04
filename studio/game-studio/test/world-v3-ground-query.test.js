'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Ground=require('../world-v3-ground-query.js');
const Terrain=require('../large-world-terrain.js');
test('ground height matches rendered procedural terrain',()=>{
 for(const [x,z] of [[0,0],[-320,-320],[320,320],[24.5,-79.3]]){
  const s=Ground.queryGround(x,z,0,31);
  assert.equal(s.height,Terrain.heightAt(x,z,31));
  assert.equal(s.clearance,-s.height);
  assert.equal(s.penetrating,0<s.height);
  assert.ok(Object.isFrozen(s));
 }
});
test('segment samples both endpoints and reports earliest penetration',()=>{
 const h=Terrain.heightAt(0,0,31);
 const a=Ground.traceGround(0,0,0,0,h-1,31,8);
 assert.equal(a.firstPenetration.t,0);
 assert.equal(a.samples,9);
 assert.equal(a.lowestClearance,-1);
 const b=Ground.traceGround(0,0,0,0,h+1,31,8);
 assert.equal(b.firstPenetration,null);
 assert.equal(b.lowestClearance,1);
});
test('rejects invalid coordinates, seeds, steps and overflow',()=>{
 for(const value of [NaN,Infinity,'0',null])assert.throws(()=>Ground.queryGround(value,0,0));
 for(const steps of [0,257,1.5])assert.throws(()=>Ground.traceGround(0,0,1,1,0,31,steps));
 assert.throws(()=>Ground.queryGround(0,0,0,0));
 assert.throws(()=>Ground.traceGround(-1e308,0,1e308,0,0));
});
test('deterministic and immutable query without project writes',()=>{
 const p=Object.freeze({x:11,z:22,y:4});
 const a=Ground.traceGround(p.x,p.z,12,23,p.y);
 const b=Ground.traceGround(p.x,p.z,12,23,p.y);
 assert.deepEqual(a,b);assert.ok(Object.isFrozen(a));assert.equal(p.x,11);
});