const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeMaterial}=require('../world-v3-pbr-material.js');
test('glTF metallic roughness defaults are deterministic and immutable',()=>{
  const a=normalizeMaterial({});assert.equal(a.metallicFactor,1);assert.equal(a.roughnessFactor,1);
  assert.deepEqual(a.baseColorFactor,[1,1,1,1]);assert.ok(Object.isFrozen(a));assert.ok(Object.isFrozen(a.baseColorFactor));
});
test('valid texture slots, alpha and double-sided preserve input',()=>{
  const src={pbrMetallicRoughness:{baseColorTexture:{index:2},metallicRoughnessTexture:{index:0,texCoord:1},roughnessFactor:0.2},normalTexture:{index:2},alphaMode:'MASK',doubleSided:true};
  const before=JSON.stringify(src);const a=normalizeMaterial(src,3);
  assert.deepEqual(a.referencedTextureIndices,[0,2]);assert.equal(a.alphaMode,'MASK');assert.equal(a.doubleSided,true);assert.equal(JSON.stringify(src),before);
});
test('rejects invalid numeric ranges and nonfinite values',()=>{
  for(const v of [-1,1.01,NaN,Infinity,'0.5'])assert.throws(()=>normalizeMaterial({pbrMetallicRoughness:{metallicFactor:v}}),TypeError);
  assert.throws(()=>normalizeMaterial({emissiveFactor:[0,0,Infinity]}),TypeError);
});
test('rejects untrusted keys, prototype pollution, and unsupported extensions',()=>{
  assert.throws(()=>normalizeMaterial(JSON.parse('{"__proto__":{"admin":true}}')),TypeError);
  assert.throws(()=>normalizeMaterial({extensions:{KHR_materials_unlit:{}}}),TypeError);
  assert.throws(()=>normalizeMaterial({pbrMetallicRoughness:{__proto__:null,unknown:1}}),TypeError);
});
test('rejects out of bounds texture references and unsupported texCoord',()=>{
  assert.throws(()=>normalizeMaterial({normalTexture:{index:1}},1),TypeError);
  assert.throws(()=>normalizeMaterial({normalTexture:{index:0,texCoord:2}},1),TypeError);
  assert.throws(()=>normalizeMaterial({normalTexture:{index:0,uri:'https://example.org/x'}},1),TypeError);
});
test('rejects invalid alpha, booleans, names, and invalid texture count',()=>{
  assert.throws(()=>normalizeMaterial({alphaMode:'UNKNOWN'}),TypeError);
  assert.throws(()=>normalizeMaterial({doubleSided:1}),TypeError);
  assert.throws(()=>normalizeMaterial({name:'bad\u0000name'}),TypeError);
  assert.throws(()=>normalizeMaterial({},-1),TypeError);
});
