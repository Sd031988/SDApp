/* Nordhafen Ops – camera shoulder and smoothed locomotion adapter, no shared controller changes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsControls=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function smooth(current,target,dt,rate){return target+(current-target)*Math.exp(-Math.max(0,dt)*rate);}
 function frameP95(samples){if(!samples.length)return 0;const sorted=[...samples].sort((a,b)=>a-b);return sorted[Math.ceil(sorted.length*.95)-1];}
 function frameWindow(samples,now,ms=5000){return samples.filter(sample=>now-sample.at<=ms);}
 function crosshairCoordinates(width,height){return {x:width/2,y:height/2};}
 function fixedDistance(speed,dt){return speed*Math.max(0,dt);}
 function velocity(previous,next,dt,aiming){return {...next,vx:smooth(previous.vx||0,next.vx*(aiming?.55:1),dt,next.vx?12:17),vz:smooth(previous.vz||0,next.vz*(aiming?.55:1),dt,next.vz?12:17)};}
 function shoulder(camera,playerPosition,BABYLON,offset=.6){
  const right=new BABYLON.Vector3(-Math.sin(camera.alpha),0,Math.cos(camera.alpha));
  camera.target.copyFrom(playerPosition);camera.target.addInPlace(right.scale(offset));camera.target.y=playerPosition.y+.45;
 }
 function shoulderScreenSide(camera,playerPosition){const dx=playerPosition.x-camera.target.x,dz=playerPosition.z-camera.target.z;return dx*(-Math.sin(camera.alpha))+dz*Math.cos(camera.alpha);}
 function enemyPositions(origin,street=64){const offsets=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1]];return offsets.map(([x,z],i)=>({x:origin.x+x*street+(i%2?4:0),z:origin.z+z*street+(i%2?0:4),patrolAxis:i%2?'z':'x'}));}
 function graceAllowsDetection(elapsed){return elapsed>=10;}
 function appearance(kind){return kind==='enemy'?{body:'#4b515b',visor:'#f01828',healthBar:'#d71920'}:{rings:['#ffffff','#ff8b19','#ffffff','#ff8b19']};}
 function centerRay(scene,canvas,BABYLON){const rect=canvas.getBoundingClientRect();const center=crosshairCoordinates(scene.getEngine().getRenderWidth(),scene.getEngine().getRenderHeight());return scene.createPickingRay(center.x,center.y,BABYLON.Matrix.Identity(),scene.activeCamera);}
 function targetPositions(origin,forward,right){return [10,13,16,20,24].map((distance,i)=>({x:origin.x+forward.x*distance+right.x*(i-2)*1.4,z:origin.z+forward.z*distance+right.z*(i-2)*1.4,distance}));}
 return Object.freeze({smooth,frameP95,frameWindow,crosshairCoordinates,fixedDistance,velocity,shoulder,shoulderScreenSide,enemyPositions,graceAllowsDetection,appearance,centerRay,targetPositions});
});