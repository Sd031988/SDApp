'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {run}=require('./nordhafen-build-slices.js');
test('cooperative cell build keeps each measured slice within 4ms with mock clock',async()=>{
 let t=0,frames=0;const slices=[],built=[];
 await run(Array.from({length:20},(_,i)=>i),value=>{built.push(value);t+=.8;},
  {now:()=>t,nextFrame:async()=>{frames++;},budgetMs:4,recordSlice:ms=>slices.push(ms)});
 assert.equal(built.length,20);assert.ok(frames>0);
 assert.ok(slices.every(ms=>ms<=4.00001),'each slice <=4ms: '+slices);
});
test('cooperative cell build stops when signal aborted between frames',async()=>{
 let t=0,abort=false;
 await assert.rejects(run([1,2,3,4],()=>{t+=2;},{now:()=>t,budgetMs:4,
  signal:{get aborted(){return abort;}},nextFrame:async()=>{abort=true;}}),/aborted/);
});
