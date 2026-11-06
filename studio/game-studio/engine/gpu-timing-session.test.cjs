'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./gpu-timing-session.js');
const stats=require('./gpu-timing-statistics.js');
test('only measured GPU timer results enter percentile history',()=>{
 const statuses=[
  {status:'pending',gpuMs:null},{status:'disjoint',gpuMs:null},
  {status:'invalid',gpuMs:null},{status:'measured',gpuMs:2},
  {status:'measured',gpuMs:4}
 ];
 let disposed=0;
 const timer={begin:()=>true,end:()=>true,poll:()=>statuses.shift()||{status:'idle',gpuMs:null},dispose:()=>{disposed++;}};
 const session=create({timer,statistics:stats.create({minimum:2})});
 assert.equal(session.begin(),true);assert.equal(session.end(),true);
 for(let i=0;i<5;i++)session.poll();
 assert.deepEqual([session.report().measured,session.report().sampleCount,session.report().gpuP50Ms],[true,2,3]);
 assert.equal(session.report().rejectedCount,0);
 session.dispose();session.dispose();assert.equal(disposed,1);
 assert.throws(()=>session.poll(),/disposed/);
});
test('does not misrepresent insufficient measurements as a pass',()=>{
 const timer={begin:()=>false,end:()=>false,poll:()=>({status:'idle',gpuMs:null}),dispose:()=>{}};
 const session=create({timer,statistics:stats.create({minimum:2})});
 session.poll();
 assert.equal(session.report().measured,false);
 assert.equal(session.report().gpuP95Ms,null);
 session.dispose();
});
test('rejects incomplete adapters without touching a renderer',()=>{
 assert.throws(()=>create({timer:{},statistics:{}}),TypeError);
});
