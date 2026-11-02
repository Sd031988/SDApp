'use strict';
/* Original, self-contained fixture geometry for GLB parser tests. */
function makeGLB(modify){
const buffer=Buffer.alloc(44);
const xyz=[0,0,0,1,0,0,0,1,0];
xyz.forEach((x,i)=>buffer.writeFloatLE(x,i*4));
for(let i=0;i<3;i++)buffer.writeUInt16LE(i,36+i*2);
const json={
asset:{version:'2.0',generator:'SD Game-Studio test fixture'},
buffers:[{byteLength:44}],
bufferViews:[{buffer:0,byteOffset:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:6}],
accessors:[
{bufferView:0,componentType:5126,count:3,type:'VEC3'},
{bufferView:1,componentType:5123,count:3,type:'SCALAR'}
],
meshes:[{primitives:[{attributes:{POSITION:0},indices:1,material:0}]}],
materials:[{pbrMetallicRoughness:{baseColorFactor:[.7,.4,.3,1]}}],
nodes:[{mesh:0,translation:[2,1,3]}],
scenes:[{nodes:[0]}],scene:0
};
if(modify)modify(json,buffer);
let j=Buffer.from(JSON.stringify(json),'utf8');
j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,0x20)]);
const header=Buffer.alloc(12);
header.writeUInt32LE(0x46546c67,0);
header.writeUInt32LE(2,4);
header.writeUInt32LE(12+8+j.length+8+buffer.length,8);
const jsonHead=Buffer.alloc(8);jsonHead.writeUInt32LE(j.length,0);jsonHead.writeUInt32LE(0x4e4f534a,4);
const binHead=Buffer.alloc(8);binHead.writeUInt32LE(buffer.length,0);binHead.writeUInt32LE(0x004e4942,4);
return Buffer.concat([header,jsonHead,j,binHead,buffer]);
}
module.exports={makeGLB};
