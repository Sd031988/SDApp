const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./nordhafen-babylon-session-bridge.js');
function harness(){
 const listeners=new Set();
 const engine={onEndFrameObservable:{
  add(fn){listeners.add(fn);return fn;},
  remove(fn){listeners.delete(fn);}
 }};
 let time=0;
 return {engine,listeners,advance(ms){time+=ms;for(const fn of [...listeners])fn();},now:()=>time};
}
test('wires Babylon end-frame to real session without automatic start',()=>{
 const h=harness(),bridge=create({engine:h.engine,now:h.now});
 assert.equal(h.listeners.size,0);
 assert.equal(bridge.report().frame.measured,false);
 assert.equal(bridge.start(),true);
 for(let i=0;i<6;i++)h.advance(16);
 const r=bridge.report();
 assert.equal(r.frame.measured,true);
 assert.equal(r.frame.sampleCount,5);
 assert.equal(r.frame.fps,62.5);
 assert.equal(r.qualityEvaluated,false);
 assert.equal(r.gpuMeasured,false);
 assert.equal(bridge.stop(),true);
 assert.equal(h.listeners.size,0);
});
test('quality requires independent metrics and does not invent GPU measurements',()=>{
 const h=harness(),bridge=create({engine:h.engine,now:h.now});
 bridge.start();
 for(let i=0;i<6;i++)h.advance(16);
 bridge.supplyMeasuredMetrics({drawCalls:500,memoryMb:900,loadSeconds:4});
 const r=bridge.report();
 assert.equal(r.qualityEvaluated,true);
 assert.equal(r.quality.pass,true);
 assert.equal(r.gpuMeasured,false);
 bridge.stop();
});
test('hidden tab resets stale frame and independent metrics',()=>{
 const h=harness();let visible=true;
 const bridge=create({engine:h.engine,now:h.now,isVisible:()=>visible});
 bridge.start();
 for(let i=0;i<6;i++)h.advance(16);
 bridge.supplyMeasuredMetrics({drawCalls:500,memoryMb:900,loadSeconds:4});
 visible=false;h.advance(10000);
 visible=true;h.advance(16);
 assert.equal(bridge.report().frame.measured,false);
 assert.equal(bridge.report().independentMetricsSupplied,false);
 bridge.stop();
});
test('stop detaches observer and prevents further measurements',()=>{
 const h=harness(),bridge=create({engine:h.engine,now:h.now});
 bridge.start();for(let i=0;i<4;i++)h.advance(16);
 bridge.stop();const n=bridge.report().frame.sampleCount;
 h.advance(100);
 assert.equal(bridge.report().frame.sampleCount,n);
 assert.equal(bridge.running,false);
});
