/* Nordhafen Ops – pure enemy AI and combat state for stage B. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsEnemies=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_HEALTH=50,PLAYER_HEALTH=100;
 function spawn(id,x,z){return {id,x,z,homeX:x,homeZ:z,health:MAX_HEALTH,state:'patrol',time:0,shotCooldown:1+id*.13,patrolPhase:id*.8};}
 function damage(enemy,amount){const health=Math.max(0,enemy.health-Math.max(0,amount));return {...enemy,health,state:health===0?'dead':enemy.state};}
 function hurt(health,amount){return Math.max(0,health-Math.max(0,amount));}
 function step(enemy,player,dt,{visible=false,random=.5,patrolAxis='x'}={}){
  if(enemy.health<=0)return {enemy:{...enemy,state:'dead'},shoot:false};
  const deltaX=player.x-enemy.x,deltaZ=player.z-enemy.z,distance=Math.hypot(deltaX,deltaZ);
  let state=enemy.state;
  if(visible&&distance<35)state=distance<14?'shoot':'chase';
  else if(state==='shoot'||state==='chase')state=distance<45?'search':'patrol';
  else if(state==='search'&&enemy.time>3)state='patrol';
  let x=enemy.x,z=enemy.z;
  const speed=state==='chase'?2.6:state==='patrol'?.65:0;
  if(speed>0){
   const patrolDirection=Math.sin(enemy.time*.55+enemy.patrolPhase)>=0?1:-1;
   const dx=state==='patrol'?(patrolAxis==='x'?patrolDirection:0):deltaX/(distance||1);
   const dz=state==='patrol'?(patrolAxis==='z'?patrolDirection:0):deltaZ/(distance||1);
   x+=dx*speed*dt;z+=dz*speed*dt;
  }
  const cooldown=enemy.shotCooldown-dt;
  const shoot=state==='shoot'&&visible&&distance<14&&cooldown<=0;
  const spread=(random-.5)*.35;
  return {enemy:{...enemy,x,z,state,time:state===enemy.state?enemy.time+dt:0,shotCooldown:shoot?1.2+enemy.id*.11:cooldown},shoot,spread};
 }
 return Object.freeze({MAX_HEALTH,PLAYER_HEALTH,spawn,damage,hurt,step});
});