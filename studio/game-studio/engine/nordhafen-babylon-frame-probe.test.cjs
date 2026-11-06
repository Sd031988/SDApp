const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./nordhafen-babylon-frame-probe.js');
const telemetryModule=require('./nordhafen-frame-telemetry.js');
function harness(){
 const listeners=new Set();
 const observable={add(fn){listeners.add(fn);return fn;},remove(fn){listeners.delete(fn);return true;}};
 let time=0,visible=true;
 const probe=create({engine:{onEndFrameObservable:observable},
  telemetry:telemetryModule.create(),now:()=>time,isVisible:()=>visible});
 return {probe,emit(t){time=t;for(const fn of [...listeners])fn();},
  visibility(v){visible=v;},listeners};
}
test('Babylon end-frame callbacks produce labelled cadence metrics',()=>{
 const h=harness();assert.equal(h.probe.start(),true);
 [0,16,32,48].forEach(t=>h.emit(t));
 const r=h.probe.report();
 assert.equal(r.measured,true);assert.equal(r.fps,62.5);
 assert.equal(r.source,'babylon-end-frame-cadence');
 assert.equal(r.gpuMeasured,false);
 assert.equal(r.renderLoopInstrumented,true);
 h.probe.stop();assert.equal(h.listeners.size,0);
});
test('tab visibility resets prevent hidden time from corrupting cadence',()=>{
 const h=harness();h.probe.start();
 [0,16,32].forEach(t=>h.emit(t));
 h.visibility(false);h.emit(5000);
 h.visibility(true);h.emit(6000);
 assert.equal(h.probe.report().measured,false);
 h.emit(6016);h.emit(6032);
 assert.equal(h.probe.report().fps,62.5);
 h.probe.stop();
});
test('start/stop idempotence and old callbacks never sample',()=>{
 const h=harness();h.probe.start();
 const old=[...h.listeners][0];
 assert.equal(h.probe.start(),false);
 h.probe.stop();assert.equal(h.probe.stop(),false);
 old();assert.equal(h.probe.report().sampleCount,0);
 h.probe.start();old();assert.equal(h.probe.report().sampleCount,0);
 h.probe.stop();
});
test('invalid Babylon adapter dependencies fail closed',()=>{
 const t=telemetryModule.create();
 assert.throws(()=>create({engine:{},telemetry:t,now:()=>0}),TypeError);
 assert.throws(()=>create({engine:{onEndFrameObservable:{add(){},remove(){}}},telemetry:t}),TypeError);
});
