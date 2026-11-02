import assert from 'node:assert/strict';
import {PiboRoam,walkablePoint,gardenGait} from './pibo-roam.mjs';
const obstacles=[{x:-3.3,z:-2.7,r:.85},{x:2.7,z:-2.3,r:1.35},{x:1.65,z:-3.2,r:.85},{x:-1.15,z:-3.5,r:.65}];
function safe(p){
 assert(p.x>=-3.80001&&p.x<=3.80001&&p.z>=-3.15001&&p.z<=.65001,'Garden boundary');
 for(const o of obstacles)assert(Math.hypot(p.x-o.x,p.z-o.z)>=o.r+.04,'No obstacle penetration');
}
const r=new PiboRoam();
assert.equal(r.setTarget(Infinity,0),false);
assert.equal(r.setTarget(2,-1),true);
let p=r.update(1);assert(Math.hypot(p.x,p.z)<.09,'Clamp resumed tab frame');
for(let i=0;i<200;i++){p=r.update(1/60);safe(p)}
assert(p.x>1.5&&p.z<-.7&&!p.moving,'Reach open target');
r.reset();assert.deepEqual(r.pose(),{x:0,z:0,heading:0,moving:false});
assert.equal(r.setTarget(-3.3,-2.7),true);
safe(walkablePoint(-3.3,-2.7));
for(let i=0;i<600;i++){p=r.update(1/60);safe(p)}
assert.equal(p.moving,false,'Reach projected tree target');
r.reset();
assert(r.setTarget(3.5,-2.9),'Plan route behind pond');
assert(r.path.length>=2,'A detour needs intermediate waypoints');
let maxFrames=0;
for(;maxFrames<1000&&r.moving;maxFrames++){p=r.update(1/60);safe(p)}
assert(!r.moving,'Must finish route around pond, not orbit or stall');
assert(Math.hypot(p.x-r.targetX,p.z-r.targetZ)<.045,'Arrive at detour destination');
assert(maxFrames<800,'Reasonable route duration');
r.reset();
for(const target of [[-3.8,-3.15],[3.8,-3.15],[-3.5,-2.9],[2.7,-2.3],[1.65,-3.2],[-1.15,-3.5],[3.8,.65],[-3.8,.65]]){
 assert(r.setTarget(...target),'Every garden tap has a reachable safe projection');
 for(let i=0;i<1000&&r.moving;i++){p=r.update(1/60);safe(p)}
 assert(!r.moving,'No stuck route to '+target);
}
r.setTarget(99,-99);assert(r.targetX<=3.8&&r.targetZ>=-3.15);
r.reset();assert.equal(r.speed,0);assert.equal(r.path.length,0);
const stride=new PiboRoam();
assert(stride.setTarget(1,0));stride.update(1/60);
assert(stride.distance>0,'Walking accumulates real distance');
const walked=stride.distance,gait=gardenGait(walked,stride.speed,stride.turnRate);
assert(Math.abs(gait.frontLift[0]-gait.hindLift[1])<1e-10,'Diagonal pair left');
assert(Math.abs(gait.frontLift[1]-gait.hindLift[0])<1e-10,'Diagonal pair right');
assert.deepEqual(gardenGait(walked,0).frontLift,[0,0],'No walking in place');
assert.deepEqual(gardenGait(walked,0).frontReach,[0,0],'No sliding in place');
const reduced=gardenGait(walked,stride.speed,stride.turnRate,true);
assert(reduced.frontLift.every((v,i)=>v<=gait.frontLift[i]),'Reduced motion');
assert(Number.isFinite(gardenGait(NaN,Infinity,NaN).bob),'Invalid numbers clamped');
stride.update(0);assert.equal(stride.distance,walked,'Paused frame');
stride.update(1);assert(stride.distance-walked<=.09,'Clamped resume');
stride.reset();assert.equal(stride.distance,0);assert.equal(stride.turnRate,0);
console.log('PASS: Pibo garden A* detours, 8 hard targets, obstacle clearance, bounded frames and distance-driven diagonal gait');
