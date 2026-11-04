import test from 'node:test';
import assert from 'node:assert/strict';
import {createTextureResourceCache} from '../world-v3-texture-resource-cache.mjs';

test('deduplicates concurrent loads and reuses resident resources', async () => {
  let calls = 0; const cache = createTextureResourceCache({load: async k => {calls++; return {k};}, dispose: () => {}});
  const [a,b] = await Promise.all([cache.acquire('asset-1'), cache.acquire('asset-1')]);
  assert.strictEqual(a,b); assert.strictEqual(await cache.acquire('asset-1'),a); assert.equal(calls,1);
});
test('evicts least recently used resource and invokes disposer', async () => {
  const disposed=[]; const cache=createTextureResourceCache({maxEntries:2,load:async k=>({k}),dispose:r=>disposed.push(r.k)});
  await cache.acquire('a'); await cache.acquire('b'); await cache.acquire('a'); await cache.acquire('c');
  assert.deepEqual(disposed,['b']); assert.equal(cache.stats().resident,2);
});
test('clear invalidates inflight load and disposes late result', async () => {
  let release; const disposed=[];
  const cache=createTextureResourceCache({load:()=>new Promise(r=>{release=r;}),dispose:r=>disposed.push(r)});
  const request=cache.acquire('late'); await Promise.resolve(); cache.clear(); release({id:1});
  await assert.rejects(request,/invalidated/); assert.deepEqual(disposed,[{id:1}]); assert.equal(cache.stats().resident,0);
});
test('rejects unsafe identifiers and invalid capacity', async () => {
  assert.throws(()=>createTextureResourceCache({load:()=>{},dispose:()=>{},maxEntries:0}),RangeError);
  const cache=createTextureResourceCache({load:async k=>k,dispose:()=>{}});
  for(const key of ['../x','https://host/x','a/b','..','', 'data:x']) await assert.rejects(cache.acquire(key));
});
test('failed load can be retried and close blocks new acquisitions', async () => {
  let calls=0; const cache=createTextureResourceCache({load:async()=>{if(++calls===1)throw Error('decode failed');return {ok:true};},dispose:()=>{}});
  await assert.rejects(cache.acquire('x'),/decode failed/); assert.deepEqual(await cache.acquire('x'),{ok:true});
  cache.close(); assert.equal(cache.stats().resident,0); await assert.rejects(cache.acquire('x'),/closed/);
});
