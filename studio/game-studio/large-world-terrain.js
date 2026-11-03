/* Procedural multi-octave terrain meshes for the SD Game-Studio World v3.
 * World-space sampling guarantees seamless boundaries between adjacent cells.
 * No network, DOM, file access, or user-project changes. */
(function(root,factory){
const api=factory(typeof module!=='undefined'&&module.exports?require('./large-world-core.js'):root.SDLargeWorld);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDWorldTerrain=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(World){
'use strict';
if(!World)throw Error('World-core fehlt.');
const valid=(v)=>typeof v==='number'&&Number.isFinite(v);
function heightAt(x,z,seed=31){
if(!valid(x)||!valid(z)||!Number.isSafeInteger(seed)||seed<1||seed>2147483647)throw Error('Ungültige Terrainkoordinate.');
const offset=(seed%997)*.013;
return 2.3*Math.sin(x*.021+offset)*Math.cos(z*.019-offset*.47)
+.85*Math.sin((x+z)*.063-offset*.81)*Math.cos((x-z)*.041+offset*.29);
}
function normalAt(x,z,seed=31){
const step=.45,dx=(heightAt(x+step,z,seed)-heightAt(x-step,z,seed))/(2*step),
dz=(heightAt(x,z+step,seed)-heightAt(x,z-step,seed))/(2*step),
length=Math.hypot(dx,1,dz);
return[-dx/length,1/length,-dz/length];
}
function buildCell(cx,cz,seed=31,resolution=12){
if(!Number.isInteger(cx)||cx<0||cx>=World.GRID||!Number.isInteger(cz)||cz<0||cz>=World.GRID||
!Number.isInteger(resolution)||resolution<4||resolution>24)throw Error('Ungültige Terrainzelle.');
const x0=-World.HALF+cx*World.CHUNK,z0=-World.HALF+cz*World.CHUNK,step=World.CHUNK/resolution;
const out=new Float32Array(resolution*resolution*2*3*6);
let offset=0,low=Infinity,high=-Infinity;
function point(ix,iz){
const x=x0+ix*step,z=z0+iz*step,y=heightAt(x,z,seed);
low=Math.min(low,y);high=Math.max(high,y);
return[x,y,z,...normalAt(x,z,seed)];
}
for(let iz=0;iz<resolution;iz++)for(let ix=0;ix<resolution;ix++){
const p00=point(ix,iz),p01=point(ix,iz+1),p10=point(ix+1,iz),p11=point(ix+1,iz+1);
for(const point of [p00,p01,p11,p00,p11,p10]){out.set(point,offset);offset+=6;}
}
return{vertices:out,count:out.length/6,bounds:{min:low,max:high},cx,cz};
}
return Object.freeze({heightAt,normalAt,buildCell});
});
