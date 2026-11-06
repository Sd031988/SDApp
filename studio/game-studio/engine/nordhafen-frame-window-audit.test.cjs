'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {audit}=require('./nordhafen-frame-window-audit.js');
const f=(timestampMs,routeStep,drawCalls=null,heapBytes=null)=>({timestampMs,routeStep,drawCalls,heapBytes});
test('valid complete route permits multiple frames per step and absent hardware metrics',()=>{
 const r=audit([f(1,0,5,null),f(2,0,null,100),f(3,1,7,200)],{expectedRouteSteps:2});
 assert.equal(r.valid,true);assert.equal(r.complete,true);
 assert.equal(r.drawSamples,2);assert.equal(r.heapSamples,2);
});
test('unfinished route never becomes a valid complete run',()=>{
 const r=audit([f(1,0,1,1)],{expectedRouteSteps:3});
 assert.equal(r.complete,false);assert.ok(r.errors.includes('route incomplete'));
});
test('duplicate or backward frame timestamps rejected',()=>{
 assert.equal(audit([f(1,0),f(1,1)],{expectedRouteSteps:2}).valid,false);
 assert.equal(audit([f(2,0),f(1,1)],{expectedRouteSteps:2}).valid,false);
});
test('skipped or backwards route steps rejected',()=>{
 assert.equal(audit([f(1,0),f(2,2)],{expectedRouteSteps:3}).valid,false);
 assert.equal(audit([f(1,0),f(2,1),f(3,0)],{expectedRouteSteps:2}).valid,false);
});
test('invalid metrics rejected; null values never become zero',()=>{
 const r=audit([f(1,0,null,null),f(2,1,-1,Infinity)],{expectedRouteSteps:2});
 assert.equal(r.valid,false);assert.equal(r.drawSamples,0);assert.equal(r.heapSamples,0);
});
test('malformed input and empty frames fail closed',()=>{
 assert.throws(()=>audit([],{expectedRouteSteps:0}),/required/);
 assert.equal(audit([],{expectedRouteSteps:1}).complete,false);
 assert.equal(audit([null],{expectedRouteSteps:1}).valid,false);
});
