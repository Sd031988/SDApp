/* World-v3 CPU query benchmark. No GPU performance claims or scene writes. */
(function(root,factory){
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDWorldBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function summarize(samples){
if(!Array.isArray(samples)||!samples.length||samples.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0))throw Error('Invalid samples');
const sorted=[...samples].sort((a,b)=>a-b);
function quantile(p){const index=(sorted.length-1)*p,lo=Math.floor(index),hi=Math.ceil(index);return sorted[lo]+(sorted[hi]-sorted[lo])*(index-lo);}
return Object.freeze({count:sorted.length,minMs:sorted[0],p50Ms:quantile(.5),p95Ms:quantile(.95),maxMs:sorted[sorted.length-1]});
}
function benchmark({world,core,positions,iterations=100,warmup=10,radius=1,clock}){
if(!core||typeof core.runtime!=='function'||typeof core.validate!=='function')throw Error('Invalid core');
if(!Number.isSafeInteger(iterations)||iterations<1||iterations>100000||!Number.isSafeInteger(warmup)||warmup<0||warmup>10000)throw Error('Invalid iterations');
if(!Number.isSafeInteger(radius)||radius<0||radius>3)throw Error('Invalid radius');
if(!Array.isArray(positions)||positions.length<1||positions.length>10000||positions.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)))throw Error('Invalid positions');
if(typeof clock!=='function')throw Error('Explicit monotonic clock required');
const scene=core.validate(world),runtime=core.runtime(scene,radius),samples=[];
let totalActive=0,maxActive=0,totalObjects=0;
for(let i=0;i<warmup+iterations;i++){
const point=positions[i%positions.length];
const before=clock(),result=runtime.query(point.x,point.z),after=clock();
if(!Number.isFinite(before)||!Number.isFinite(after)||after<before)throw Error('Invalid clock');
if(i>=warmup){samples.push(after-before);totalActive+=result.activeCells;totalObjects+=result.activeObjects;maxActive=Math.max(maxActive,result.activeCells);}
}
return Object.freeze({kind:'world-v3-cpu-query',iterations,warmup,radius,...summarize(samples),meanActiveCells:totalActive/iterations,maxActiveCells:maxActive,meanActiveObjects:totalObjects/iterations,gpuDrawCalls:null,gpuFrameTimeMs:null});
}
return Object.freeze({summarize,benchmark});
});
