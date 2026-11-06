const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./webgl2-gpu-timer.js');
function fake(){
 const ext={TIME_ELAPSED_EXT:35007,GPU_DISJOINT_EXT:36795};
 let disjoint=false,available=false,ns=1700000,deleted=0,started=0,ended=0;
 const gl={QUERY_RESULT_AVAILABLE:34919,QUERY_RESULT:34918,
  getExtension:name=>name==='EXT_disjoint_timer_query_webgl2'?ext:null,
  createQuery:()=>({}),beginQuery:()=>{started++;},endQuery:()=>{ended++;},
  getQueryParameter:(_q,k)=>k===34919?available:ns,
  getParameter:()=>disjoint,deleteQuery:()=>{deleted++;}
 };
 return {gl,setAvailable:x=>available=x,setDisjoint:x=>disjoint=x,
 setNs:x=>ns=x,stats:()=>({deleted,started,ended})};
}
test('GPU query is asynchronous and measured only when available',()=>{
 const f=fake(),t=create(f.gl);
 assert.equal(t.begin(),true);
 assert.equal(t.begin(),false);
 assert.equal(t.end(),true);
 assert.equal(t.poll().status,'pending');
 f.setAvailable(true);
 assert.deepEqual(t.poll(),{status:'measured',gpuMs:1.7});
 assert.equal(f.stats().deleted,1);
 t.dispose();
});
test('disjoint results never count as GPU timings',()=>{
 const f=fake(),t=create(f.gl);
 t.begin();t.end();f.setDisjoint(true);
 assert.deepEqual(t.poll(),{status:'disjoint',gpuMs:null});
 assert.equal(f.stats().deleted,1);
});
test('invalid query result cannot masquerade as a measurement',()=>{
 const f=fake(),t=create(f.gl);
 t.begin();t.end();f.setAvailable(true);f.setNs(NaN);
 assert.equal(t.poll().status,'invalid');
});
test('disposal releases active and pending queries and is idempotent',()=>{
 const f=fake(),t=create(f.gl);
 t.begin();t.dispose();t.dispose();
 assert.equal(f.stats().deleted,1);
 assert.equal(f.stats().ended,1);
 assert.throws(()=>t.poll(),/disposed/);
});
test('WebGL1 and unavailable extension fail explicitly',()=>{
 assert.throws(()=>create({}),TypeError);
 const f=fake();f.gl.getExtension=()=>null;
 assert.throws(()=>create(f.gl),/unavailable/);
});
