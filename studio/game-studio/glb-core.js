/* Binary glTF 2.0 geometry-only preview. No DOM, network, storage or eval.
 * This parser intentionally rejects external buffers, required extensions,
 * sparse accessors, animation/skinning and unsupported draw modes. */
(function(root,factory){
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDGLB=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LIMITS=Object.freeze({fileBytes:8*1024*1024,jsonBytes:2*1024*1024,nodes:512,primitives:64,triangles:100000});
const ID=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const integer=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
function fail(message){throw Error('GLB-Import: '+message);}
function multiply(a,b){
const out=new Array(16).fill(0);
for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];
return out;
}
function transform(m,p){
const [x,y,z]=p;
const w=m[3]*x+m[7]*y+m[11]*z+m[15];
if(!finite(w)||Math.abs(w)<1e-8)fail('Ungültige Knotentransformation.');
return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w,
(m[1]*x+m[5]*y+m[9]*z+m[13])/w,
(m[2]*x+m[6]*y+m[10]*z+m[14])/w];
}
function nodeMatrix(node){
if(node.matrix!==undefined){
if(!Array.isArray(node.matrix)||node.matrix.length!==16||!node.matrix.every(finite))fail('Ungültige Node-Matrix.');
if(node.translation!==undefined||node.rotation!==undefined||node.scale!==undefined)fail('Matrix und TRS dürfen nicht kombiniert werden.');
return node.matrix;
}
const p=node.translation??[0,0,0],q=node.rotation??[0,0,0,1],s=node.scale??[1,1,1];
if(!Array.isArray(p)||p.length!==3||!p.every(finite)||
!Array.isArray(s)||s.length!==3||!s.every(v=>finite(v)&&Math.abs(v)<1e6)||
!Array.isArray(q)||q.length!==4||!q.every(finite))fail('Ungültige Knotentransformation.');
const magnitude=Math.hypot(...q);
if(!finite(magnitude)||magnitude<1e-8)fail('Ungültige Quaternion.');
const [x,y,z,w]=q.map(v=>v/magnitude);
const m=ID();
m[0]=(1-2*(y*y+z*z))*s[0];m[1]=2*(x*y+z*w)*s[0];m[2]=2*(x*z-y*w)*s[0];
m[4]=2*(x*y-z*w)*s[1];m[5]=(1-2*(x*x+z*z))*s[1];m[6]=2*(y*z+x*w)*s[1];
m[8]=2*(x*z+y*w)*s[2];m[9]=2*(y*z-x*w)*s[2];m[10]=(1-2*(x*x+y*y))*s[2];
m[12]=p[0];m[13]=p[1];m[14]=p[2];
return m;
}
function parse(input){
const bytes=input instanceof ArrayBuffer?new Uint8Array(input):
ArrayBuffer.isView(input)?new Uint8Array(input.buffer,input.byteOffset,input.byteLength):null;
if(!bytes)fail('Bitte eine GLB-Datei wählen.');
if(bytes.byteLength<20||bytes.byteLength>LIMITS.fileBytes)fail('Dateigröße ist ungültig (maximal 8 MiB).');
const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),size=bytes.byteLength;
if(d.getUint32(0,true)!==0x46546c67||d.getUint32(4,true)!==2||d.getUint32(8,true)!==size)fail('Keine gültige binäre glTF-2.0-Datei.');
let cursor=12,jsonBytes=null,binary=null;
while(cursor<size){
if(cursor+8>size)fail('Unvollständiger Chunk-Header.');
const length=d.getUint32(cursor,true),type=d.getUint32(cursor+4,true);cursor+=8;
if(length%4!==0||length>size-cursor)fail('Ungültige Chunk-Länge.');
const chunk=bytes.subarray(cursor,cursor+length);
if(type===0x4e4f534a){if(jsonBytes||binary)fail('JSON-Chunk an falscher Stelle.');jsonBytes=chunk;}
else if(type===0x004e4942){if(binary||!jsonBytes)fail('Ungültige BIN-Chunk-Reihenfolge.');binary=chunk;}
cursor+=length;
}
if(!jsonBytes||jsonBytes.length>LIMITS.jsonBytes)fail('JSON-Daten fehlen oder sind zu groß.');
let data;
try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(jsonBytes).replace(/[\u0000\s]+$/g,''));}
catch(_){fail('JSON-Chunk konnte nicht gelesen werden.');}
if(!data||typeof data!=='object'||Array.isArray(data)||data.asset?.version!=='2.0')
fail('Nur glTF 2.0 wird unterstützt.');
if(Array.isArray(data.extensionsRequired)&&data.extensionsRequired.length)fail('Erforderliche Erweiterungen werden noch nicht unterstützt.');
if(data.animations?.length||data.skins?.length)fail('Animationen und Skinning sind noch nicht unterstützt.');
if(!Array.isArray(data.buffers)||data.buffers.length!==1||data.buffers[0].uri!==undefined||!binary)
fail('Nur eingebettete binäre Daten ohne externe Dateien sind erlaubt.');
const declared=data.buffers[0].byteLength;
if(!integer(declared,1,binary.length)||declared+3<binary.length)fail('Ungültige BIN-Bufferlänge.');
const views=data.bufferViews??[],accessors=data.accessors??[],nodes=data.nodes??[],
meshes=data.meshes??[],scenes=data.scenes??[],materials=data.materials??[];
if(!Array.isArray(views)||!Array.isArray(accessors)||!Array.isArray(nodes)||
!Array.isArray(meshes)||!Array.isArray(scenes)||!Array.isArray(materials)||
nodes.length>LIMITS.nodes)fail('Zu viele oder ungültige Elemente.');
const read=(reference,kind)=>{
if(!integer(reference,0,accessors.length-1))fail('Ungültiger Accessor.');
const a=accessors[reference];
if(!a||a.sparse!==undefined||a.bufferView===undefined||a.normalized===true||
a.type!==(kind==='position'?'VEC3':'SCALAR')||
(kind==='position'&&a.componentType!==5126)||
(kind==='index'&&![5121,5123,5125].includes(a.componentType)))
fail('Dieser Accessor-Typ wird nicht unterstützt.');
const count=a.count,components=kind==='position'?3:1,componentBytes=kind==='position'||a.componentType===5125?4:a.componentType===5123?2:1;
if(!integer(count,1,300000))fail('Ungültige Accessor-Länge.');
if(!integer(a.bufferView,0,views.length-1))fail('Ungültiger BufferView.');
const v=views[a.bufferView],offset=a.byteOffset??0,viewOffset=v.byteOffset??0;
if(!v||v.buffer!==0||!integer(v.byteLength,1,declared)||!integer(viewOffset,0,declared-v.byteLength)||
!integer(offset,0,v.byteLength))fail('Ungültiger Bufferbereich.');
const element=componentBytes*components,stride=v.byteStride??element;
if(!integer(stride,element,252)||stride%componentBytes!==0||
offset+(count-1)*stride+element>v.byteLength||
(viewOffset+offset)%componentBytes!==0)fail('Bufferdaten reichen nicht aus.');
const base=binary.byteOffset+viewOffset+offset,
view=new DataView(binary.buffer);
const result=new Array(count);
for(let i=0;i<count;i++){
let pos=base+i*stride;
if(kind==='position'){
const triple=[view.getFloat32(pos,true),view.getFloat32(pos+4,true),view.getFloat32(pos+8,true)];
if(!triple.every(v=>finite(v)&&Math.abs(v)<1000000))fail('Ungültige Modellkoordinate.');
result[i]=triple;
}else result[i]=a.componentType===5125?view.getUint32(pos,true):
a.componentType===5123?view.getUint16(pos,true):view.getUint8(pos);
}
return result;
};
if(!scenes.length||!integer(data.scene??0,0,scenes.length-1))fail('Modell enthält keine gültige Szene.');
const selected=scenes[data.scene??0];
if(!Array.isArray(selected.nodes))fail('Keine Wurzelknoten.');
const parts=[],boundsMin=[Infinity,Infinity,Infinity],boundsMax=[-Infinity,-Infinity,-Infinity];
let triangles=0,usedNodes=0;
function walk(index,parent,ancestors,depth){
if(!integer(index,0,nodes.length-1)||depth>32||ancestors.has(index))fail('Ungültige oder zyklische Knotenstruktur.');
usedNodes++;
if(usedNodes>LIMITS.nodes)fail('Zu viele Szenenknoten.');
const node=nodes[index];
if(!node||typeof node!=='object')fail('Ungültiger Knoten.');
const matrix=multiply(parent,nodeMatrix(node));
const seen=new Set(ancestors);seen.add(index);
if(node.mesh!==undefined){
if(!integer(node.mesh,0,meshes.length-1))fail('Ungültiger Mesh-Verweis.');
const primitives=meshes[node.mesh]?.primitives;
if(!Array.isArray(primitives))fail('Mesh ohne Primitives.');
for(const prim of primitives){
if(parts.length>=LIMITS.primitives)fail('Zu viele Mesh-Teile (maximal 64).');
if(!prim||!(prim.mode===undefined||prim.mode===4)||!integer(prim.attributes?.POSITION,0,accessors.length-1))
fail('Nur Triangle-Meshes mit POSITION werden unterstützt.');
if(prim.extensions&&Object.keys(prim.extensions).length)fail('Primitive mit Erweiterungen werden nicht unterstützt.');
const positions=read(prim.attributes.POSITION,'position');
const indices=prim.indices!==undefined?read(prim.indices,'index'):positions.map((_,i)=>i);
if(indices.length%3!==0)fail('Dreiecksindexzahl ist ungültig.');
triangles+=indices.length/3;
if(triangles>LIMITS.triangles)fail('Zu viele Dreiecke (maximal 100.000).');
let baseColor=[.64,.82,.84,1];
if(prim.material!==undefined){
if(!integer(prim.material,0,materials.length-1))fail('Ungültiger Materialverweis.');
const mat=materials[prim.material];
if(mat?.extensions&&Object.keys(mat.extensions).length)fail('Materialerweiterungen werden nicht unterstützt.');
if(mat.alphaMode&&mat.alphaMode!=='OPAQUE')fail('Transparente Materialien werden in dieser Vorschau noch nicht unterstützt.');
baseColor=mat.pbrMetallicRoughness?.baseColorFactor??baseColor;
}
if(!Array.isArray(baseColor)||baseColor.length!==4||!baseColor.every(v=>finite(v)&&v>=0&&v<=1))
fail('Ungültige Materialfarbe.');
const vertices=new Float32Array(indices.length*6);
for(let t=0;t<indices.length;t+=3){
const ia=indices[t],ib=indices[t+1],ic=indices[t+2];
if(!integer(ia,0,positions.length-1)||!integer(ib,0,positions.length-1)||!integer(ic,0,positions.length-1))fail('Dreiecksindex außerhalb des Meshes.');
const points=[positions[ia],positions[ib],positions[ic]].map(p=>transform(matrix,p));
const e1=points[1].map((v,k)=>v-points[0][k]),e2=points[2].map((v,k)=>v-points[0][k]);
const normal=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
const len=Math.hypot(...normal),n=len>1e-9?normal.map(v=>v/len):[0,1,0];
for(let j=0;j<3;j++){
if(!points[j].every(v=>finite(v)&&Math.abs(v)<1000000))fail('Modell außerhalb des unterstützten Koordinatenbereichs.');
const off=(t+j)*6;
vertices.set([...points[j],...n],off);
for(let k=0;k<3;k++){boundsMin[k]=Math.min(boundsMin[k],points[j][k]);boundsMax[k]=Math.max(boundsMax[k],points[j][k]);}
}
}
parts.push({vertices,color:baseColor.slice(0,3),triangles:indices.length/3});
}
}
if(node.children!==undefined){
if(!Array.isArray(node.children))fail('Ungültige Kindknoten.');
for(const child of node.children)walk(child,matrix,seen,depth+1);
}
}
for(const rootNode of selected.nodes)walk(rootNode,ID(),new Set(),0);
if(!parts.length||!triangles)fail('Keine darstellbaren Dreiecke gefunden.');
const center=boundsMin.map((v,i)=>(v+boundsMax[i])/2),
radius=Math.max(.001,Math.hypot(...boundsMax.map((v,i)=>(v-boundsMin[i])/2)));
return {parts,stats:Object.freeze({bytes:size,nodes:usedNodes,meshes:meshes.length,primitives:parts.length,triangles}),
bounds:Object.freeze({center,radius,min:boundsMin,max:boundsMax}),warnings:Object.freeze([
data.materials?.some(m=>m?.pbrMetallicRoughness?.baseColorTexture||m?.normalTexture||m?.emissiveTexture)?'Texturen werden vorerst nicht dargestellt.':'',
'Vorschau zeigt vereinfachte Farben und flache Normalen; keine Animationen.'
].filter(Boolean))};
}
return Object.freeze({LIMITS,parse});
});
