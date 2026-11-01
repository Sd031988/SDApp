import assert from 'node:assert/strict';
import {PiboCare} from './pibo-care.js';
// Lightweight Three.js doubles: real care logic, no WebGL dependency.
class V{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}setScalar(n){return this.set(n,n,n)}}
class N{constructor(){this.children=[];this.userData={};this.position=new V();this.rotation=new V();this.scale=new V(1,1,1);this.visible=true}add(o){this.children.push(o)}remove(o){this.children=this.children.filter(c=>c!==o)}traverse(f){f(this);for(const c of this.children)c.traverse(f)}}
class G{dispose(){}}class M{dispose(){}}class Mesh extends N{constructor(g,m){super();this.geometry=g;this.material=m}}
const THREE={Group:N,Mesh,MeshStandardMaterial:M,SphereGeometry:G,BoxGeometry:G,ConeGeometry:G,CylinderGeometry:G,TorusGeometry:G};
function fixture(){const cat=new N(),head=new N(),mouth=new N(),paws=[new N(),new N()],sounds=[];const care=new PiboCare({THREE,scene:new N(),cat,head,mouth,paws,camera:{position:new V(),lookAt(){}},sound:s=>sounds.push(s),onStatus(){}});return {care,cat,head,paws,sounds}}
{
 const {care,cat,head,paws}=fixture(),t=performance.now();
 care.start('wash',0,t);care.update(1,t+120000);
 const shower=care.props.children.find(o=>o.userData.piboCareTool==='rinse');
 const towel=care.props.children.find(o=>o.userData.piboCareTool==='dry');
 assert.ok(shower&&towel,'Original 3D shower and towel exist');
 assert.equal(shower.visible,false);assert.equal(towel.visible,false);
 assert.equal(care.moveTool('rinse',{x:0,y:1}),false,'Hidden shower is not draggable');
 assert.equal(care.active?.type,'wash','Bath must not time out');
 assert.equal(care.rinse(),false,'Rinse needs soap');
 for(let j=0;j<3;j++)assert.equal(care.scrub(),true);
 assert.equal(shower.visible,true,'3D shower appears after enough soap');
 assert.equal(care.moveTool('rinse',{x:Infinity,y:1}),false,'Reject invalid pointer coordinates');
 assert.equal(care.moveTool('rinse',{x:-2.5,y:1.3}),true);
 assert.equal(shower.position.x,-2.5);
 assert.equal(care.rinse(),true);
 assert.equal(shower.visible,false);assert.equal(towel.visible,true,'3D towel appears after rinse');
 assert.equal(care.moveTool('dry',{x:-2.4,y:1.4}),true);care.update(2,t+180000);
 assert.equal(care.active?.type,'wash','Towel must remain available');
 assert.equal(care.dry(),true);assert.equal(towel.userData.towel,true);
 care.update(3,performance.now()+3000);
 assert.equal(care.active,null);assert.equal(cat.position.x,0);assert.equal(head.rotation.x,0);
 for(const paw of paws)assert.equal(paw.position.y,.21);
 assert.equal(care.props.children.length,0,'Dispose all 3D care props after use');
}
{
 const {care,sounds}=fixture(),t=performance.now();
 care.start('toilet',0,t);care.update(1,t+120000);
 assert.equal(care.active?.type,'toilet','Manual flush must remain available');
 assert.equal(care.active.phase,2);assert.equal(care.flush(),true);
 assert.equal(care.flush(),false);assert.ok(sounds.includes('flush'));
 care.update(2,performance.now()+3000);assert.equal(care.active,null);
}
{
 const {care}=fixture(),t=performance.now();
 care.start('feed',0,t);care.update(1,t+9000);assert.equal(care.active,null);
 care.start('sleep',0,t);care.update(2,t+10000);assert.equal(care.active,null);
}
console.log('PASS: 3D shower/towel gesture state, bath soap/rinse/dry, toilet flush, feeding, sleep and cleanup');
