/* Nordhafen Ops – camera shoulder and smoothed locomotion adapter, no shared controller changes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsControls=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function smooth(current,target,dt,rate){return current+(target-current)*Math.min(1,Math.max(0,dt)*rate);}
 function velocity(previous,next,dt,aiming){return {...next,vx:smooth(previous.vx||0,next.vx*(aiming?.55:1),dt,next.vx?12:17),vz:smooth(previous.vz||0,next.vz*(aiming?.55:1),dt,next.vz?12:17)};}
 function shoulder(camera,playerPosition,BABYLON,offset=.6){
  const right=new BABYLON.Vector3(Math.cos(camera.alpha),0,-Math.sin(camera.alpha));
  camera.target.copyFrom(playerPosition);camera.target.addInPlace(right.scale(offset));camera.target.y=playerPosition.y+.45;
 }
 function centerRay(scene,canvas,BABYLON){const rect=canvas.getBoundingClientRect();return scene.createPickingRay((rect.width/2)*scene.getEngine().getRenderWidth()/rect.width,(rect.height/2)*scene.getEngine().getRenderHeight()/rect.height,BABYLON.Matrix.Identity(),scene.activeCamera);}
 function targetPositions(origin,forward,right){return [10,13,16,20,24].map((distance,i)=>({x:origin.x+forward.x*distance+right.x*(i-2)*1.4,z:origin.z+forward.z*distance+right.z*(i-2)*1.4,distance}));}
 return Object.freeze({smooth,velocity,shoulder,centerRay,targetPositions});
});