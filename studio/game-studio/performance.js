/* SD Game-Studio performance measurement and read-only benchmark scenes.
 * Neither profiler nor benchmark touches storage, network, or an imported project. */
(function(root,factory){
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDGamePerformance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CASES=Object.freeze({
forest:'Dichter Wald',interior:'Innenraum / Architektur',open:'Offene Landschaft'
});
function createProfiler(capacity=180){
if(!Number.isSafeInteger(capacity)||capacity<10||capacity>2000)throw Error('Ungültige Messfenstergröße.');
let samples=[],lastCalls=0,lastObjects=0,lastRender=0;
function record(frameMs,drawCalls,objects,renderMs=0){
if(!Number.isFinite(frameMs)||frameMs<=0||frameMs>2000)return false;
if(!Number.isSafeInteger(drawCalls)||drawCalls<0||!Number.isSafeInteger(objects)||objects<0||
!Number.isFinite(renderMs)||renderMs<0)return false;
samples.push(frameMs);
if(samples.length>capacity)samples.shift();
lastCalls=drawCalls;lastObjects=objects;lastRender=renderMs;
return true;
}
function snapshot(){
const values=samples.slice().sort((a,b)=>a-b),length=values.length;
const at=q=>length?values[Math.max(0,Math.ceil(q*length)-1)]:0;
const median=at(.5);
return Object.freeze({
frames:length,medianMs:median,p95Ms:at(.95),fps:median?1000/median:0,
slowFrames:samples.filter(v=>v>33.4).length,
drawCalls:lastCalls,objects:lastObjects,renderCpuMs:lastRender
});
}
return Object.freeze({record,snapshot,reset(){samples=[];lastCalls=0;lastObjects=0;lastRender=0;}});
}
function createBenchmark(core,kind){
if(!Object.prototype.hasOwnProperty.call(CASES,kind))throw Error('Unbekannte Testszene.');
if(!core||typeof core.fresh!=='function'||typeof core.add!=='function'||typeof core.update!=='function'||
typeof core.validate!=='function')throw Error('Ungültige Szenenlogik.');
const world=core.fresh();
world.name='Benchmark · '+CASES[kind];
world.objects=[];
world.ground=kind==='open'?'sand':'meadow';
world.lighting=kind==='interior'?'sunset':'day';
const colors=core.PALETTE;
function put(type,x,z,index,scale=1){
const o=core.add(world,type,x,z);
core.update(world,o.id,{scale,color:colors[index%colors.length]});
}
if(kind==='forest'){
for(let row=0;row<9;row++)for(let col=0;col<7;col++){
const type=(row+col)%5===0?'bush':(row+2*col)%3===0?'pine':'tree';
put(type,Math.round((-16+col*5)*10)/10,Math.round((-16+row*4)*10)/10,row+col,
 .65+((row*7+col*3)%8)*.12);
}
}else if(kind==='interior'){
for(let row=0;row<8;row++)for(let col=0;col<8;col++){
const edge=row===0||row===7||col===0||col===7;
put(edge?'column':((row+col)%3===0?'sphere':'box'),-14+col*4,-14+row*4,row*8+col,
 .55+((row+col)%4)*.17);
}
}else{
for(let row=0;row<6;row++)for(let col=0;col<8;col++){
const type=(row+col)%3===0?'hill':'rock';
put(type,-16+col*4.5,-14+row*5.5,row*8+col,.7+((row*3+col)%6)*.14);
}
for(const [x,z] of [[-9,-7],[0,0],[9,9]])for(let step=0;step<3;step++)core.sculpt(world,'raise',x,z,7,.7);
}
return core.validate(world);
}
return Object.freeze({CASES,createProfiler,createBenchmark});
});
