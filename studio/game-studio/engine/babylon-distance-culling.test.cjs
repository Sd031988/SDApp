const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./babylon-distance-culling.js');
function mesh(x,enabled=true){
 let on=enabled;const calls=[];
 return {calls,isEnabled:()=>on,setEnabled:v=>{on=v;calls.push(v);},getAbsolutePosition:()=>({x,y:0,z:0})};
}
test('registered Babylon mesh is culled and restored with hysteresis',()=>{
 const c=create({near:10,far:20}),m=mesh(30);
 assert.equal(c.register(m),true);assert.equal(m.isEnabled(),true);
 assert.equal(c.update({x:0,y:0,z:0}).culled,1);
 assert.equal(m.isEnabled(),false);
 assert.equal(c.update({x:15,y:0,z:0}).visible,0);
 assert.equal(c.update({x:25,y:0,z:0}).visible,1);
 assert.equal(m.isEnabled(),true);
 c.dispose();assert.equal(c.size,0);
});
test('never enables a mesh initially disabled by other systems',()=>{
 const c=create(),m=mesh(1000,false);
 c.register(m);c.update({x:0,y:0,z:0});c.dispose();
 assert.deepEqual(m.calls,[]);
});
test('dispose restores meshes hidden by this culler',()=>{
 const c=create({near:1,far:2}),m=mesh(100);
 c.register(m);c.update({x:0,y:0,z:0});c.dispose();
 assert.deepEqual(m.calls,[false,true]);
});
test('rejects invalid inputs and does not traverse scenes',()=>{
 assert.throws(()=>create({near:10,far:10}),RangeError);
 const c=create();
 assert.throws(()=>c.register({}),TypeError);
 assert.throws(()=>c.update({x:NaN,y:0,z:0}),TypeError);
 const m=mesh(1);assert.equal(c.register(m),true);assert.equal(c.register(m),false);
 assert.equal(c.unregister(m),true);assert.equal(c.unregister(m),false);
});
