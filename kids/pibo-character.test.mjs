import assert from 'node:assert/strict';
import {decoratePibo} from './pibo-character.mjs';
class Mesh{
 constructor(geom,material){this.geometry=geom;this.material=material;this.position={set(x,y,z){Object.assign(this,{x,y,z})},y:0};this.rotation={x:0,y:0,z:0};this.scale={set(){}};this.children=[];this.visible=true}
 add(child){this.children.push(child)}
}
const THREE={Mesh,ConeGeometry:class{},TorusGeometry:class{}};
const cat=new Mesh(),head=new Mesh();
const ell=(parent,material,x,y,z)=>{const node=new Mesh(null,material);node.position.set(x,y,z);parent.add(node);return node};
const paws=[new Mesh(),new Mesh()];
const pupils=[{x:-.31,colored:new Mesh()},{x:.31,colored:new Mesh()}];
pupils[0].colored.position.x=-.31;
pupils[1].colored.position.x=.31;
const model=decoratePibo({THREE,cat,head,ell,mat:color=>({color}),paws,pupils});
assert(cat.children.length>6,'Pibo has original collar, paw details and fur markings');
assert(head.children.length>6,'Pibo head has whisker freckles and ear tufts');
assert.equal(model.toeMeshes.length,6,'Three 3D toes on each animated forepaw');
assert(paws.every(p=>p.children.length===4),'Toes and underside pad parented to each moving paw');
assert.equal(model.eyeGlints.length,2,'Both eyes receive layered highlights');
pupils[0].colored.position.x=-.26;
model.update(1,.2);
assert(Math.abs(model.eyeGlints[0].major.position.x-(-.26-.035))<1e-9,'Eye highlight follows gaze');
model.update(1,0);
assert.equal(model.tongue.visible,false,'Tongue is initially hidden');
model.update(2,.41);assert.equal(model.tongue.visible,true);
model.update(2,.02);assert.equal(model.tongue.visible,false);
const original=model.pendant.rotation.z;
model.update(3,.2,true);
assert.equal(model.pendant.rotation.z,original,'Reduced-motion setting stops ornament motion');
console.log('PASS: original Pibo toe meshes, gaze-linked eye reflections and reactive mouth');
