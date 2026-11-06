const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./nordhafen-raf-probe.js');
const {create:makeTelemetry}=require('./nordhafen-frame-telemetry.js');
function harness(){
 const pending=new Map();let next=0;let visible=true;
 const p=create({telemetry:makeTelemetry(),requestFrame:fn=>{const id=++next;pending.set(id,fn);return id;},cancelFrame:id=>pending.delete(id),isVisible:()=>visible});
 function frame(t){const [id,fn]=pending.entries().next().value;pending.delete(id);fn(t);}
 return {p,pending,frame,hide:()=>{visible=false;},show:()=>{visible=true;}};
}
test('opt-in RAF probe samples actual supplied browser callback timestamps',()=>{
 const h=harness();assert.equal(h.p.start(),true);assert.equal(h.p.start(),false);
 [0,16,32,48].forEach(h.frame);
 const r=h.p.report();
 assert.equal(r.measured,true);assert.equal(r.fps,62.5);
 assert.equal(r.source,'browser-raf-cadence');assert.equal(r.gpuMeasured,false);
 assert.equal(h.p.stop(),true);assert.equal(h.pending.size,0);
});
test('hidden tab and resumed tab never mix stale frame intervals',()=>{
 const h=harness();h.p.start();
 [0,16,32].forEach(h.frame);
 h.hide();h.frame(10000);
 assert.equal(h.p.report().measured,false);
 h.show();[20000,20016,20032].forEach(h.frame);
 assert.equal(h.p.report().fps,62.5);
});
test('stale callbacks after stop cannot restart scheduling',()=>{
 const h=harness();h.p.start();
 const old=h.pending.values().next().value;
 h.p.stop();old(100);
 assert.equal(h.pending.size,0);
 assert.equal(h.p.running,false);
 assert.equal(h.p.stop(),false);
});
test('rejects missing scheduler and telemetry dependencies',()=>{
 assert.throws(()=>create({}),TypeError);
 assert.throws(()=>create({telemetry:makeTelemetry()}),TypeError);
});
