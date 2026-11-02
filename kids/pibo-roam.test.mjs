import assert from 'node:assert/strict';
import {PiboRoam,walkablePoint} from './pibo-roam.mjs';
const r=new PiboRoam();
assert.equal(r.setTarget(Infinity,0),false,'Reject non-finite pointer coordinates');
assert.equal(r.setTarget(2,-1),true);
let p=r.update(1);
assert(Math.hypot(p.x,p.z)<.09,'Tab-resume delta must be clamped');
for(let i=0;i<200;i++)p=r.update(1/60);
assert(p.x>1.5&&p.z<-.7,'Cat reaches reachable garden target');
assert.equal(p.moving,false,'Walk ends at destination');
r.reset();assert.deepEqual(r.pose(),{x:0,z:0,heading:0,moving:false});
assert.equal(r.setTarget(-3.3,-2.7),true);
const target=walkablePoint(-3.3,-2.7);
assert(Math.hypot(target.x+3.3,target.z+2.7)>=.849,'Tree trunk is excluded');
for(let i=0;i<600;i++){p=r.update(1/60);assert(p.x>=-3.801&&p.x<=3.801&&p.z>=-3.151&&p.z<=.651,'Stay in meadow');assert(Math.hypot(p.x+3.3,p.z+2.7)>=.82,'No trunk penetration')}
r.setTarget(99,-99);assert(r.targetX<=3.8&&r.targetZ>=-3.15,'Touch targets stay bounded');
console.log('PASS: original Pibo garden tap-to-walk, steering, bounds, frame clamping and reset');
