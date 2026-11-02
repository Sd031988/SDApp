import assert from 'node:assert/strict';
import {decoratePibo} from './pibo-character.mjs';
class Mesh{
 constructor(geom,material){this.geometry=geom;this.material=material;this.position={set(x,y,z){Object.assign(this,{x,y,z})},y:0};this.rotation={x:0,y:0,z:0};this.scale={set(){}};this.children=[];this.visible=true}
 add(child){this.children.push(child)}
}
class Vector3{set(x,y,z){Object.assign(this,{x,y,z});return this}}
class Quaternion{setFromUnitVectors(){return this}}
class Matrix4{compose(){return this}}
class InstancedMesh extends Mesh{constructor(g,m,count){super(g,m);this.count=count;this.instanceMatrix={needsUpdate:false};this.matrices=[]}setMatrixAt(i){this.matrices.push(i)}}
const THREE={Mesh,InstancedMesh,Vector3,Quaternion,Matrix4,MeshStandardMaterial:class{},DoubleSide:2,ConeGeometry:class{},TorusGeometry:class{}};
const cat=new Mesh(),head=new Mesh(),body=new Mesh();body.scale.y=.85;
const ell=(parent,material,x,y,z)=>{const node=new Mesh(null,material);node.position.set(x,y,z);parent.add(node);return node};
const paws=[new Mesh(),new Mesh()];
const pupils=[{x:-.31,colored:new Mesh()},{x:.31,colored:new Mesh()}];
pupils[0].colored.position.x=-.31;
pupils[1].colored.position.x=.31;
const model=decoratePibo({THREE,cat,head,body,ell,mat:color=>({color}),paws,pupils});
assert(cat.children.length>6,'Pibo has original collar, paw details and fur markings');
assert(head.children.length>6,'Pibo head has whisker freckles and ear tufts');
assert.equal(model.toeMeshes.length,6,'Three 3D toes on each animated forepaw');
assert(paws.every(p=>p.children.length===4),'Toes and underside pad parented to each moving paw');
assert.equal(model.eyeGlints.length,2,'Both eyes receive layered highlights');
assert.equal(model.furShells.length,2,'Separate head and body fur shells');
assert.deepEqual(model.furShells.map(shell=>shell.count),[220,300],'520 original fur tufts in two draw calls');
assert.equal(model.furShells[0].position.y,0,'Head fur stays centered on head');
assert.equal(model.furShells[1].position.y,.97,'Body fur is centered on the actual torso, not underground');
assert.equal(model.furShells[1].scale.y,undefined,'No redundant torso animation before first update');
assert(model.furShells.every(shell=>shell.instanceMatrix.needsUpdate&&shell.matrices.length===shell.count));
assert(model.furShells.every(shell=>shell.raycast.toString().includes('=>{}')),'Decorative fur does not intercept taps');
assert(head.children.includes(model.furShells[0])&&cat.children.includes(model.furShells[1]),'Fur follows animated parents');
pupils[0].colored.position.x=-.26;
model.update(1,.2);
assert(Math.abs(model.eyeGlints[0].major.position.x-(-.26-.035))<1e-9,'Eye highlight follows gaze');
model.update(1,0);
assert.equal(model.tongue.visible,false,'Tongue is initially hidden');
model.update(2,.41);assert.equal(model.tongue.visible,true);
assert.equal(model.furShells[1].scale.y,1,'Torso coat matches idle torso');
body.scale.y=.9;model.update(2,.41);
assert(Math.abs(model.furShells[1].scale.y-.9/.85)<1e-9,'Torso coat follows breathing scale');
body.scale.y=100;model.update(2,.41);
assert.equal(model.furShells[1].scale.y,1.25,'Coat deformation is bounded');
model.update(2,.02);assert.equal(model.tongue.visible,false);
const original=model.pendant.rotation.z;
model.update(3,.2,true);
assert.equal(model.pendant.rotation.z,original,'Reduced-motion setting stops ornament motion');
console.log('PASS: aligned torso fur, breathing coat, toes, gaze-linked eye reflections and reactive mouth');
