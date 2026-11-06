/* Deterministic, Babylon-independent third-person movement contract. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenPlayerMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function step(input={},state={},dt=1/60,options={}){
  if(!Number.isFinite(dt)||dt<0)throw new TypeError('dt must be finite and nonnegative');
  const seconds=Math.min(dt,.05);
  const gravity=options.gravity===undefined?9.81:options.gravity;
  if(!Number.isFinite(gravity)||gravity<0)throw new TypeError('gravity must be nonnegative and finite');
  const forward=Number(input.forward)||0,right=Number(input.right)||0;
  const length=Math.hypot(forward,right),norm=length>1?1/length:1;
  const crouched=!!input.crouch;
  const speed=crouched?1.7:input.sprint?7:4;
  const yaw=Number.isFinite(state.yaw)?state.yaw:0;
  const f=forward*norm,r=right*norm;
  const vx=(Math.sin(yaw)*f+Math.cos(yaw)*r)*speed;
  const vz=(Math.cos(yaw)*f-Math.sin(yaw)*r)*speed;
  const grounded=!!state.grounded;
  const vy=grounded&&input.jump&&!crouched?5.5:(Number.isFinite(state.vy)?state.vy:0)-gravity*seconds;
  return Object.freeze({vx,vz,vy,x:(state.x||0)+vx*seconds,z:(state.z||0)+vz*seconds,
   y:(state.y||0)+vy*seconds,height:crouched?1.15:1.8,crouched,
   grounded:grounded&&!input.jump,dt:seconds});
 }
 // Babylon ArcRotateCamera sits at target+(cos a, sin a)*r in x/z, so "forward"
 // (away from the camera) is (-cos a, -sin a). step() moves along (sin yaw, cos yaw).
 function yawFromCameraAlpha(alpha){
  if(!Number.isFinite(alpha))throw new TypeError('camera alpha must be finite');
  return Math.atan2(-Math.cos(alpha),-Math.sin(alpha));
 }
 // Third-person orbit: look at head height; beta up to 1.75 lets the player look
 // up at buildings. The camera never goes below minCameraY: near the ground the
 // orbit radius shrinks instead (camera height = targetY + radius*cos(beta)).
 function thirdPersonCamera({playerY,beta,desiredRadius=7.5,headOffset=.8,minBeta=.35,maxBeta=1.75,minCameraY=.4,minRadius=1.5}={}){
  if(![playerY,beta,desiredRadius].every(Number.isFinite))throw new TypeError('finite camera inputs required');
  const b=Math.max(minBeta,Math.min(maxBeta,beta));
  const targetY=playerY+headOffset,c=Math.cos(b);
  let radius=desiredRadius;
  if(c<0)radius=Math.max(minRadius,Math.min(desiredRadius,(targetY-minCameraY)/-c));
  return Object.freeze({beta:b,radius,targetY,cameraY:targetY+radius*c});
 }
 return Object.freeze({step,yawFromCameraAlpha,thirdPersonCamera});
});
