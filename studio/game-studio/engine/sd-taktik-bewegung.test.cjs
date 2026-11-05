'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('./sd-taktik-bewegung.js');
const INPUT = { dt: 1/60, vor: 1, seit: 0, sprint: false, zielen:false,
  ducken:false, links:false, rechts:false, amBoden:true };
test('Opt-in module exposes a pure control model', () => {
  const s=T.zustand();
  assert.equal(s.aktiv,false);
  assert.equal(T.berechnen(s,INPUT,1/60).tempo,T.SPEED.gehen);
  assert.equal(T.berechnen(s,{...INPUT,sprint:true},1/60).tempo,T.SPEED.sprint);
});
test('Prone toggles and blocks jumping; sprint stands again',()=>{
  const s=T.zustand();
  let x=T.berechnen(s,{...INPUT,liegenToggle:true},1/60);
  assert.equal(x.form,'liegen');
  assert.equal(x.tempo,1.3);
  assert.equal(x.springVerbot,true);
  x=T.berechnen(s,{...INPUT,sprint:true},1/60);
  assert.equal(x.form,'stehen');
  assert.equal(x.springVerbot,false);
});
test('Crouch, ADS and lean remain bounded and never reverse motion',()=>{
  const s=T.zustand();
  assert.equal(T.berechnen(s,{...INPUT,ducken:true},1/60).tempo,T.SPEED.ducken);
  assert.equal(T.berechnen(s,{...INPUT,zielen:true},1/60).tempo,T.SPEED.zielen);
  for(let i=0;i<50;i++)T.berechnen(s,{...INPUT,zielen:true,links:true},1/60);
  assert.ok(s.neigung<=0&&s.neigung>=-1);
  for(let i=0;i<80;i++)T.berechnen(s,{...INPUT,zielen:true,rechts:true},1/60);
  assert.ok(s.neigung>=0&&s.neigung<=1);
});
test('Slide requires grounded forward sprint, preserves direction and expires',()=>{
  const s=T.zustand();
  assert.equal(T.berechnen(s,{...INPUT,rutschenToggle:true},1/60).rutschend,false);
  let x=T.berechnen(s,{...INPUT,sprint:true,rutschenToggle:true,seit:0.2},1/60);
  assert.equal(x.rutschend,true);
  assert.equal(x.springVerbot,true);
  assert.deepEqual(x.rutschRichtung,[1,0.2]);
  for(let i=0;i<80;i++)x=T.berechnen(s,INPUT,1/60);
  assert.equal(x.rutschend,false);
});
function bindeMock(hasResize=true) {
  class V {
    constructor(x,y,z) {this.x=x;this.y=y;this.z=z;}
    add(q) {return new V(this.x+q.x,this.y+q.y,this.z+q.z);}
    scale(n) {return new V(this.x*n,this.y*n,this.z*n);}
  }
  class Shape {constructor(a,b,r) {this.a=a;this.b=b;this.r=r;}dispose(){this.disposed=true;}}
  const shape={original:true};
  const cc={
    getPosition(){return this.pos;},
    setPosition(p){this.pos=p;},
    getVelocity(){return new V(0,0,0);},
    pos:new V(0,.9,0)
  };
  if(hasResize)cc.shape=shape;
  const ctx={BAB:{Vector3:V,PhysicsShapeCapsule:Shape,Ray:class{}},
    tasten:{},tastenHandler:{},szene:{pickWithRay(){return {hit:false}}},
    aufraeumen:[],zeit:3,opt:{einstellungen:{}},nachricht(){},
    uebernahme:null,strahl(){return {hit:false}}};
  const m=T.binden(ctx);
  const spieler={cc,boost:0,zustand:{luft:0},k:{rotation:{x:0,z:0},position:{y:0}}};
  const input=(extra={})=>({...INPUT,spieler,tasten:ctx.tasten,touch:{},maus:{rechts:false},...extra});
  return {ctx,m,cc,spieler,input,shape};
}
test('Engine hooks stay disabled until the Nordhafen game requests sd.taktik()',()=>{
  const x=bindeMock();
  assert.equal(x.ctx.taktikVor,undefined);
  assert.equal(typeof x.m.api.taktik,'function');
  x.m.api.taktik();
  assert.equal(typeof x.ctx.taktikVor,'function');
});
test('Actual character capsule height changes on prone and returns safely',()=>{
  const x=bindeMock();x.m.api.taktik();
  x.ctx.tasten.Z=true;x.ctx.tastenHandler.Z[0]();
  let r=x.ctx.taktikVor(x.input());
  assert.equal(r.form,'liegen');
  assert.equal(x.spieler.taktikHalbhoehe,.38);
  assert.ok(Math.abs(x.cc.pos.y-.38)<1e-6);
  assert.equal(x.spieler.taktikKopfOffset,.12);
  x.ctx.tasten.Z=false;x.ctx.taktikVor(x.input()); // key release
  x.ctx.tasten.Z=true;x.ctx.tastenHandler.Z[0]();
  r=x.ctx.taktikVor(x.input());
  assert.equal(r.form,'stehen');
  assert.ok(Math.abs(x.cc.pos.y-.9)<1e-6);
  assert.equal(x.cc.shape,x.shape);
  x.ctx.aufraeumen.forEach(f=>f());
});
test('If capsule changing is unsupported, movement and camera still work with honest visual fallback',()=>{
  const x=bindeMock(false);x.m.api.taktik();
  x.ctx.tasten.Z=true;x.ctx.tastenHandler.Z[0]();
  const r=x.ctx.taktikVor(x.input());
  assert.equal(r.form,'liegen');
  assert.equal(x.spieler.taktikHalbhoehe,.9);
  assert.ok(x.spieler.taktikKopfOffset < 0);
  assert.equal(x.cc.pos.y,.9);
});
test('Overhead clearance blocks standing up in a low space',()=>{
  const x=bindeMock();x.m.api.taktik();
  x.ctx.tasten.Z=true;x.ctx.tastenHandler.Z[0]();x.ctx.taktikVor(x.input());
  x.ctx.szene.pickWithRay=()=>({hit:true});
  x.ctx.tasten.Z=false;x.ctx.taktikVor(x.input());
  x.ctx.tasten.Z=true;x.ctx.tastenHandler.Z[0]();
  const r=x.ctx.taktikVor(x.input());
  assert.equal(r.form,'liegen');
  assert.equal(x.spieler.taktikHalbhoehe,.38);
});
test('Input helpers: single-toggle key-repeat protection, shoulder and lean',()=>{
  const x=bindeMock();x.m.api.taktik();
  x.ctx.tasten.Z=true;x.ctx.tastenHandler.Z[0]();x.ctx.tastenHandler.Z[0]();
  assert.equal(x.ctx.taktikVor(x.input()).form,'liegen');
  x.ctx.tasten.Z=false;x.ctx.taktikVor(x.input());
  x.ctx.tasten.Z=true;x.ctx.tastenHandler.Z[0]();
  assert.equal(x.ctx.taktikVor(x.input()).form,'stehen');
  x.ctx.tasten.B=true;x.ctx.tastenHandler.B[0]();
  x.ctx.tasten.Q=true;
  x.ctx.taktikVor(x.input({maus:{rechts:true}}));
  assert.equal(x.spieler.taktikSchulter,-1);
  assert.ok(x.spieler.taktikNeigung<0);
});
