import assert from 'node:assert/strict';
import {gardenMotion,buildPiboGarden} from './pibo-garden.mjs';
const p=gardenMotion(.3);
assert(p.flutter>.3&&p.flutter<1);
assert.equal(gardenMotion(.3,true).bob,0);
const pos=()=>({x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z})}});
class Node{
 constructor(){this.children=[];this.position=pos();this.rotation=pos();this.scale={set(){}}}
 add(e){this.children.push(e)}
}
const group=new Node(),made=[];
const ell=(parent,mat,x,y,z)=>{const o=new Node();o.position.set(x,y,z);parent.add(o);made.push(o);return o};
const cube=(parent,col,x,y,z)=>{const o=new Node();o.position.set(x,y,z);parent.add(o);made.push(o);return o};
const garden=buildPiboGarden({THREE:{Group:Node},roomProps:group,ell,cube,mat:c=>({color:c})});
assert.equal(garden.butterflies.length,3);
assert(garden.meshCount>15&&made.length<100,'Scene contains original furnishings but stays light enough for phones');
garden.animate(4,false);
assert.notEqual(garden.butterflies[0].position.y,0);
garden.animate(5,true);
assert(garden.tryCatch({intersectObjects(){return [{}]}}));
assert(!garden.tryCatch({intersectObjects(){return []}}));
console.log('PASS: original animated garden with 3 interactable butterflies and low mobile geometry budget');
