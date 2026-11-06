const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluate,presets}=require('./game-quality-gates.js');
const ok={fps:75,frameP95Ms:16,drawCalls:900,memoryMb:1800,loadSeconds:9};
test('measured desktop budget passes all five checks',()=>{
 const r=evaluate(ok);
 assert.equal(r.pass,true);assert.equal(r.checks.length,5);
 assert.equal(r.schema,'sd-game-quality-gates/v1');
});
test('slow frame or low FPS fails instead of claiming AAA readiness',()=>{
 const r=evaluate({...ok,fps:30,frameP95Ms:40});
 assert.equal(r.pass,false);
 assert.equal(r.checks.filter(x=>!x.pass).length,2);
});
test('missing, fabricated or nonfinite metrics cannot pass',()=>{
 for(const input of [{...ok,fps:NaN},{...ok,drawCalls:Infinity},{...ok,memoryMb:-1},{fps:120}])
   assert.throws(()=>evaluate(input),TypeError);
 assert.throws(()=>evaluate(ok,'imaginary'),RangeError);
});
test('higher refresh preset uses stricter FPS threshold',()=>{
 assert.equal(evaluate(ok,'desktop120').pass,false);
 assert.equal(presets.desktop120.fpsMin,120);
});
