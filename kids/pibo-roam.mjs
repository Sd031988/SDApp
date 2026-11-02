// Original Pibo garden locomotion: deterministic grid route planning around scene props.
// No borrowed character assets, animation clips or third-party pathfinding code.
const clampWalk=(n,a,b)=>Math.max(a,Math.min(b,n));
const B={xmin:-3.8,xmax:3.8,zmin:-3.15,zmax:.65};
const obstacles=[
  {x:-3.3,z:-2.7,r:.85}, // fruit tree
  {x:2.7,z:-2.3,r:1.35}, // pond
  {x:1.65,z:-3.2,r:.85}, // bench
  {x:-1.15,z:-3.5,r:.65} // windmill
];
const CLEARANCE=.045;
const inside=(x,z)=>x>=B.xmin-1e-7&&x<=B.xmax+1e-7&&z>=B.zmin-1e-7&&z<=B.zmax+1e-7
  &&obstacles.every(o=>Math.hypot(x-o.x,z-o.z)>=o.r+CLEARANCE-1e-7);
function clearSegment(a,b){
  if(!inside(a.x,a.z)||!inside(b.x,b.z))return false;
  const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
  return obstacles.every(o=>{
    const t=den>1e-12?clampWalk(((o.x-a.x)*dx+(o.z-a.z)*dz)/den,0,1):0;
    return Math.hypot(a.x+t*dx-o.x,a.z+t*dz-o.z)>=o.r+CLEARANCE-1e-7;
  });
}
const STEP=.2,NX=39,NZ=20;
const nodes=Array.from({length:NX*NZ},(_,id)=>{
  const x=B.xmin+(id%NX)*STEP,z=B.zmin+Math.floor(id/NX)*STEP;
  return {x,z,valid:inside(x,z)};
});
export function walkablePoint(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))return null;
  const original={x:clampWalk(x,B.xmin,B.xmax),z:clampWalk(z,B.zmin,B.zmax)};
  if(inside(original.x,original.z))return original;
  let p={...original};
  for(let iteration=0;iteration<10;iteration++){
    for(const o of obstacles){
      const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz),radius=o.r+CLEARANCE+.02;
      if(d<radius){
        const nx=d>1e-9?dx/d:1,nz=d>1e-9?dz/d:0;
        p={x:clampWalk(o.x+nx*radius,B.xmin,B.xmax),z:clampWalk(o.z+nz*radius,B.zmin,B.zmax)};
      }
    }
    if(inside(p.x,p.z))return p;
  }
  // A blocked boundary corner cannot always be fixed by radial projection.
  let best=null,score=Infinity;
  for(const n of nodes)if(n.valid){
    const d=Math.hypot(n.x-original.x,n.z-original.z);
    if(d<score){score=d;best=n}
  }
  return best?{x:best.x,z:best.z}:null;
}
function nearestVisible(point){
  let best=-1,score=Infinity;
  for(let i=0;i<nodes.length;i++){
    const n=nodes[i];if(!n.valid)continue;
    const d=Math.hypot(n.x-point.x,n.z-point.z);
    if(d<score&&clearSegment(point,n)){best=i;score=d}
  }
  return best;
}
function route(start,goal){
  if(clearSegment(start,goal))return [{...goal}];
  const first=nearestVisible(start),last=nearestVisible(goal);
  if(first<0||last<0)return null;
  const cost=new Float64Array(nodes.length).fill(Infinity);
  const prev=new Int32Array(nodes.length).fill(-1);
  const closed=new Uint8Array(nodes.length),open=[first];cost[first]=0;
  const heuristic=i=>Math.hypot(nodes[i].x-nodes[last].x,nodes[i].z-nodes[last].z);
  while(open.length){
    let best=0,bestScore=Infinity;
    for(let j=0;j<open.length;j++){const score=cost[open[j]]+heuristic(open[j]);if(score<bestScore){bestScore=score;best=j}}
    const id=open.splice(best,1)[0];if(closed[id])continue;
    if(id===last)break;
    closed[id]=1;
    const ix=id%NX,iz=Math.floor(id/NX);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dz)continue;
      const x=ix+dx,z=iz+dz;
      if(x<0||x>=NX||z<0||z>=NZ)continue;
      const next=z*NX+x;
      if(closed[next]||!nodes[next].valid||!clearSegment(nodes[id],nodes[next]))continue;
      const nextCost=cost[id]+Math.hypot(dx,dz)*STEP;
      if(nextCost<cost[next]){
        cost[next]=nextCost;prev[next]=id;
        if(!open.includes(next))open.push(next);
      }
    }
  }
  if(!Number.isFinite(cost[last]))return null;
  const raw=[];
  for(let id=last;id!==-1;id=prev[id])raw.push({x:nodes[id].x,z:nodes[id].z});
  raw.reverse();raw.push({...goal});
  const smooth=[];let anchor=start;
  for(let i=0;i<raw.length;){
    let far=i;
    for(let j=i+1;j<raw.length;j++)if(clearSegment(anchor,raw[j]))far=j;
    const waypoint=raw[far];
    smooth.push(waypoint);anchor=waypoint;i=far+1;
  }
  return smooth;
}
// Original procedural gait, phase-locked to actual travel rather than wall-clock time.
export function gardenGait(distance,speed,turnRate=0,reducedMotion=false){
  const phase=(Number.isFinite(distance)?Math.max(0,distance):0)*11.5;
  const weight=clampWalk(Number.isFinite(speed)?speed/1.2:0,0,1)*(reducedMotion?.3:1);
  const lift=a=>.16*weight*Math.pow(Math.max(0,Math.sin(a)),1.4);
  const reach=a=>.085*weight*Math.cos(a);
  const left=phase,right=phase+Math.PI;
  const turn=clampWalk(Number.isFinite(turnRate)?turnRate:0,-4,4)*weight;
  return {frontLift:[lift(left),lift(right)],hindLift:[lift(right),lift(left)],
    frontReach:[reach(left),reach(right)],hindReach:[reach(right),reach(left)],
    bob:.009*weight*(1-Math.cos(phase*2)),roll:-.016*turn,headYaw:.025*turn};
}
export class PiboRoam{
  constructor(){this.reset()}
  reset(){this.x=0;this.z=0;this.targetX=0;this.targetZ=0;this.heading=0;this.speed=0;this.moving=false;this.path=[];this.distance=0;this.turnRate=0}
  setTarget(x,z){
    const goal=walkablePoint(x,z);
    if(!goal)return false;
    const path=route({x:this.x,z:this.z},goal);
    if(!path)return false;
    this.targetX=goal.x;this.targetZ=goal.z;
    this.path=path;
    this.moving=Math.hypot(this.targetX-this.x,this.targetZ-this.z)>.035;
    if(!this.moving)this.path=[];
    return true;
  }
  update(deltaSeconds){
    const dt=clampWalk(Number.isFinite(deltaSeconds)?deltaSeconds:0,0,.05);
    if(!dt)return this.pose();
    if(!this.moving){
      this.speed=Math.max(0,this.speed-4*dt);
      this.turnRate*=Math.max(0,1-8*dt);
      return this.pose();
    }
    // A planned waypoint path never walks through the tree, pond or furniture.
    while(this.path.length&&Math.hypot(this.path[0].x-this.x,this.path[0].z-this.z)<.04)this.path.shift();
    const waypoint=this.path[0];
    if(!waypoint){this.moving=false;this.speed=0;return this.pose()}
    const dx=waypoint.x-this.x,dz=waypoint.z-this.z,dist=Math.hypot(dx,dz);
    const remaining=Math.hypot(this.targetX-this.x,this.targetZ-this.z);
    this.speed=Math.min(1.75,this.speed+4.5*dt,Math.sqrt(Math.max(0,2*3.5*remaining)));
    const step=Math.min(dist,this.speed*dt);
    if(dist>1e-9&&step>0){
      const next={x:this.x+dx/dist*step,z:this.z+dz/dist*step};
      if(clearSegment({x:this.x,z:this.z},next)){
        this.x=next.x;this.z=next.z;this.distance+=step; // Only actual travel advances footfall phase.
      }else{
        // Fail closed rather than passing through a collider on a bad route.
        this.path=route({x:this.x,z:this.z},{x:this.targetX,z:this.targetZ})||[];
        this.speed=0;
      }
      const desired=Math.atan2(dx,dz);
      const turn=Math.atan2(Math.sin(desired-this.heading),Math.cos(desired-this.heading));
      const headingStep=turn*Math.min(1,dt*8);
      this.heading+=headingStep;this.turnRate=headingStep/dt;
    }
    if(Math.hypot(this.targetX-this.x,this.targetZ-this.z)<=.04){
      this.x=this.targetX;this.z=this.targetZ;this.moving=false;this.path=[]; // Keep speed briefly to blend into rest.
    }
    return this.pose();
  }
  pose(){return {x:this.x,z:this.z,heading:this.heading,moving:this.moving}}
}
