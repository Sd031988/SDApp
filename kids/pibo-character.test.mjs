import assert from 'node:assert/strict';
import {decoratePibo} from './pibo-character.mjs';
class Mesh{
 constructor(geom,material){this.geometry=geom;this.material=material;this.position={set(x,y,z){Object.assign(this,{x,y,z})},y:0};this.rotation={x:0,y:0,z:0};this.scale={set(){}};this.children=[];this.visible=true}
 add(child){this.children.push(child)}
}
const THREE={Mesh,ConeGeometry:class{},TorusGeometry:class{}};
const cat=new Mesh(),head=new Mesh();
const ell=(parent,material,x,y,z)=>{const node=new Mesh(null,material);node.position.set(x,y,z);parent.add(node);return node};
const model=decoratePibo({THREE,cat,head,ell,mat:color=>({color})});
assert(cat.children.length>6,'Pibo has original collar, paw details and fur markings');
assert(head.children.length>6,'Pibo head has whisker freckles and ear tufts');
assert.equal(model.tongue.visible,false,'Tongue is initially hidden');
model.update(2,.41);assert.equal(model.tongue.visible,true);
model.update(2,.02);assert.equal(model.tongue.visible,false);
const original=model.pendant.rotation.z;
model.update(3,.2,true);
assert.equal(model.pendant.rotation.z,original,'Reduced-motion setting stops ornament motion');
console.log('PASS: custom original Pibo mesh details and reactive mouth');
