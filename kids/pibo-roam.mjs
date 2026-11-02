// Original Pibo garden locomotion. No borrowed game assets or animation clips.
// The character stays inside the meadow and steers around large props.
const clampWalk=(n,a,b)=>Math.max(a,Math.min(b,n));
const obstacles=[
  {x:-3.3,z:-2.7,r:.85}, // fruit tree
  {x:2.7,z:-2.3,r:1.35}, // pond
  {x:1.65,z:-3.2,r:.85}, // bench
  {x:-1.15,z:-3.5,r:.65} // windmill
];
export function walkablePoint(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))return null;
  let p={x:clampWalk(x,-3.8,3.8),z:clampWalk(z,-3.15,.65)};
  for(const o of obstacles){
    const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz);
    if(d<o.r){
      const nx=d>.0001?dx/d:1,nz=d>.0001?dz/d:0;
      p={x:clampWalk(o.x+nx*o.r,-3.8,3.8),z:clampWalk(o.z+nz*o.r,-3.15,.65)};
    }
  }
  return p;
}
export class PiboRoam{
  constructor(){this.reset()}
  reset(){this.x=0;this.z=0;this.targetX=0;this.targetZ=0;this.heading=0;this.moving=false}
  setTarget(x,z){
    const p=walkablePoint(x,z);
    if(!p)return false;
    this.targetX=p.x;this.targetZ=p.z;
    this.moving=Math.hypot(this.targetX-this.x,this.targetZ-this.z)>.04;
    return true;
  }
  update(deltaSeconds){
    const dt=clampWalk(Number.isFinite(deltaSeconds)?deltaSeconds:0,0,.05);
    const dx=this.targetX-this.x,dz=this.targetZ-this.z,dist=Math.hypot(dx,dz);
    if(dist<=.035||dt===0){if(dist<=.035)this.moving=false;return this.pose()}
    const step=Math.min(dist,1.75*dt);
    let nextX=this.x+dx/dist*step,nextZ=this.z+dz/dist*step;
    // A tangential step avoids moving through the trunk, pond or furniture.
    for(const o of obstacles){
      const vx=nextX-o.x,vz=nextZ-o.z;
      if(Math.hypot(vx,vz)<o.r){
        const ox=this.x-o.x,oz=this.z-o.z,od=Math.hypot(ox,oz)||1;
        let tx=-oz/od,tz=ox/od;
        if(tx*dx+tz*dz<0){tx=-tx;tz=-tz}
        nextX=this.x+tx*step;nextZ=this.z+tz*step;
        break;
      }
    }
    const safe=walkablePoint(nextX,nextZ);
    // Clamp movement per frame: browser tab resume cannot teleport the cat.
    const movedX=safe.x-this.x,movedZ=safe.z-this.z,moved=Math.hypot(movedX,movedZ);
    if(moved>step&&moved>0){this.x+=movedX/moved*step;this.z+=movedZ/moved*step}
    else{this.x=safe.x;this.z=safe.z}
    const desired=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(desired-this.heading),Math.cos(desired-this.heading));
    this.heading+=turn*Math.min(1,dt*8);
    this.moving=Math.hypot(this.targetX-this.x,this.targetZ-this.z)>.04;
    return this.pose();
  }
  pose(){return {x:this.x,z:this.z,heading:this.heading,moving:this.moving}}
}
