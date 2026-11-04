/* SD Game-Studio: conservative, CPU-only AABB frustum visibility primitive.
 * Planes use ax+by+cz+d >= 0 for the visible half-space.
 * No GPU state, filesystem, scene mutation or network access. */
(function(root,factory){
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root&&root.document)root.SDWorldFrustum=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function fail(){throw new TypeError('Invalid frustum or bounding box.');}
function finite(v){return typeof v==='number'&&Number.isFinite(v);}
function box(min,max){
if(!Array.isArray(min)||!Array.isArray(max)||min.length!==3||max.length!==3)fail();
for(let i=0;i<3;i++)if(!finite(min[i])||!finite(max[i])||min[i]>max[i])fail();
return {min:[...min],max:[...max]};
}
function planes(input){
if(!Array.isArray(input)||input.length!==6)fail();
return input.map(p=>{
if(!Array.isArray(p)||p.length!==4||!p.every(finite))fail();
const len=Math.hypot(p[0],p[1],p[2]);
if(!Number.isFinite(len)||len<1e-12)fail();
return p.map(v=>v/len);
});
}
function visible(bounds,frustum){
if(!bounds||typeof bounds!=='object')fail();
const b=box(bounds.min,bounds.max),ps=planes(frustum);
for(const p of ps){
const x=p[0]>=0?b.max[0]:b.min[0];
const y=p[1]>=0?b.max[1]:b.min[1];
const z=p[2]>=0?b.max[2]:b.min[2];
if(p[0]*x+p[1]*y+p[2]*z+p[3]<0)return false;
}
return true;
}
function cellBounds(cx,cz,cellSize=40,grid=16,minY=-100,maxY=100){
if(!Number.isSafeInteger(cx)||!Number.isSafeInteger(cz)||!Number.isSafeInteger(grid)||
grid<1||grid>1024||cx<0||cz<0||cx>=grid||cz>=grid||
!finite(cellSize)||cellSize<=0||cellSize>100000||!finite(minY)||!finite(maxY)||minY>maxY)fail();
const half=grid*cellSize/2;
return box([-half+cx*cellSize,minY,-half+cz*cellSize],[-half+(cx+1)*cellSize,maxY,-half+(cz+1)*cellSize]);
}
return Object.freeze({box,planes,visible,cellBounds});
});
