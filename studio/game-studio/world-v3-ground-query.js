/* Opt-in deterministic ground clearance queries for World v3. No scene writes. */
(function(root,factory){
const api=factory(typeof module!=='undefined'&&module.exports?require('./large-world-terrain.js'):root.SDWorldTerrain);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDWorldGroundQuery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Terrain){
'use strict';
if(!Terrain||typeof Terrain.heightAt!=='function')throw Error('Terrain sampler fehlt.');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function queryGround(x,z,footY,seed=31){
if(![x,z,footY].every(finite))throw Error('Ungültige Position.');
const height=Terrain.heightAt(x,z,seed);
return Object.freeze({height,clearance:footY-height,penetrating:footY<height});
}
function traceGround(x0,z0,x1,z1,footY,seed=31,steps=16){
if(![x0,z0,x1,z1,footY].every(finite)||!Number.isInteger(steps)||steps<1||steps>256)throw Error('Ungültige Bodenabfrage.');
let lowestClearance=Infinity,firstPenetration=null;
for(let i=0;i<=steps;i++){
const t=i/steps,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;
if(!finite(x)||!finite(z))throw Error('Koordinatenüberlauf.');
const sample=queryGround(x,z,footY,seed);
lowestClearance=Math.min(lowestClearance,sample.clearance);
if(sample.penetrating&&firstPenetration===null)firstPenetration=Object.freeze({t,x,z,height:sample.height});
}
return Object.freeze({lowestClearance,firstPenetration,samples:steps+1});
}
return Object.freeze({queryGround,traceGround});
});