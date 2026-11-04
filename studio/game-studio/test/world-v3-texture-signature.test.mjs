import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLocalTextureSignature as inspect} from '../world-v3-texture-signature.mjs';
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1]);
const webp=Uint8Array.from([82,73,70,70,8,0,0,0,87,69,66,80,86,80,56,32]);
const avif=Uint8Array.from([0,0,0,20,102,116,121,112,97,118,105,102,0,0,0,0,109,105,102,49]);
const jxl=Uint8Array.from([0,0,0,12,74,88,76,32,13,10,135,10]);
test('valid signatures with explicit MIME',()=>{
 for(const [b,mime] of [[png,'image/png'],[webp,'image/webp'],[avif,'image/avif'],[jxl,'image/jxl'],[Uint8Array.from([255,10,0,0]),'image/jxl'],[Uint8Array.from([255,216,255,224]),'image/jpeg']])assert.equal(inspect(b,mime).signatureMatched,true);
});
test('reject mismatches, unknown types, malformed data',()=>{
 assert.throws(()=>inspect(png,'image/jpeg'));assert.throws(()=>inspect(png,'image/svg+xml'));
 assert.throws(()=>inspect('text','image/png'));assert.throws(()=>inspect(new Uint8Array(2),'image/jpeg'));
});
test('respect view byteOffset',()=>{
 const buf=new Uint8Array(png.length+3);buf.set(png,2);
 assert.equal(inspect(buf.subarray(2,2+png.length),'image/png').byteLength,png.length);
});
test('reject RIFF length forgery and AVIF minor-version false positive',()=>{
 const corrupt=webp.slice();corrupt[4]=9;assert.throws(()=>inspect(corrupt,'image/webp'));
 const bad=avif.slice();bad.set([109,105,102,49],8);bad.set([97,118,105,102],12);bad.set([109,105,102,49],16);
 assert.throws(()=>inspect(bad,'image/avif'));
});
test('input preserved and output frozen',()=>{
 const before=png.slice();const r=inspect(png,'image/png');assert.deepEqual(png,before);assert.ok(Object.isFrozen(r));
});
