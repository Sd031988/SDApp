import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFrustumPlanes, aabbIntersectsFrustum, filterVisibleCells} from '../world-v3-frustum-culling.mjs';
const planes = normalizeFrustumPlanes([[1,0,0,1],[-1,0,0,1],[0,1,0,1],[0,-1,0,1],[0,0,1,1],[0,0,-1,1]]);
test('inside, outside, intersecting boundary', () => {
  assert.equal(aabbIntersectsFrustum(planes,[-.5,-.5,-.5],[.5,.5,.5]),true);
  assert.equal(aabbIntersectsFrustum(planes,[2,0,0],[3,1,1]),false);
  assert.equal(aabbIntersectsFrustum(planes,[1,-.1,-.1],[2,.1,.1]),true);
});
test('normalization preserves visibility', () => {
  const scaled = normalizeFrustumPlanes([[10,0,0,10],[-2,0,0,2],[0,3,0,3],[0,-4,0,4],[0,0,5,5],[0,0,-6,6]]);
  assert.equal(aabbIntersectsFrustum(scaled,[2,0,0],[3,1,1]),false);
});
test('invalid and degenerate planes fail closed', () => {
  assert.throws(()=>normalizeFrustumPlanes([[0,0,0,1],...Array(5).fill([1,0,0,1])]),RangeError);
  assert.throws(()=>normalizeFrustumPlanes(Array(6).fill([NaN,0,0,1])),TypeError);
});
test('invalid bounds rejected', () => {
  assert.throws(()=>aabbIntersectsFrustum(planes,[1,0,0],[0,1,1]),RangeError);
  assert.throws(()=>aabbIntersectsFrustum(planes,[0,0,Infinity],[1,1,1]),TypeError);
});
test('bounded cells and deterministic order', () => {
  const result=filterVisibleCells(planes,[{id:'near',min:[0,0,0],max:[.2,.2,.2]},{id:'far',min:[4,0,0],max:[5,1,1]}]);
  assert.deepEqual(result,{visible:['near'],tested:2,culled:1});
  assert.ok(Object.isFrozen(result.visible));
  assert.throws(()=>filterVisibleCells(planes,Array(257).fill({id:'a',min:[0,0,0],max:[1,1,1]})),RangeError);
});
test('malformed cell IDs rejected',()=>assert.throws(()=>filterVisibleCells(planes,[{id:'../escape',min:[0,0,0],max:[1,1,1]}]),TypeError));
