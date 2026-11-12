/* Nordhafen Ops: central tuning values for the player's Havok car.
 * All physical values are SI units (kg, m, s, N). Change values here only.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenOpsVehicleConfig=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PLAYER_CAR=Object.freeze({
 mass:1450,                 // kg
 body:Object.freeze({width:1.95,height:.72,depth:4.25}),
 centerOfMassY:-.32,        // m below the box centre – keeps the car from rolling over
 spawnHeight:.7,            // m, chassis centre above the road at spawn
 // Wheels (local chassis coordinates, ray start points)
 wheelX:.8,wheelZ:1.38,wheelY:-.1,wheelRadius:.34,
 // Suspension (per wheel)
 restLength:.7,             // m from ray start to the road when unloaded
 staticCompression:.14,     // m compression at standstill – sets the spring rate
 dampingRatio:.55,          // 1 = critically damped
 maxSuspensionForce:3.2,    // × wheel load at standstill
 // Drive train
 engineForce:9800,          // N at the rear axle (≈ 0.69 g)
 reverseForce:5200,         // N
 maxSpeed:23,               // m/s (≈ 83 km/h)
 maxReverseSpeed:8,         // m/s
 brakeForce:15500,          // N, all four wheels together (≈ 1.09 g)
 handbrakeForce:7000,       // N, rear wheels only
 rollingResistance:180,     // N
 airDrag:.42,               // N per (m/s)²
 // Tyres and steering
 gripFront:1.05,            // friction coefficient front
 gripRear:1.3,              // friction coefficient rear (higher than front = stable, slight understeer)
 handbrakeRearGrip:.35,     // rear grip factor while the handbrake is pulled
 corneringStiffness:9,      // lateral slip response (1/s)
 maxSteer:.55,              // rad at walking pace
 minSteerAtSpeed:.16,       // rad at maxSpeed – less steering when fast
 steerSpeed:3.2,            // rad/s steering-wheel speed
 angularDamping:.6,
 linearDamping:.02
});
const TRAFFIC_CAR=Object.freeze({
 collider:Object.freeze({width:1.8,height:1.35,depth:3.7}) // kinematic box, no driving physics
});
return Object.freeze({PLAYER_CAR,TRAFFIC_CAR});
});
