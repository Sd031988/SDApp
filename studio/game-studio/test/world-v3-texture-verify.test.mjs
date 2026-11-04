import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../world-v3-texture-verify.js',import.meta.url),'utf8');
const {verifyLocalTexture} = await import('data:text/javascript,'+encodeURIComponent(source));
const bytes = Uint8Array.from([1,2,3,4]);
const hash = Buffer.from(await webcrypto.subtle.digest('SHA-256',bytes)).toString('hex');
const entry = {file:'albedo.png',mime:'image/png',sha256:hash,bytes:4};
test('valid buffer and view offsets', async()=>{
  assert.equal((await verifyLocalTexture(entry,bytes,webcrypto)).verified,true);
  assert.equal((await verifyLocalTexture(entry,new Uint8Array([9,1,2,3,4,9]).subarray(1,5),webcrypto)).sha256,hash);
});
test('reject tampered data and mismatched size',async()=>{
  await assert.rejects(verifyLocalTexture(entry,new Uint8Array([1,2,3,5]),webcrypto),/SHA-256 mismatch/);
  await assert.rejects(verifyLocalTexture(entry,new Uint8Array([1,2]),webcrypto),/size mismatch/);
});
test('reject remote paths, data urls, and MIME confusion',async()=>{
  for(const file of ['../a.png','https://host/a.png','data:image/png','a/b.png','a..png','a.svg']) await assert.rejects(verifyLocalTexture({...entry,file},bytes,webcrypto));
  await assert.rejects(verifyLocalTexture({...entry,mime:'image/jpeg'},bytes,webcrypto));
});
test('reject invalid metadata and unknown keys',async()=>{
  for(const patch of [{sha256:'x'}, {bytes:0}, {bytes:1e9}, {constructor:'x'}]) await assert.rejects(verifyLocalTexture({...entry,...patch},bytes,webcrypto));
});
test('reject missing crypto and non-binary input',async()=>{
  await assert.rejects(verifyLocalTexture(entry,bytes,{}),/unavailable/);
  await assert.rejects(verifyLocalTexture(entry,'hello',webcrypto),/binary buffer/);
});
