'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {audit,MODES}=require('./nordhafen-comparison-audit.js');
function runs(){
 return MODES.map(mode=>({mode,profile:'small',routeId:'seed-1337:snake-v1',
  summary:{complete:true,samples:50,drawCallsP50:10,drawCallsP95:15,drawCallsMax:20,
   heapP50:1000,heapMax:2000}}));
}
test('three complete runs on same route and profile are comparable',()=>{
 const result=audit(runs());
 assert.equal(result.comparable,true);
 assert.equal(result.failures.length,0);
 assert.equal(result.values['Streaming + LOD'].drawCallsP95,15);
});
test('missing hardware metric is preserved as null rather than zero',()=>{
 const data=runs();data[1].summary.drawCallsP95=null;
 const result=audit(data);
 assert.equal(result.comparable,true);
 assert.equal(result.values.Streaming.drawCallsP95,null);
});
test('reject incomplete, empty or mismatched route/profile',()=>{
 const data=runs();data[0].summary.complete=false;data[1].routeId='other';
 data[2].profile='medium';
 const result=audit(data);
 assert.equal(result.comparable,false);
 assert.equal(result.values,null);
 assert.ok(result.failures.some(x=>x.includes('incomplete')));
 assert.ok(result.failures.some(x=>x.includes('route mismatch')));
 assert.ok(result.failures.some(x=>x.includes('profile mismatch')));
});
test('reject duplicate mode and invalid metrics instead of inventing results',()=>{
 const data=runs();data[1].mode=data[0].mode;data[2].summary.heapP50=NaN;
 const result=audit(data);
 assert.equal(result.comparable,false);
 assert.ok(result.failures.some(x=>x.includes('duplicate')));
 assert.ok(result.failures.some(x=>x.includes('invalid heapP50')));
});
test('reject impossible percentile ordering',()=>{
 const data=runs();data[0].summary.drawCallsP95=21;
 assert.ok(audit(data).failures.some(x=>x.includes('draw max order')));
});
