import assert from 'node:assert/strict';
import {furSamples} from './pibo-fur.mjs';
for(const [count,radii,frontLimit] of [[220,[.76,.7,.66],.14],[300,[.72,.85,.63],.26]]){
 const samples=furSamples({count,radii,frontLimit});
 assert.equal(samples.length,count,'All instances generated');
 assert.deepEqual(samples,furSamples({count,radii,frontLimit}),'Stable across reloads');
 for(const sample of samples){
  const [x,y,z]=sample.position,[nx,ny,nz]=sample.normal;
  assert(Math.abs(x*x/radii[0]**2+y*y/radii[1]**2+z*z/radii[2]**2-1)<1e-9,'On surface');
  assert(Math.abs(Math.hypot(nx,ny,nz)-1)<1e-9,'Unit outward normal');
  assert(y/radii[1]>=-.82-1e-9,'No underside spikes');
  assert(z/radii[2]<=frontLimit+1e-9||y/radii[1]>=.78,'Front muzzle and chest kept clear');
  assert(sample.length>=.7&&sample.length<=1.25);
 }
}
for(const invalid of [0,-2,1201,2.5])assert.throws(()=>furSamples({count:invalid}),RangeError);
for(const radii of [[1,0,1],[1,NaN,1],[1,1]])assert.throws(()=>furSamples({radii}),RangeError);
console.log('PASS: deterministic mobile fur shells, masked face/chest, unit normals and safe bounds');
