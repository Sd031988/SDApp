/* Deterministic, Babylon-independent third-person movement contract. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenPlayerMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function step(input={},state={},dt=1/60){
  if(!Number.isFinite(dt)||dt<0)throw new TypeError('dt must be finite and nonnegative');
  const seconds=Math.min(dt,.05);
  const forward=Number(input.forward)||0,right=Number(input.right)||0;
  const length=Math.hypot(forward,right),norm=length>1?1/length:1;
  const crouched=!!input.crouch;
  const speed=crouched?1.7:input.sprint?7:4;
  const yaw=Number.isFinite(state.yaw)?state.yaw:0;
  const f=forward*norm,r=right*norm;
  const vx=(Math.sin(yaw)*f+Math.cos(yaw)*r)*speed;
  const vz=(Math.cos(yaw)*f-Math.sin(yaw)*r)*speed;
  const grounded=!!state.grounded;
  const vy=grounded&&input.jump&&!crouched?5.5:(Number.isFinite(state.vy)?state.vy:0)-9.81*seconds;
  return Object.freeze({vx,vz,vy,x:(state.x||0)+vx*seconds,z:(state.z||0)+vz*seconds,
   y:(state.y||0)+vy*seconds,height:crouched?1.15:1.8,crouched,
   grounded:grounded&&!input.jump,dt:seconds});
 }
 return Object.freeze({step});
});
