'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {identify}=require('./nordhafen-route-identity.js');
const config=()=>({profile:'small',seed:1337,chunkSize:64,route:[{x:0,z:0},{x:1,z:0},{x:1,z:1}]});
test('same benchmark route produces stable canonical identity',()=>{
 const a=config(),b=config();
 assert.equal(identify(a),identify(b));
 assert.equal(JSON.parse(identify(a))[0],'sd-route-v1');
});
test('different traversal order, profile, seed or chunk size cannot silently compare',()=>{
 const original=identify(config());
 for(const variant of [
  {...config(),route:[...config().route].reverse()},
  {...config(),profile:'medium'},
  {...config(),seed:1338},
  {...config(),chunkSize:32},
  {...config(),route:[{x:0,z:0},{x:1,z:0}]}
 ])assert.notEqual(identify(variant),original);
});
test('reject missing, malformed, duplicate and nonfinite route points',()=>{
 for(const variant of [
  {...config(),route:[]},
  {...config(),route:[{x:0,z:0},{x:0,z:0}]},
  {...config(),route:[{x:NaN,z:0}]},
  {...config(),route:[{x:0.5,z:0}]},
  {...config(),route:[{x:0,z:Infinity}]},
  {...config(),seed:Infinity},
  {...config(),chunkSize:0},
  {...config(),profile:''}
 ])assert.throws(()=>identify(variant),TypeError);
});
test('prototype pollution keys cannot influence canonical route',()=>{
 const a=config(),b=config();
 b.route[0]=Object.assign(Object.create(null),{x:0,z:0});
 assert.equal(identify(a),identify(b));
});
test('route identity is compatible with completed comparison audit contract',()=>{
 const {audit,MODES}=require('./nordhafen-comparison-audit.js');
 const routeId=identify(config());
 const summary={complete:true,samples:4,drawCallsP50:2,drawCallsP95:3,drawCallsMax:3,heapP50:null,heapMax:null};
 const runs=MODES.map(mode=>({mode,profile:'small',routeId,summary}));
 assert.equal(audit(runs).comparable,true);
 runs[2]={...runs[2],routeId:identify({...config(),route:[...config().route].reverse()})};
 assert.equal(audit(runs).comparable,false);
});
